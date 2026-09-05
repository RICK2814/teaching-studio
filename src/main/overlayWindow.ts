import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { is } from './env'
import { BubbleSettings } from '@shared/types'

let overlayWin: BrowserWindow | null = null
let isDraggable = false // when true, click-through is disabled so the user can drag

export function createOverlayWindow(): BrowserWindow {
  const primary = screen.getPrimaryDisplay()

  overlayWin = new BrowserWindow({
    width: 300,
    height: 300,
    x: primary.workArea.x,
    y: primary.workArea.y,
    frame: false,
    transparent: true, // <-- true per-pixel alpha transparency, NOT a color key
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false, // we move it manually via setBounds so we control drag math precisely
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false, // never steal focus from the app the teacher is using
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/overlay.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // Same fix as the dashboard window (see main.ts) — sandboxed preload
      // can't require() the shared preload chunk that electron-vite emits.
      sandbox: false,
      backgroundThrottling: false // keep rendering camera frames even when not focused
    }
  })

  // Windows: keep the overlay above fullscreen apps / taskbar too.
  overlayWin.setAlwaysOnTop(true, 'screen-saver')
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Default: click-through ON. Only the opaque camera pixels should ever
  // intercept mouse events; everything else must pass to the app underneath.
  overlayWin.setIgnoreMouseEvents(true, { forward: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay/index.html`)
  } else {
    overlayWin.loadFile(path.join(__dirname, '../renderer/overlay/index.html'))
  }

  overlayWin.once('ready-to-show', () => overlayWin?.show())

  overlayWin.on('closed', () => {
    overlayWin = null
  })

  return overlayWin
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWin
}

/** Resolve a bubble preset (or custom x/y) against the current display bounds. */
export function resolveBubblePosition(bubble: BubbleSettings): { x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const { x: ox, y: oy, width, height } = display.workArea
  const margin = 32
  const size = bubble.sizePx

  if (bubble.preset === 'custom' && bubble.x >= 0 && bubble.y >= 0) {
    return { x: bubble.x, y: bubble.y }
  }

  switch (bubble.preset) {
    case 'bottom-left':
      return { x: ox + margin, y: oy + height - size - margin }
    case 'top-right':
      return { x: ox + width - size - margin, y: oy + margin }
    case 'top-left':
      return { x: ox + margin, y: oy + margin }
    case 'bottom-right':
    default:
      return { x: ox + width - size - margin, y: oy + height - size - margin }
  }
}

/** Apply size/position from settings to the actual OS window bounds. */
export function applyBubbleBounds(bubble: BubbleSettings): void {
  if (!overlayWin) return
  const { x, y } = resolveBubblePosition(bubble)
  // Add small padding around the visible bubble so shadow isn't clipped.
  const padding = bubble.shadowEnabled ? Math.ceil(bubble.shadowIntensity / 2) + 8 : 8
  const winSize = bubble.sizePx + padding * 2
  overlayWin.setBounds({
    x: Math.round(x - padding),
    y: Math.round(y - padding),
    width: Math.round(winSize),
    height: Math.round(winSize)
  })
}

/** Move the window by a delta, used while the user is actively dragging the bubble. */
export function moveOverlayBy(dx: number, dy: number): { x: number; y: number } {
  if (!overlayWin) return { x: 0, y: 0 }
  const b = overlayWin.getBounds()
  const next = { ...b, x: b.x + dx, y: b.y + dy }
  overlayWin.setBounds(next)
  return { x: next.x, y: next.y }
}

export function setOverlayClickThrough(clickThrough: boolean): void {
  if (!overlayWin) return
  isDraggable = !clickThrough
  overlayWin.setIgnoreMouseEvents(clickThrough, { forward: true })
}

export function isOverlayDraggable(): boolean {
  return isDraggable
}

export function setOverlayVisible(visible: boolean): void {
  if (!overlayWin) return
  if (visible) overlayWin.showInactive()
  else overlayWin.hide()
}

export function destroyOverlayWindow(): void {
  overlayWin?.destroy()
  overlayWin = null
}
