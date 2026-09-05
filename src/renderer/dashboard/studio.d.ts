import { AppSettings, RecordingHistoryItem, ScreenSourceInfo } from '@shared/types'

export interface StudioBridge {
  getSettings: () => Promise<AppSettings>
  setSettings: (s: AppSettings) => Promise<AppSettings>
  onSettingsChanged: (cb: (s: AppSettings) => void) => () => void

  listScreenSources: () => Promise<ScreenSourceInfo[]>

  pickOutputFolder: () => Promise<string | null>
  pickCustomBackground: () => Promise<string | null>

  minimizeDashboard: () => void
  restoreDashboard: () => void

  startRecording: () => Promise<{ id: string }>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  sendChunk: (chunk: ArrayBuffer) => void
  finalizeRecording: (
    title: string
  ) => Promise<{ ok: boolean; outputFilePath: string; durationSec: number; fileSizeBytes: number; error?: string }>

  getHistory: () => Promise<RecordingHistoryItem[]>
  deleteHistoryItem: (id: string, alsoDeleteFile: boolean) => Promise<void>
  openHistoryItem: (filePath: string) => Promise<void>
  showHistoryItemInFolder: (filePath: string) => Promise<void>

  onHotkeyStartPause: (cb: () => void) => () => void
  onHotkeyStop: (cb: () => void) => () => void
  onHotkeyToggleCamera: (cb: () => void) => () => void
  onHotkeyToggleMic: (cb: () => void) => () => void

  onCloseRequest: (cb: () => void) => () => void
  confirmClose: (confirmed: boolean) => void

  onRecoveryFound: (cb: (paths: string[]) => void) => () => void
}

declare global {
  interface Window {
    studio: StudioBridge
  }
}
