import { globalShortcut, BrowserWindow } from 'electron'
import { Hotkeys, IPC } from '@shared/types'

let registered: string[] = []

export function registerHotkeys(hotkeys: Hotkeys, dashboard: BrowserWindow): void {
  unregisterHotkeys()

  const bind = (accelerator: string, channel: string) => {
    try {
      const ok = globalShortcut.register(accelerator, () => {
        if (!dashboard.isDestroyed()) dashboard.webContents.send(channel)
      })
      if (ok) registered.push(accelerator)
    } catch {
      // Invalid accelerator string from a bad user preference — skip it
      // rather than crashing hotkey registration for the rest.
    }
  }

  bind(hotkeys.startPause, IPC.HOTKEY_START_PAUSE)
  bind(hotkeys.stop, IPC.HOTKEY_STOP)
  bind(hotkeys.toggleCamera, IPC.HOTKEY_TOGGLE_CAMERA)
  bind(hotkeys.toggleMic, IPC.HOTKEY_TOGGLE_MIC)
}

export function unregisterHotkeys(): void {
  registered.forEach((acc) => globalShortcut.unregister(acc))
  registered = []
}
