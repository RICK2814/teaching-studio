import { contextBridge, ipcRenderer } from 'electron'
import { IPC, AppSettings } from '@shared/types'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_SETTINGS),
  onSettingsChanged: (cb: (s: AppSettings) => void) => {
    const listener = (_e: unknown, s: AppSettings) => cb(s)
    ipcRenderer.on(IPC.SETTINGS_CHANGED, listener)
    return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, listener)
  },

  // Drag protocol: renderer reports screen-space cursor position (via
  // window.screenX/screenY + event offsets); main does the actual window
  // move so overlay stays perfectly in sync with the OS compositor.
  dragStart: (point: { x: number; y: number }) => ipcRenderer.send(IPC.OVERLAY_DRAG_START, point),
  dragMove: (point: { x: number; y: number }) => ipcRenderer.send(IPC.OVERLAY_DRAG_MOVE, point),
  dragEnd: () => ipcRenderer.send(IPC.OVERLAY_DRAG_END),

  // Hit-test based hover: called whenever the renderer determines the
  // cursor is (or isn't) over an opaque bubble pixel, so main can toggle
  // OS-level click-through accordingly. This is how "click outside the
  // bubble reaches the app underneath, click on the bubble reaches us"
  // is implemented without ever blocking the rest of the screen.
  setHover: (hovering: boolean) => ipcRenderer.send(IPC.OVERLAY_SET_CLICK_THROUGH, !hovering)
}

contextBridge.exposeInMainWorld('overlayBridge', api)

export type OverlayApi = typeof api
