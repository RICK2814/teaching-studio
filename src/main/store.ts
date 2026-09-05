import Store from 'electron-store'
import { app } from 'electron'
import path from 'path'
import { AppSettings, DEFAULT_SETTINGS } from '@shared/types'

const store = new Store<{ settings: AppSettings }>({
  name: 'teaching-studio-settings',
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

/** Resolve the default output folder lazily (needs `app` to be ready). */
export function resolveDefaultOutputFolder(): string {
  return path.join(app.getPath('videos'), 'Teaching Studio')
}

export function getSettings(): AppSettings {
  const s = store.get('settings')
  if (!s.output.folder) {
    s.output.folder = resolveDefaultOutputFolder()
  }
  return s
}

export function setSettings(next: AppSettings): AppSettings {
  store.set('settings', next)
  return next
}

export function patchSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const merged: AppSettings = {
    ...current,
    ...patch,
    bubble: { ...current.bubble, ...(patch.bubble ?? {}) },
    background: { ...current.background, ...(patch.background ?? {}) },
    camera: { ...current.camera, ...(patch.camera ?? {}) },
    mic: { ...current.mic, ...(patch.mic ?? {}) },
    audio: { ...current.audio, ...(patch.audio ?? {}) },
    video: { ...current.video, ...(patch.video ?? {}) },
    output: { ...current.output, ...(patch.output ?? {}) },
    hotkeys: { ...current.hotkeys, ...(patch.hotkeys ?? {}) }
  }
  store.set('settings', merged)
  return merged
}

// ---- Recording history (separate store key, unbounded array) ----
import { RecordingHistoryItem } from '@shared/types'

const historyStore = new Store<{ items: RecordingHistoryItem[] }>({
  name: 'teaching-studio-history',
  defaults: { items: [] }
})

export function getHistory(): RecordingHistoryItem[] {
  return historyStore.get('items')
}

export function addHistoryItem(item: RecordingHistoryItem): void {
  const items = historyStore.get('items')
  items.unshift(item)
  historyStore.set('items', items)
}

export function deleteHistoryItem(id: string): void {
  const items = historyStore.get('items').filter((i) => i.id !== id)
  historyStore.set('items', items)
}
