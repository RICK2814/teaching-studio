import { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell, screen, session } from 'electron'
import path from 'path'
import fs from 'fs'
import { is } from './env'
import {
  IPC,
  AppSettings,
  ScreenSourceInfo,
  RecordingHistoryItem
} from '@shared/types'
import { getSettings, setSettings, patchSettings, getHistory, addHistoryItem, deleteHistoryItem, resolveDefaultOutputFolder } from './store'
import {
  createOverlayWindow,
  getOverlayWindow,
  applyBubbleBounds,
  moveOverlayBy,
  setOverlayClickThrough,
  setOverlayVisible,
  destroyOverlayWindow
} from './overlayWindow'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { beginRecording, appendChunk, markPauseStart, markPauseEnd, finalizeRecording, findOrphanedRecordings } from './recorder'
import { v4 as uuid } from 'uuid'

let dashboardWin: BrowserWindow | null = null
let dragOrigin: { x: number; y: number } | null = null
let closeConfirmed = false
let currentRecordingId: string | null = null

function createDashboardWindow(): void {
  dashboardWin = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b0d12',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/dashboard.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // Fix: sandboxed preload can't require() the shared chunk file that
      // electron-vite splits out, so contextBridge.exposeInMainWorld never ran.
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    dashboardWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/dashboard/index.html`)
  } else {
    dashboardWin.loadFile(path.join(__dirname, '../renderer/dashboard/index.html'))
  }

  dashboardWin.on('close', (e) => {
    if (currentRecordingId && !closeConfirmed) {
      e.preventDefault()
      dashboardWin?.webContents.send(IPC.APP_CLOSE_REQUEST)
    }
  })

  dashboardWin.on('closed', () => {
    dashboardWin = null
  })
}

app.whenReady().then(() => {
  const settings = getSettings()
  if (!settings.output.folder) {
    patchSettings({ output: { ...settings.output, folder: resolveDefaultOutputFolder() } })
  }
  if (!fs.existsSync(settings.output.folder)) {
    fs.mkdirSync(settings.output.folder, { recursive: true })
  }

  // Auto-grant the whole primary display for capture, with system-audio
  // loopback, so the teacher is never interrupted by a screen picker —
  // "start recording" just starts. The overlay bubble window is a real
  // OS-composited window, so it is naturally included in this capture;
  // we never have to manually composite the camera into the video.
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    const primarySource = sources[0]
    if (primarySource) {
      callback({ video: primarySource, audio: 'loopback' })
    } else {
      callback({})
    }
  })

  createDashboardWindow()
  createOverlayWindow()

  dashboardWin?.webContents.once('did-finish-load', () => {
    applyBubbleBounds(getSettings().bubble)
    setOverlayVisible(getSettings().camera.enabled)
    if (dashboardWin) registerHotkeys(getSettings().hotkeys, dashboardWin)

    const orphans = findOrphanedRecordings()
    if (orphans.length) {
      dashboardWin?.webContents.send('recovery:found', orphans)
    }
  })

  screen.on('display-metrics-changed', () => applyBubbleBounds(getSettings().bubble))
  screen.on('display-removed', () => applyBubbleBounds(getSettings().bubble))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createDashboardWindow()
  })
})

app.on('window-all-closed', () => {
  unregisterHotkeys()
  destroyOverlayWindow()
  if (process.platform !== 'darwin') app.quit()
})

// ---------------- Settings ----------------
ipcMain.handle(IPC.GET_SETTINGS, () => getSettings())
ipcMain.handle(IPC.SET_SETTINGS, (_e, next: AppSettings) => {
  const saved = setSettings(next)
  applyBubbleBounds(saved.bubble)
  setOverlayVisible(saved.camera.enabled)
  if (dashboardWin) registerHotkeys(saved.hotkeys, dashboardWin)
  broadcastSettings(saved)
  return saved
})

function broadcastSettings(s: AppSettings) {
  getOverlayWindow()?.webContents.send(IPC.SETTINGS_CHANGED, s)
  dashboardWin?.webContents.send(IPC.SETTINGS_CHANGED, s)
}

// ---------------- Devices ----------------
ipcMain.handle(IPC.LIST_SCREEN_SOURCES, async (): Promise<ScreenSourceInfo[]> => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 320, height: 180 }
  })
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnailDataUrl: s.thumbnail.toDataURL()
  }))
})

// ---------------- Overlay bubble control ----------------
ipcMain.on(IPC.OVERLAY_DRAG_START, (_e, screenPoint: { x: number; y: number }) => {
  dragOrigin = screenPoint
  setOverlayClickThrough(false)
})

ipcMain.on(IPC.OVERLAY_DRAG_MOVE, (_e, screenPoint: { x: number; y: number }) => {
  if (!dragOrigin) return
  const dx = screenPoint.x - dragOrigin.x
  const dy = screenPoint.y - dragOrigin.y
  dragOrigin = screenPoint
  const bounds = moveOverlayBy(dx, dy)
  const s = getSettings()
  patchSettings({ bubble: { ...s.bubble, preset: 'custom', x: bounds.x, y: bounds.y } })
})

ipcMain.on(IPC.OVERLAY_DRAG_END, () => {
  dragOrigin = null
  const locked = getSettings().bubble.locked
  setOverlayClickThrough(true)
  void locked
})

ipcMain.on(IPC.OVERLAY_SET_CLICK_THROUGH, (_e, clickThrough: boolean) => {
  // Never re-enable click-through mid-drag (drag start already disabled it).
  if (dragOrigin) return
  setOverlayClickThrough(clickThrough)
})

// ---------------- Window control ----------------
ipcMain.on(IPC.MINIMIZE_DASHBOARD, () => dashboardWin?.minimize())
ipcMain.on(IPC.RESTORE_DASHBOARD, () => {
  dashboardWin?.restore()
  dashboardWin?.focus()
})

// ---------------- Dialogs ----------------
ipcMain.handle(IPC.PICK_OUTPUT_FOLDER, async () => {
  if (!dashboardWin) return null
  const res = await dialog.showOpenDialog(dashboardWin, { properties: ['openDirectory', 'createDirectory'] })
  if (res.canceled || !res.filePaths[0]) return null
  return res.filePaths[0]
})

ipcMain.handle(IPC.PICK_CUSTOM_BACKGROUND, async () => {
  if (!dashboardWin) return null
  const res = await dialog.showOpenDialog(dashboardWin, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  })
  if (res.canceled || !res.filePaths[0]) return null
  return res.filePaths[0]
})

// ---------------- Recording lifecycle ----------------
ipcMain.handle(IPC.START_RECORDING, () => {
  const { id } = beginRecording()
  currentRecordingId = id
  return { id }
})

ipcMain.on(IPC.RECORDING_SAVE_CHUNK, (_e, chunk: ArrayBuffer) => {
  appendChunk(Buffer.from(chunk))
})

ipcMain.handle(IPC.PAUSE_RECORDING, () => markPauseStart())
ipcMain.handle(IPC.RESUME_RECORDING, () => markPauseEnd())

ipcMain.handle(IPC.RECORDING_FINALIZE, async (_e, title: string) => {
  const settings = getSettings()
  const safeTitle = (title || `${settings.output.filenamePrefix}_${String(Date.now())}`).replace(/[\\/:*?"<>|]/g, '_')
  const outputFilePath = path.join(settings.output.folder, `${safeTitle}.mp4`)

  const result = await finalizeRecording({ outputFilePath, video: settings.video })
  currentRecordingId = null

  if (result.ok) {
    const item: RecordingHistoryItem = {
      id: uuid(),
      title: safeTitle,
      filePath: result.outputFilePath,
      durationSec: result.durationSec,
      resolution: `${settings.video.resolution}`,
      fileSizeBytes: result.fileSizeBytes,
      createdAt: new Date().toISOString()
    }
    addHistoryItem(item)
  }

  return result
})

// ---------------- History ----------------
ipcMain.handle(IPC.GET_HISTORY, () => getHistory())
ipcMain.handle(IPC.DELETE_HISTORY_ITEM, (_e, id: string, alsoDeleteFile: boolean) => {
  const items = getHistory()
  const item = items.find((i) => i.id === id)
  if (item && alsoDeleteFile && fs.existsSync(item.filePath)) {
    try {
      fs.unlinkSync(item.filePath)
    } catch {
      /* non-fatal */
    }
  }
  deleteHistoryItem(id)
})
ipcMain.handle(IPC.OPEN_HISTORY_ITEM, (_e, filePath: string) => shell.openPath(filePath))
ipcMain.handle(IPC.SHOW_HISTORY_ITEM_IN_FOLDER, (_e, filePath: string) => shell.showItemInFolder(filePath))

// ---------------- Close guard ----------------
ipcMain.on(IPC.APP_CLOSE_CONFIRM, (_e, confirmed: boolean) => {
  if (confirmed) {
    closeConfirmed = true
    currentRecordingId = null
    dashboardWin?.close()
  }
})

// ---------------- Multi-monitor safety: re-clamp bubble on display changes ----------------
// Registered inside whenReady (not at module scope) since `screen` cannot
// be touched before the app 'ready' event fires.
