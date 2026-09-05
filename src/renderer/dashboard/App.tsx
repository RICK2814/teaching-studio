import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppSettings, DEFAULT_SETTINGS, RecordingState, BackgroundMode, BubbleShape, BubblePreset, AudioMode } from '@shared/types'
import { Panel, Row, Toggle, Select, Slider, SegmentedButtons, formatDuration } from './ui'
import RecordingHistory from './RecordingHistory'
import FirstRunWizard from './FirstRunWizard'
import { startCapture, EngineHandles } from './recordingEngine'
import { compositeFrame } from '../overlay/compositor'

const BACKGROUND_OPTIONS: { value: BackgroundMode; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'blur-soft', label: 'Soft Blur' },
  { value: 'blur-strong', label: 'Strong Blur' },
  { value: 'studio', label: 'Professional Studio' },
  { value: 'office', label: 'Modern Office' },
  { value: 'dark-studio', label: 'Dark Studio' },
  { value: 'blackboard', label: 'Blackboard' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'gradient', label: 'Gradient Studio' },
  { value: 'custom', label: 'Custom Image' }
]

export default function App(): React.JSX.Element {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [recState, setRecState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [historyKey, setHistoryKey] = useState(0)
  const [micLevel, setMicLevel] = useState(0)
  const [showCloseGuard, setShowCloseGuard] = useState(false)
  const [lastTitle, setLastTitle] = useState('')

  const engineRef = useRef<EngineHandles | null>(null)
  const timerRef = useRef<number | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const meterStreamRef = useRef<MediaStream | null>(null)

  // ---- Load settings + device list on mount ----
  useEffect(() => {
    window.studio.getSettings().then(setSettingsState)
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setCameras(devices.filter((d) => d.kind === 'videoinput'))
      setMics(devices.filter((d) => d.kind === 'audioinput'))
    })
  }, [])

  const saveSettings = useCallback((next: AppSettings) => {
    setSettingsState(next)
    window.studio.setSettings(next)
  }, [])

  function patch(partial: Partial<AppSettings>) {
    saveSettings({
      ...settings,
      ...partial,
      bubble: { ...settings.bubble, ...(partial.bubble ?? {}) },
      background: { ...settings.background, ...(partial.background ?? {}) },
      camera: { ...settings.camera, ...(partial.camera ?? {}) },
      mic: { ...settings.mic, ...(partial.mic ?? {}) },
      audio: { ...settings.audio, ...(partial.audio ?? {}) },
      video: { ...settings.video, ...(partial.video ?? {}) },
      output: { ...settings.output, ...(partial.output ?? {}) },
      hotkeys: { ...settings.hotkeys, ...(partial.hotkeys ?? {}) }
    })
  }

  // ---- Local camera preview (independent of the overlay's own capture) ----
  useEffect(() => {
    let cancelled = false
    async function open() {
      previewStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (!settings.camera.enabled) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: settings.camera.deviceId ? { exact: settings.camera.deviceId } : undefined },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        previewStreamRef.current = stream
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream
          await previewVideoRef.current.play()
        }
      } catch (err) {
        console.error('Preview camera error', err)
      }
    }
    open()
    return () => {
      cancelled = true
    }
  }, [settings.camera.enabled, settings.camera.deviceId])

  // Live composited preview loop (reuses the exact same pipeline the overlay uses).
  useEffect(() => {
    let raf = 0
    let stopped = false
    async function loop(ts: number) {
      if (stopped) return
      const v = previewVideoRef.current
      const c = previewCanvasRef.current
      if (v && c && settings.camera.enabled) {
        try {
          await compositeFrame(
            { video: v, outCanvas: c, bubble: settings.bubble, backgroundMode: settings.background.mode, customImagePath: settings.background.customImagePath },
            ts
          )
        } catch {
          /* preview best-effort */
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [settings])

  // ---- Mic level meter ----
  useEffect(() => {
    let audioCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let raf = 0
    let stopped = false

    async function open() {
      meterStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (!settings.mic.enabled) {
        setMicLevel(0)
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: settings.mic.deviceId ? { exact: settings.mic.deviceId } : undefined }
        })
        meterStreamRef.current = stream
        audioCtx = new AudioContext()
        const src = audioCtx.createMediaStreamSource(stream)
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        src.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          if (stopped || !analyser) return
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / data.length)
          setMicLevel(Math.min(100, Math.round(rms * 220)))
          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch (err) {
        console.error('Mic meter error', err)
      }
    }
    open()
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      audioCtx?.close().catch(() => undefined)
    }
  }, [settings.mic.enabled, settings.mic.deviceId])

  // ---- Hotkeys ----
  useEffect(() => {
    const unsubs = [
      window.studio.onHotkeyStartPause(() => {
        if (recState === 'idle') void handleStart()
        else if (recState === 'recording') void handlePause()
        else if (recState === 'paused') void handleResume()
      }),
      window.studio.onHotkeyStop(() => {
        if (recState === 'recording' || recState === 'paused') void handleStop()
      }),
      window.studio.onHotkeyToggleCamera(() => patch({ camera: { ...settings.camera, enabled: !settings.camera.enabled } })),
      window.studio.onHotkeyToggleMic(() => patch({ mic: { ...settings.mic, enabled: !settings.mic.enabled } })),
      window.studio.onCloseRequest(() => setShowCloseGuard(true))
    ]
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, settings])

  // ---- Recording control flow ----
  async function handleStart() {
    setCountdown(3)
    for (let n = 3; n >= 1; n--) {
      setCountdown(n)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setCountdown(null)

    try {
      await window.studio.startRecording()
      const handles = await startCapture({
        settings,
        onChunk: (buf) => window.studio.sendChunk(buf),
        onError: (err) => console.error(err)
      })
      engineRef.current = handles
      setRecState('recording')
      setElapsed(0)
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
      window.studio.minimizeDashboard()
    } catch (err) {
      console.error('Failed to start recording', err)
      setRecState('idle')
    }
  }

  async function handlePause() {
    engineRef.current?.pause()
    await window.studio.pauseRecording()
    setRecState('paused')
    if (timerRef.current) window.clearInterval(timerRef.current)
  }

  async function handleResume() {
    engineRef.current?.resume()
    await window.studio.resumeRecording()
    setRecState('recording')
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  async function handleStop() {
    engineRef.current?.stop()
    engineRef.current = null
    if (timerRef.current) window.clearInterval(timerRef.current)
    setRecState('saving')
    window.studio.restoreDashboard()

    const title = lastTitle || `${settings.output.filenamePrefix}_${String(Date.now()).slice(-6)}`
    const result = await window.studio.finalizeRecording(title)
    setRecState('idle')
    setElapsed(0)
    setHistoryKey((k) => k + 1)
    if (!result.ok) {
      console.error('Finalize failed:', result.error)
      alert(`Recording could not be finalized automatically.\n\n${result.error ?? ''}`)
    }
  }

  const isRecording = recState === 'recording' || recState === 'paused'

  const bubbleShapeOptions = useMemo(
    () => [
      { value: 'circle' as BubbleShape, label: 'Circle' },
      { value: 'rounded' as BubbleShape, label: 'Rounded' },
      { value: 'square' as BubbleShape, label: 'Square' }
    ],
    []
  )
  const bubblePresetOptions = useMemo(
    () => [
      { value: 'bottom-right' as BubblePreset, label: 'Bottom Right' },
      { value: 'bottom-left' as BubblePreset, label: 'Bottom Left' },
      { value: 'top-right' as BubblePreset, label: 'Top Right' },
      { value: 'top-left' as BubblePreset, label: 'Top Left' },
      { value: 'custom' as BubblePreset, label: 'Custom (drag)' }
    ],
    []
  )

  return (
    <div className="h-screen flex flex-col bg-studio-bg text-studio-text">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-studio-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-studio-accent to-studio-accent2" />
          <span className="font-semibold tracking-wide">Teaching Studio</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isRecording && (
            <span className="flex items-center gap-1.5 text-studio-rec">
              <span className="w-2 h-2 rounded-full bg-studio-rec animate-pulse" /> RECORDING
            </span>
          )}
          <span className="tabular-nums text-studio-muted">{formatDuration(elapsed)}</span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* LEFT: live preview */}
        <div className="w-[420px] flex flex-col gap-4">
          <Panel title="Live Preview">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={previewVideoRef} muted playsInline style={{ display: 'none' }} />
              <div className="absolute bottom-3 right-3 rounded-full overflow-hidden shadow-lg" style={{ width: 96, height: 96 }}>
                <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%' }} />
              </div>
              <span className="text-xs text-studio-muted">Screen content appears here during recording</span>
            </div>
          </Panel>

          <Panel title="Recording">
            <div className="flex items-center gap-3">
              {recState === 'idle' && (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-studio-rec hover:opacity-90 text-white rounded-lg py-3 font-semibold"
                >
                  ● Start Recording
                </button>
              )}
              {recState === 'recording' && (
                <>
                  <button onClick={handlePause} className="flex-1 bg-studio-panel2 border border-studio-border rounded-lg py-3">
                    Pause
                  </button>
                  <button onClick={handleStop} className="flex-1 bg-studio-rec text-white rounded-lg py-3 font-semibold">
                    Stop & Save
                  </button>
                </>
              )}
              {recState === 'paused' && (
                <>
                  <button onClick={handleResume} className="flex-1 bg-studio-accent text-white rounded-lg py-3 font-semibold">
                    Resume
                  </button>
                  <button onClick={handleStop} className="flex-1 bg-studio-rec text-white rounded-lg py-3 font-semibold">
                    Stop & Save
                  </button>
                </>
              )}
              {recState === 'saving' && (
                <div className="flex-1 text-center py-3 text-studio-muted text-sm">Finalizing MP4…</div>
              )}
            </div>
            {countdown !== null && (
              <div className="mt-3 text-center text-2xl font-bold text-studio-accent">{countdown}</div>
            )}
            <div className="mt-3">
              <Row label="Lecture title">
                <input
                  value={lastTitle}
                  onChange={(e) => setLastTitle(e.target.value)}
                  placeholder={`${settings.output.filenamePrefix}_001`}
                  className="bg-studio-panel2 border border-studio-border rounded-md text-sm px-2 py-1 w-40"
                />
              </Row>
            </div>
          </Panel>

          <RecordingHistory refreshKey={historyKey} />
        </div>

        {/* RIGHT: controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 content-start pr-1">
          <Panel title="Camera">
            <Row label="Camera">
              <Toggle checked={settings.camera.enabled} onChange={(v) => patch({ camera: { ...settings.camera, enabled: v } })} />
            </Row>
            <Row label="Device">
              <Select
                value={settings.camera.deviceId ?? ''}
                onChange={(v) => patch({ camera: { ...settings.camera, deviceId: v || null } })}
                options={[{ value: '', label: 'System default' }, ...cameras.map((c) => ({ value: c.deviceId, label: c.label || 'Camera' }))]}
              />
            </Row>
            <Row label="Resolution">
              <Select
                value={settings.camera.resolution}
                onChange={(v) => patch({ camera: { ...settings.camera, resolution: v } })}
                options={[
                  { value: '720p', label: '720p' },
                  { value: '1080p', label: '1080p' },
                  { value: '1440p', label: '1440p' },
                  { value: '4k', label: '4K' }
                ]}
              />
            </Row>
            <Row label="FPS">
              <SegmentedButtons
                value={String(settings.camera.fps) as '30' | '60'}
                onChange={(v) => patch({ camera: { ...settings.camera, fps: Number(v) as 30 | 60 } })}
                options={[{ value: '30', label: '30' }, { value: '60', label: '60' }]}
              />
            </Row>
            <Row label="Mirror">
              <Toggle checked={settings.bubble.mirror} onChange={(v) => patch({ bubble: { ...settings.bubble, mirror: v } })} />
            </Row>
          </Panel>

          <Panel title="Camera Bubble">
            <Row label="Shape">
              <SegmentedButtons value={settings.bubble.shape} onChange={(v) => patch({ bubble: { ...settings.bubble, shape: v } })} options={bubbleShapeOptions} />
            </Row>
            <Row label="Position preset">
              <Select value={settings.bubble.preset} onChange={(v) => patch({ bubble: { ...settings.bubble, preset: v } })} options={bubblePresetOptions} />
            </Row>
            <Row label="Size">
              <Slider value={settings.bubble.sizePx} min={120} max={420} onChange={(v) => patch({ bubble: { ...settings.bubble, sizePx: v } })} />
            </Row>
            <Row label="Border">
              <Toggle checked={settings.bubble.borderEnabled} onChange={(v) => patch({ bubble: { ...settings.bubble, borderEnabled: v } })} />
            </Row>
            <Row label="Border thickness">
              <Slider value={settings.bubble.borderThickness} min={0} max={12} onChange={(v) => patch({ bubble: { ...settings.bubble, borderThickness: v } })} />
            </Row>
            <Row label="Shadow">
              <Toggle checked={settings.bubble.shadowEnabled} onChange={(v) => patch({ bubble: { ...settings.bubble, shadowEnabled: v } })} />
            </Row>
            <Row label="Shadow intensity">
              <Slider value={settings.bubble.shadowIntensity} min={0} max={100} onChange={(v) => patch({ bubble: { ...settings.bubble, shadowIntensity: v } })} />
            </Row>
            <Row label="Lock position">
              <Toggle checked={settings.bubble.locked} onChange={(v) => patch({ bubble: { ...settings.bubble, locked: v } })} />
            </Row>
          </Panel>

          <Panel title="Background Replacement">
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={async () => {
                    if (o.value === 'custom') {
                      const path = await window.studio.pickCustomBackground()
                      if (path) patch({ background: { mode: 'custom', customImagePath: path } })
                    } else {
                      patch({ background: { ...settings.background, mode: o.value } })
                    }
                  }}
                  className={`text-xs px-2 py-2 rounded-md border text-left ${
                    settings.background.mode === o.value
                      ? 'border-studio-accent bg-studio-accent/10 text-studio-text'
                      : 'border-studio-border bg-studio-panel2 text-studio-muted hover:text-studio-text'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Microphone">
            <Row label="Microphone">
              <Toggle checked={settings.mic.enabled} onChange={(v) => patch({ mic: { ...settings.mic, enabled: v } })} />
            </Row>
            <Row label="Device">
              <Select
                value={settings.mic.deviceId ?? ''}
                onChange={(v) => patch({ mic: { ...settings.mic, deviceId: v || null } })}
                options={[{ value: '', label: 'System default' }, ...mics.map((m) => ({ value: m.deviceId, label: m.label || 'Microphone' }))]}
              />
            </Row>
            <Row label="Gain">
              <Slider value={settings.mic.gain} min={0} max={200} onChange={(v) => patch({ mic: { ...settings.mic, gain: v } })} />
            </Row>
            <div className="mt-2">
              <div className="text-xs text-studio-muted mb-1">Mic level</div>
              <div className="w-full h-2 rounded-full bg-studio-panel2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-studio-accent to-studio-rec transition-all"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Audio Source">
            <Row label="Capture">
              <SegmentedButtons
                value={settings.audio.mode}
                onChange={(v: AudioMode) => patch({ audio: { mode: v } })}
                options={[
                  { value: 'mic', label: 'Mic only' },
                  { value: 'system', label: 'System only' },
                  { value: 'mic+system', label: 'Mic + System' }
                ]}
              />
            </Row>
          </Panel>

          <Panel title="Video Quality">
            <Row label="Preset">
              <Select
                value={settings.video.preset}
                onChange={(v) => {
                  const presets: Record<string, Partial<AppSettings['video']>> = {
                    standard: { resolution: '720p', fps: 30, bitrateKbps: 6000 },
                    high: { resolution: '1080p', fps: 30, bitrateKbps: 12000 },
                    veryhigh: { resolution: '1080p', fps: 60, bitrateKbps: 20000 },
                    custom: {}
                  }
                  patch({ video: { ...settings.video, preset: v as AppSettings['video']['preset'], ...presets[v] } })
                }}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'high', label: 'High' },
                  { value: 'veryhigh', label: 'Very High' },
                  { value: 'custom', label: 'Custom' }
                ]}
              />
            </Row>
            <Row label="Resolution">
              <Select
                value={settings.video.resolution}
                onChange={(v) => patch({ video: { ...settings.video, resolution: v, preset: 'custom' } })}
                options={[
                  { value: '720p', label: '720p' },
                  { value: '1080p', label: '1080p' },
                  { value: '1440p', label: '1440p' },
                  { value: '4k', label: '4K' }
                ]}
              />
            </Row>
            <Row label="FPS">
              <SegmentedButtons
                value={String(settings.video.fps) as '30' | '60'}
                onChange={(v) => patch({ video: { ...settings.video, fps: Number(v) as 30 | 60, preset: 'custom' } })}
                options={[{ value: '30', label: '30' }, { value: '60', label: '60' }]}
              />
            </Row>
            <Row label="Bitrate (kbps)">
              <Slider value={settings.video.bitrateKbps} min={2000} max={40000} onChange={(v) => patch({ video: { ...settings.video, bitrateKbps: v, preset: 'custom' } })} />
            </Row>
            <Row label="Encoder">
              <Select
                value={settings.video.encoder}
                onChange={(v) => patch({ video: { ...settings.video, encoder: v } })}
                options={[
                  { value: 'auto', label: 'Auto (recommended)' },
                  { value: 'nvenc', label: 'NVIDIA NVENC' },
                  { value: 'qsv', label: 'Intel QuickSync' },
                  { value: 'amf', label: 'AMD AMF' },
                  { value: 'x264', label: 'Software (x264)' }
                ]}
              />
            </Row>
          </Panel>

          <Panel title="Output">
            <Row label="Folder">
              <button
                className="text-xs px-2 py-1 rounded bg-studio-panel2 border border-studio-border max-w-[220px] truncate"
                onClick={async () => {
                  const folder = await window.studio.pickOutputFolder()
                  if (folder) patch({ output: { ...settings.output, folder } })
                }}
                title={settings.output.folder}
              >
                {settings.output.folder}
              </button>
            </Row>
            <Row label="Filename prefix">
              <input
                value={settings.output.filenamePrefix}
                onChange={(e) => patch({ output: { ...settings.output, filenamePrefix: e.target.value } })}
                className="bg-studio-panel2 border border-studio-border rounded-md text-sm px-2 py-1 w-32"
              />
            </Row>
          </Panel>

          <Panel title="Hotkeys" className="col-span-2">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <Row label="Start/Pause"><code className="text-studio-accent">{settings.hotkeys.startPause}</code></Row>
              <Row label="Stop"><code className="text-studio-accent">{settings.hotkeys.stop}</code></Row>
              <Row label="Camera"><code className="text-studio-accent">{settings.hotkeys.toggleCamera}</code></Row>
              <Row label="Mic"><code className="text-studio-accent">{settings.hotkeys.toggleMic}</code></Row>
            </div>
          </Panel>
        </div>
      </div>

      {showCloseGuard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-studio-panel border border-studio-border rounded-xl2 p-6 max-w-sm">
            <h3 className="font-semibold mb-2">Recording is in progress</h3>
            <p className="text-sm text-studio-muted mb-4">Stop and save before closing? Closing now will lose unsaved work.</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 rounded-md bg-studio-panel2 border border-studio-border" onClick={() => setShowCloseGuard(false)}>
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-studio-rec text-white"
                onClick={async () => {
                  await handleStop()
                  window.studio.confirmClose(true)
                }}
              >
                Stop & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {!settings.firstRunComplete && (
        <FirstRunWizard
          settings={settings}
          cameras={cameras}
          mics={mics}
          onPatch={patch}
          onDone={() => patch({ firstRunComplete: true })}
        />
      )}
    </div>
  )
}
