import { AppSettings, AudioMode } from '@shared/types'

export interface EngineHandles {
  stop: () => void
  pause: () => void
  resume: () => void
}

interface StartArgs {
  settings: AppSettings
  onChunk: (chunk: ArrayBuffer) => void
  onError: (err: Error) => void
}

const resMap: Record<AppSettings['video']['resolution'], { w: number; h: number }> = {
  '720p': { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
  '1440p': { w: 2560, h: 1440 },
  '4k': { w: 3840, h: 2160 }
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return 'video/webm'
}

/**
 * Starts capture. Returns control handles once the underlying streams and
 * MediaRecorder are live. Because the camera bubble is a real always-on-top
 * transparent OS window, capturing the *screen* (getDisplayMedia, routed by
 * main's setDisplayMediaRequestHandler to the whole primary display) already
 * contains the composited bubble — no separate video track merge needed.
 */
export async function startCapture({ settings, onChunk, onError }: StartArgs): Promise<EngineHandles> {
  const { w, h } = resMap[settings.video.resolution]

  // 1. Screen (+ system audio loopback, if requested) — main auto-grants this.
  const wantsSystemAudio = settings.audio.mode !== 'mic'
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: w },
      height: { ideal: h },
      frameRate: { ideal: settings.video.fps }
    },
    audio: wantsSystemAudio
  } as MediaStreamConstraints)

  // 2. Microphone, if requested.
  let micStream: MediaStream | null = null
  const wantsMic: AudioMode[] = ['mic', 'mic+system']
  if (settings.mic.enabled && wantsMic.includes(settings.audio.mode)) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: settings.mic.deviceId ? { exact: settings.mic.deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
    } catch (err) {
      console.error('Microphone unavailable, continuing video-only', err)
    }
  }

  // 3. Mix whichever audio tracks are present through a single AudioContext
  //    so the final recording has exactly one clean audio track.
  const audioCtx = new AudioContext()
  const dest = audioCtx.createMediaStreamDestination()
  let anyAudio = false

  if (settings.audio.mode !== 'mic' && displayStream.getAudioTracks().length > 0) {
    const src = audioCtx.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks()))
    src.connect(dest)
    anyAudio = true
  }
  if (micStream && micStream.getAudioTracks().length > 0) {
    const gainNode = audioCtx.createGain()
    gainNode.gain.value = Math.max(0, settings.mic.gain) / 100
    const src = audioCtx.createMediaStreamSource(micStream)
    src.connect(gainNode).connect(dest)
    anyAudio = true
  }

  const combined = new MediaStream()
  displayStream.getVideoTracks().forEach((t) => combined.addTrack(t))
  if (anyAudio) dest.stream.getAudioTracks().forEach((t) => combined.addTrack(t))

  const recorder = new MediaRecorder(combined, {
    mimeType: pickMimeType(),
    videoBitsPerSecond: settings.video.bitrateKbps * 1000
  })

  recorder.ondataavailable = async (e) => {
    if (e.data && e.data.size > 0) {
      const buf = await e.data.arrayBuffer()
      onChunk(buf)
    }
  }
  recorder.onerror = (e) => onError(new Error(`MediaRecorder error: ${String((e as unknown as { error?: unknown }).error)}`))

  recorder.start(1000) // 1s timeslice -> crash-safe incremental chunks

  const cleanupTracks = () => {
    combined.getTracks().forEach((t) => t.stop())
    displayStream.getTracks().forEach((t) => t.stop())
    micStream?.getTracks().forEach((t) => t.stop())
    audioCtx.close().catch(() => undefined)
  }

  // If the user manually stops sharing via the OS/Chromium UI, treat it
  // as a stop request rather than leaving the app in a stuck state.
  displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
    if (recorder.state !== 'inactive') recorder.stop()
    cleanupTracks()
  })

  return {
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop()
      cleanupTracks()
    },
    pause: () => {
      if (recorder.state === 'recording') recorder.pause()
    },
    resume: () => {
      if (recorder.state === 'paused') recorder.resume()
    }
  }
}
