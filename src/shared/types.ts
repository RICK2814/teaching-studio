// Shared types between main process, dashboard renderer, and overlay renderer.

export type BubbleShape = 'circle' | 'rounded' | 'square'
export type BubblePreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom'
export type BackgroundMode =
  | 'original'
  | 'blur-soft'
  | 'blur-strong'
  | 'studio'
  | 'office'
  | 'dark-studio'
  | 'blackboard'
  | 'classroom'
  | 'gradient'
  | 'custom'

export type AudioMode = 'mic' | 'system' | 'mic+system'
export type QualityPreset = 'standard' | 'high' | 'veryhigh' | 'custom'

export interface BubbleSettings {
  shape: BubbleShape
  preset: BubblePreset
  x: number
  y: number
  sizePx: number // diameter/edge in physical pixels
  locked: boolean
  borderEnabled: boolean
  borderThickness: number
  shadowEnabled: boolean
  shadowIntensity: number // 0-100
  mirror: boolean
}

export interface BackgroundSettings {
  mode: BackgroundMode
  customImagePath?: string
}

export interface CameraSettings {
  deviceId: string | null
  resolution: '720p' | '1080p' | '1440p' | '4k'
  fps: 30 | 60
  enabled: boolean
}

export interface MicSettings {
  deviceId: string | null
  enabled: boolean
  gain: number // 0-200 (%)
}

export interface AudioSettings {
  mode: AudioMode
}

export interface VideoQualitySettings {
  preset: QualityPreset
  resolution: '720p' | '1080p' | '1440p' | '4k'
  fps: 30 | 60
  bitrateKbps: number
  encoder: 'auto' | 'nvenc' | 'qsv' | 'amf' | 'x264'
}

export interface OutputSettings {
  folder: string
  filenamePrefix: string
}

export interface Hotkeys {
  startPause: string
  stop: string
  toggleCamera: string
  toggleMic: string
}

export interface AppSettings {
  bubble: BubbleSettings
  background: BackgroundSettings
  camera: CameraSettings
  mic: MicSettings
  audio: AudioSettings
  video: VideoQualitySettings
  output: OutputSettings
  hotkeys: Hotkeys
  firstRunComplete: boolean
}

export interface RecordingHistoryItem {
  id: string
  title: string
  filePath: string
  thumbnailPath?: string
  durationSec: number
  resolution: string
  fileSizeBytes: number
  createdAt: string
}

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'saving'

export const DEFAULT_SETTINGS: AppSettings = {
  bubble: {
    shape: 'circle',
    preset: 'bottom-right',
    x: -1, // -1 = "use preset", resolved at runtime against screen bounds
    y: -1,
    sizePx: 220,
    locked: false,
    borderEnabled: true,
    borderThickness: 3,
    shadowEnabled: true,
    shadowIntensity: 40,
    mirror: true
  },
  background: {
    mode: 'studio'
  },
  camera: {
    deviceId: null,
    resolution: '1080p',
    fps: 30,
    enabled: true
  },
  mic: {
    deviceId: null,
    enabled: true,
    gain: 100
  },
  audio: {
    mode: 'mic+system'
  },
  video: {
    preset: 'high',
    resolution: '1080p',
    fps: 30,
    bitrateKbps: 12000,
    encoder: 'auto'
  },
  output: {
    folder: '', // resolved to Videos/Teaching Studio at runtime
    filenamePrefix: 'Lecture'
  },
  hotkeys: {
    startPause: 'F9',
    stop: 'F10',
    toggleCamera: 'F8',
    toggleMic: 'F7'
  },
  firstRunComplete: false
}

// ---- IPC channel names (single source of truth) ----
export const IPC = {
  // settings
  GET_SETTINGS: 'settings:get',
  SET_SETTINGS: 'settings:set',
  SETTINGS_CHANGED: 'settings:changed', // main -> renderers (broadcast)

  // devices
  LIST_CAMERAS: 'devices:list-cameras',
  LIST_MICS: 'devices:list-mics',
  LIST_SCREEN_SOURCES: 'devices:list-screen-sources',

  // recording lifecycle
  START_RECORDING: 'recording:start',
  PAUSE_RECORDING: 'recording:pause',
  RESUME_RECORDING: 'recording:resume',
  STOP_RECORDING: 'recording:stop',
  RECORDING_STATE_CHANGED: 'recording:state-changed', // main -> dashboard
  RECORDING_TICK: 'recording:tick', // main -> dashboard, elapsed seconds
  RECORDING_SAVE_CHUNK: 'recording:save-chunk', // dashboard -> main (binary chunk relay)
  RECORDING_FINALIZE: 'recording:finalize', // dashboard -> main, triggers ffmpeg mux

  // history
  GET_HISTORY: 'history:get',
  DELETE_HISTORY_ITEM: 'history:delete',
  OPEN_HISTORY_ITEM: 'history:open',
  SHOW_HISTORY_ITEM_IN_FOLDER: 'history:show-in-folder',

  // overlay window control
  OVERLAY_SET_BUBBLE: 'overlay:set-bubble', // main -> overlay, push bubble settings
  OVERLAY_DRAG_START: 'overlay:drag-start', // overlay -> main
  OVERLAY_DRAG_MOVE: 'overlay:drag-move', // overlay -> main, {dx, dy}
  OVERLAY_DRAG_END: 'overlay:drag-end', // overlay -> main
  OVERLAY_SET_CLICK_THROUGH: 'overlay:set-click-through', // main -> overlay window (native call)
  OVERLAY_VISIBILITY: 'overlay:set-visible', // main -> overlay

  // window control
  MINIMIZE_DASHBOARD: 'window:minimize-dashboard',
  RESTORE_DASHBOARD: 'window:restore-dashboard',

  // dialogs
  PICK_OUTPUT_FOLDER: 'dialog:pick-output-folder',
  PICK_CUSTOM_BACKGROUND: 'dialog:pick-custom-background',

  // hotkey events (main -> dashboard)
  HOTKEY_START_PAUSE: 'hotkey:start-pause',
  HOTKEY_STOP: 'hotkey:stop',
  HOTKEY_TOGGLE_CAMERA: 'hotkey:toggle-camera',
  HOTKEY_TOGGLE_MIC: 'hotkey:toggle-mic',

  // close guard
  APP_CLOSE_REQUEST: 'app:close-request', // main -> dashboard, ask "are you sure"
  APP_CLOSE_CONFIRM: 'app:close-confirm' // dashboard -> main
} as const

export interface ScreenSourceInfo {
  id: string
  name: string
  thumbnailDataUrl: string
}
