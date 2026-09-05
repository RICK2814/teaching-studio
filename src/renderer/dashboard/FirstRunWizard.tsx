import React, { useState } from 'react'
import { AppSettings } from '@shared/types'
import { Select } from './ui'

interface Props {
  settings: AppSettings
  cameras: MediaDeviceInfo[]
  mics: MediaDeviceInfo[]
  onPatch: (p: Partial<AppSettings>) => void
  onDone: () => void
}

const STEPS = ['Camera', 'Microphone', 'Preview', 'Background', 'Quality', 'Ready'] as const

export default function FirstRunWizard({ settings, cameras, mics, onPatch, onDone }: Props) {
  const [step, setStep] = useState(0)

  return (
    <div className="fixed inset-0 bg-studio-bg flex items-center justify-center z-50">
      <div className="w-[480px] bg-studio-panel border border-studio-border rounded-xl2 p-6">
        <div className="flex gap-1 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-studio-accent' : 'bg-studio-border'}`} />
          ))}
        </div>
        <h2 className="text-lg font-semibold mb-1">{STEPS[step]}</h2>

        {step === 0 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted mb-3">Choose the camera you'll teach with.</p>
            <Select
              value={settings.camera.deviceId ?? ''}
              onChange={(v) => onPatch({ camera: { ...settings.camera, deviceId: v || null } })}
              options={[{ value: '', label: 'System default' }, ...cameras.map((c) => ({ value: c.deviceId, label: c.label || 'Camera' }))]}
            />
          </div>
        )}
        {step === 1 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted mb-3">Choose your microphone.</p>
            <Select
              value={settings.mic.deviceId ?? ''}
              onChange={(v) => onPatch({ mic: { ...settings.mic, deviceId: v || null } })}
              options={[{ value: '', label: 'System default' }, ...mics.map((m) => ({ value: m.deviceId, label: m.label || 'Microphone' }))]}
            />
          </div>
        )}
        {step === 2 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted">
              Your camera preview is on the left of the main dashboard. Make sure you're well lit and centered.
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted mb-3">Pick a background style — you can change this anytime.</p>
            <Select
              value={settings.background.mode}
              onChange={(v) => onPatch({ background: { ...settings.background, mode: v } })}
              options={[
                { value: 'studio', label: 'Professional Studio' },
                { value: 'blur-soft', label: 'Soft Blur' },
                { value: 'original', label: 'Original' }
              ]}
            />
          </div>
        )}
        {step === 4 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted mb-3">Choose a starting quality preset.</p>
            <Select
              value={settings.video.preset}
              onChange={(v) => onPatch({ video: { ...settings.video, preset: v as AppSettings['video']['preset'] } })}
              options={[
                { value: 'standard', label: 'Standard (720p)' },
                { value: 'high', label: 'High (1080p) — recommended' },
                { value: 'veryhigh', label: 'Very High (1080p60)' }
              ]}
            />
          </div>
        )}
        {step === 5 && (
          <div className="mt-4">
            <p className="text-sm text-studio-muted">
              You're all set. Press <span className="text-studio-accent">Start Recording</span> any time — the dashboard will
              minimize and your camera bubble will float on top of whatever you teach from.
            </p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            className="text-sm px-3 py-1.5 rounded-md border border-studio-border disabled:opacity-30"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="text-sm px-4 py-1.5 rounded-md bg-studio-accent text-white" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <button className="text-sm px-4 py-1.5 rounded-md bg-studio-accent text-white" onClick={onDone}>
              Start Teaching
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
