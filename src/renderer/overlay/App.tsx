import React, { useEffect, useRef, useState } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '@shared/types'
import { compositeFrame } from './compositor'

declare global {
  interface Window {
    overlayBridge: {
      getSettings: () => Promise<AppSettings>
      onSettingsChanged: (cb: (s: AppSettings) => void) => () => void
      dragStart: (p: { x: number; y: number }) => void
      dragMove: (p: { x: number; y: number }) => void
      dragEnd: () => void
      setHover: (hovering: boolean) => void
    }
  }
}

export default function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const draggingRef = useRef(false)

  // Load + subscribe to settings.
  useEffect(() => {
    window.overlayBridge.getSettings().then(setSettings)
    const unsub = window.overlayBridge.onSettingsChanged(setSettings)
    return unsub
  }, [])

  // (Re)acquire the camera stream whenever the chosen device or on/off state changes.
  useEffect(() => {
    let cancelled = false

    async function openCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null

      if (!settings.camera.enabled) return

      const resMap: Record<AppSettings['camera']['resolution'], { w: number; h: number }> = {
        '720p': { w: 1280, h: 720 },
        '1080p': { w: 1920, h: 1080 },
        '1440p': { w: 2560, h: 1440 },
        '4k': { w: 3840, h: 2160 }
      }
      const { w, h } = resMap[settings.camera.resolution]

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: settings.camera.deviceId ? { exact: settings.camera.deviceId } : undefined,
            width: { ideal: w },
            height: { ideal: h },
            frameRate: { ideal: settings.camera.fps }
          },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        // Camera unavailable/denied — bubble stays hidden, screen recording continues.
        console.error('Failed to open camera', err)
      }
    }

    openCamera()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.camera.enabled, settings.camera.deviceId, settings.camera.resolution, settings.camera.fps])

  // Render loop.
  useEffect(() => {
    let stopped = false

    async function loop(ts: number) {
      if (stopped) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && settings.camera.enabled) {
        try {
          await compositeFrame(
            {
              video,
              outCanvas: canvas,
              bubble: settings.bubble,
              backgroundMode: settings.background.mode,
              customImagePath: settings.background.customImagePath
            },
            ts
          )
        } catch (err) {
          console.error('Composite error', err)
        }
      } else if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      stopped = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [settings])

  // ---- Hover hit-testing (drives OS click-through toggling) ----
  // Electron forwards mousemove even while the window ignores mouse events
  // (ignoreMouseEvents(true, {forward:true})), which is what lets us do
  // real per-pixel hit-testing here: only opaque bubble pixels should ever
  // "capture" the cursor, so the rest of the transparent window truly lets
  // clicks fall through to the app underneath.
  const wasHoveringRef = useRef(false)
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      let hovering = false
      if (x >= 0 && y >= 0 && x < rect.width && y < rect.height) {
        const ctx = canvas.getContext('2d')
        const px = ctx?.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        hovering = !!px && px[3] > 10 // opaque-enough pixel
      }
      if (hovering !== wasHoveringRef.current) {
        wasHoveringRef.current = hovering
        window.overlayBridge.setHover(hovering)
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ---- Drag handling ----
  // The overlay window is click-through by default (set from main). Mouse
  // down on the bubble itself flips click-through off just long enough to
  // drag, then main restores it on mouse up.
  function onMouseDown(e: React.MouseEvent) {
    if (settings.bubble.locked) return
    draggingRef.current = true
    window.overlayBridge.dragStart({ x: e.screenX, y: e.screenY })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  function onMouseMove(e: MouseEvent) {
    if (!draggingRef.current) return
    window.overlayBridge.dragMove({ x: e.screenX, y: e.screenY })
  }
  function onMouseUp() {
    draggingRef.current = false
    window.overlayBridge.dragEnd()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const padding = settings.bubble.shadowEnabled ? Math.ceil(settings.bubble.shadowIntensity / 2) + 8 : 8

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: settings.bubble.sizePx,
          height: settings.bubble.sizePx,
          cursor: settings.bubble.locked ? 'default' : 'grab'
        }}
      />
    </div>
  )
}
