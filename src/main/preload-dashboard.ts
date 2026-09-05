import { contextBridge, ipcRenderer } from 'electron'
import { IPC, AppSettings } from '@shared/types'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_SETTINGS),
  setSettings: (s: AppSettings): Promise<AppSettings> => ipcRenderer.invoke(IPC.SET_SETTINGS, s),
  onSettingsChanged: (cb: (s: AppSettings) => void) => {
    const listener = (_e: unknown, s: AppSettings) => cb(s)
    ipcRenderer.on(IPC.SETTINGS_CHANGED, listener)
    return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, listener)
  },

  listScreenSources: () => ipcRenderer.invoke(IPC.LIST_SCREEN_SOURCES),

  pickOutputFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC.PICK_OUTPUT_FOLDER),
  pickCustomBackground: (): Promise<string | null> => ipcRenderer.invoke(IPC.PICK_CUSTOM_BACKGROUND),

  minimizeDashboard: () => ipcRenderer.send(IPC.MINIMIZE_DASHBOARD),
  restoreDashboard: () => ipcRenderer.send(IPC.RESTORE_DASHBOARD),

  startRecording: (): Promise<{ id: string }> => ipcRenderer.invoke(IPC.START_RECORDING),
  pauseRecording: () => ipcRenderer.invoke(IPC.PAUSE_RECORDING),
  resumeRecording: () => ipcRenderer.invoke(IPC.RESUME_RECORDING),
  sendChunk: (chunk: ArrayBuffer) => ipcRenderer.send(IPC.RECORDING_SAVE_CHUNK, chunk),
  finalizeRecording: (title: string) => ipcRenderer.invoke(IPC.RECORDING_FINALIZE, title),

  getHistory: () => ipcRenderer.invoke(IPC.GET_HISTORY),
  deleteHistoryItem: (id: string, alsoDeleteFile: boolean) => ipcRenderer.invoke(IPC.DELETE_HISTORY_ITEM, id, alsoDeleteFile),
  openHistoryItem: (filePath: string) => ipcRenderer.invoke(IPC.OPEN_HISTORY_ITEM, filePath),
  showHistoryItemInFolder: (filePath: string) => ipcRenderer.invoke(IPC.SHOW_HISTORY_ITEM_IN_FOLDER, filePath),

  onHotkeyStartPause: (cb: () => void) => subscribe(IPC.HOTKEY_START_PAUSE, cb),
  onHotkeyStop: (cb: () => void) => subscribe(IPC.HOTKEY_STOP, cb),
  onHotkeyToggleCamera: (cb: () => void) => subscribe(IPC.HOTKEY_TOGGLE_CAMERA, cb),
  onHotkeyToggleMic: (cb: () => void) => subscribe(IPC.HOTKEY_TOGGLE_MIC, cb),

  onCloseRequest: (cb: () => void) => subscribe(IPC.APP_CLOSE_REQUEST, cb),
  confirmClose: (confirmed: boolean) => ipcRenderer.send(IPC.APP_CLOSE_CONFIRM, confirmed),

  onRecoveryFound: (cb: (paths: string[]) => void) => {
    const listener = (_e: unknown, paths: string[]) => cb(paths)
    ipcRenderer.on('recovery:found', listener)
    return () => ipcRenderer.removeListener('recovery:found', listener)
  }
}

function subscribe(channel: string, cb: () => void) {
  const listener = () => cb()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('studio', api)

export type DashboardApi = typeof api
