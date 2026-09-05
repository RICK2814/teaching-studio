import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { v4 as uuid } from 'uuid'
import { VideoQualitySettings } from '@shared/types'

interface ActiveRecording {
  id: string
  tempWebmPath: string
  fd: number
  startedAt: number
  pausedMs: number
  lastPauseStart: number | null
}

let active: ActiveRecording | null = null

function tempDir(): string {
  const dir = path.join(app.getPath('userData'), 'recording-tmp')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** Begin a new crash-safe recording. Renderer will stream MediaRecorder
 *  blob chunks to us via IPC as they become available (typically every
 *  1-2s), and we append them to disk immediately — so even if the app
 *  crashes mid-lecture, the temp .webm on disk is still a valid,
 *  playable file up to the last received chunk. */
export function beginRecording(): { id: string } {
  const id = uuid()
  const tempWebmPath = path.join(tempDir(), `${id}.webm`)
  const fd = fs.openSync(tempWebmPath, 'w')
  active = { id, tempWebmPath, fd, startedAt: Date.now(), pausedMs: 0, lastPauseStart: null }
  return { id }
}

export function appendChunk(buffer: Buffer): void {
  if (!active) return
  fs.appendFileSync(active.fd, buffer)
}

export function markPauseStart(): void {
  if (!active) return
  active.lastPauseStart = Date.now()
}

export function markPauseEnd(): void {
  if (!active || active.lastPauseStart == null) return
  active.pausedMs += Date.now() - active.lastPauseStart
  active.lastPauseStart = null
}

function pickEncoder(preferred: VideoQualitySettings['encoder']): string[] {
  // Returns ffmpeg -c:v args. We try hardware first, and the caller falls
  // back to libx264 if the hardware attempt's process exits non-zero.
  switch (preferred) {
    case 'nvenc':
      return ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr']
    case 'qsv':
      return ['-c:v', 'h264_qsv', '-preset', 'medium']
    case 'amf':
      return ['-c:v', 'h264_amf', '-quality', 'balanced']
    case 'x264':
      return ['-c:v', 'libx264', '-preset', 'medium']
    case 'auto':
    default:
      // 'auto' resolved by caller trying nvenc -> qsv -> amf -> libx264
      return ['-c:v', 'libx264', '-preset', 'medium']
  }
}

function runFfmpeg(args: string[]): Promise<{ ok: boolean; stderr: string }> {
  return new Promise((resolve) => {
    if (!ffmpegPath) {
      resolve({ ok: false, stderr: 'ffmpeg-static binary not found' })
      return
    }
    const proc = spawn(ffmpegPath as unknown as string, args)
    let stderr = ''
    proc.stderr.on('data', (d) => (stderr += d.toString()))
    proc.on('close', (code) => resolve({ ok: code === 0, stderr }))
    proc.on('error', (err) => resolve({ ok: false, stderr: String(err) }))
  })
}

export interface FinalizeParams {
  outputFilePath: string
  video: VideoQualitySettings
}

export interface FinalizeResult {
  ok: boolean
  outputFilePath: string
  durationSec: number
  fileSizeBytes: number
  error?: string
}

/** Transcode the temp WebM (VP8/VP9 + Opus, from MediaRecorder) into a
 *  clean H.264 + AAC MP4, trying hardware encoders in order and falling
 *  back to software x264 so recording never fails outright. */
export async function finalizeRecording(params: FinalizeParams): Promise<FinalizeResult> {
  if (!active) {
    return { ok: false, outputFilePath: '', durationSec: 0, fileSizeBytes: 0, error: 'No active recording' }
  }
  fs.closeSync(active.fd)

  const durationSec = Math.max(0, (Date.now() - active.startedAt - active.pausedMs) / 1000)
  const { tempWebmPath } = active
  const outDir = path.dirname(params.outputFilePath)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const encodersToTry: VideoQualitySettings['encoder'][] =
    params.video.encoder === 'auto' ? ['nvenc', 'qsv', 'amf', 'x264'] : [params.video.encoder]

  let success = false
  let lastErr = ''

  for (const enc of encodersToTry) {
    const vArgs = pickEncoder(enc)
    // rebuild vArgs for the *actual* encoder tried, since pickEncoder's
    // default branch is x264 — swap in the real codec flags per-encoder:
    const codecArgs =
      enc === 'nvenc'
        ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr']
        : enc === 'qsv'
          ? ['-c:v', 'h264_qsv', '-preset', 'medium']
          : enc === 'amf'
            ? ['-c:v', 'h264_amf', '-quality', 'balanced']
            : ['-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage']

    const args = [
      '-y',
      '-i',
      tempWebmPath,
      ...codecArgs,
      '-b:v',
      `${params.video.bitrateKbps}k`,
      '-maxrate',
      `${Math.round(params.video.bitrateKbps * 1.5)}k`,
      '-bufsize',
      `${params.video.bitrateKbps * 2}k`,
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(params.video.fps),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      params.outputFilePath
    ]

    const result = await runFfmpeg(args)
    if (result.ok && fs.existsSync(params.outputFilePath)) {
      success = true
      break
    }
    lastErr = result.stderr
    void vArgs // silence unused warning when default branch taken
  }

  // Clean up temp file regardless of outcome (keep it only if everything failed,
  // so the teacher's lecture isn't lost).
  if (success) {
    try {
      fs.unlinkSync(tempWebmPath)
    } catch {
      /* non-fatal */
    }
  }

  const fileSizeBytes = success && fs.existsSync(params.outputFilePath) ? fs.statSync(params.outputFilePath).size : 0

  active = null

  return success
    ? { ok: true, outputFilePath: params.outputFilePath, durationSec, fileSizeBytes }
    : {
        ok: false,
        outputFilePath: tempWebmPath,
        durationSec,
        fileSizeBytes: 0,
        error: `All encoders failed. Recording preserved at: ${tempWebmPath}\n${lastErr}`
      }
}

/** On app relaunch after a crash, look for orphaned temp recordings and
 *  return their paths so the UI can offer recovery. */
export function findOrphanedRecordings(): string[] {
  const dir = tempDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => path.join(dir, f))
}
