import React, { useEffect, useState } from 'react'
import { RecordingHistoryItem } from '@shared/types'
import { Panel, formatBytes, formatDuration } from './ui'

export default function RecordingHistory({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<RecordingHistoryItem[]>([])

  useEffect(() => {
    window.studio.getHistory().then(setItems)
  }, [refreshKey])

  async function remove(id: string) {
    await window.studio.deleteHistoryItem(id, false)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <Panel title="Recording History" className="flex-1 overflow-hidden flex flex-col">
      <div className="overflow-y-auto space-y-2 pr-1">
        {items.length === 0 && <p className="text-sm text-studio-muted">No recordings yet — your finished lectures will show up here.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-studio-panel2 border border-studio-border rounded-lg p-2">
            <div className="w-20 h-12 rounded bg-black/40 flex items-center justify-center text-[10px] text-studio-muted shrink-0">
              {item.resolution}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">{item.title}</div>
              <div className="text-xs text-studio-muted">
                {formatDuration(item.durationSec)} • {formatBytes(item.fileSizeBytes)}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                className="text-xs px-2 py-1 rounded bg-studio-panel border border-studio-border hover:border-studio-accent"
                onClick={() => window.studio.openHistoryItem(item.filePath)}
              >
                Play
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-studio-panel border border-studio-border hover:border-studio-accent"
                onClick={() => window.studio.showHistoryItemInFolder(item.filePath)}
              >
                Show in folder
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-studio-panel border border-studio-border hover:border-studio-rec hover:text-studio-rec"
                onClick={() => remove(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
