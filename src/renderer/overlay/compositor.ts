import { ImageSegmenter, FilesetResolver, ImageSegmenterResult } from '@mediapipe/tasks-vision'
import { BackgroundMode, BubbleSettings } from '@shared/types'

// The MediaPipe WASM runtime + selfie-segmentation model are loaded from
// Google's CDN at first run and cached by the browser/Electron cache —
// no Python, no native model compilation. See README for offline bundling.
const WASM_BASE = 'https://storage.googleapis.com/mediapipe-tasks/vision_wasm_internal/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'

let segmenter: ImageSegmenter | null = null
let segmenterReady: Promise<void> | null = null

export function ensureSegmenter(): Promise<void> {
  if (segmenterReady) return segmenterReady
  segmenterReady = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
    segmenter = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputCategoryMask: false,
      outputConfidenceMasks: true
    })
  })()
  return segmenterReady
}

// If the WASM runtime/model can't load (CDN blocked by CSP, offline, etc.)
// we still want the bubble to show the plain camera feed instead of nothing —
// so background-replacement failures degrade to "no mask" rather than
// throwing and leaving compositeFrame's canvas blank for the whole frame.
async function safeSegment(video: HTMLVideoElement, timestampMs: number): Promise<ImageSegmenterResult | undefined> {
  try {
    await ensureSegmenter()
    return segmenter?.segmentForVideo(video, timestampMs)
  } catch (err) {
    console.error('Segmentation unavailable, showing camera without background replacement', err)
    return undefined
  }
}

const backgroundCache = new Map<string, HTMLImageElement>()

function proceduralBackground(mode: BackgroundMode, w: number, h: number): HTMLCanvasElement {
  const key = `${mode}-${w}x${h}`
  const cached = document.getElementById(key) as HTMLCanvasElement | null
  if (cached) return cached

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!

  switch (mode) {
    case 'studio': {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, h * 0.1, w * 0.5, h * 0.6, h * 0.9)
      g.addColorStop(0, '#2b2f3a')
      g.addColorStop(1, '#0e1015')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      for (let i = 0; i < 4; i++) ctx.fillRect(0, h * (0.2 + i * 0.18), w, 2)
      break
    }
    case 'office': {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#c9d2dc')
      g.addColorStop(1, '#8f99a8')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'dark-studio': {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.4, h)
      g.addColorStop(0, '#1a1c22')
      g.addColorStop(1, '#020203')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'blackboard': {
      ctx.fillStyle = '#1c2b22'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 4
      ctx.strokeRect(6, 6, w - 12, h - 12)
      break
    }
    case 'classroom': {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#e8dcc8')
      g.addColorStop(1, '#c9b896')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'gradient':
    default: {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#3a2e6b')
      g.addColorStop(1, '#1a1a2e')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
  }
  return c
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  if (backgroundCache.has(path)) return backgroundCache.get(path)!
  const img = new Image()
  img.src = path.startsWith('file://') ? path : `file://${path}`
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error('Failed to load custom background image'))
  })
  backgroundCache.set(path, img)
  return img
}

export interface CompositeOptions {
  video: HTMLVideoElement
  outCanvas: HTMLCanvasElement
  bubble: BubbleSettings
  backgroundMode: BackgroundMode
  customImagePath?: string
}

// Reusable offscreen buffers to avoid per-frame allocation.
let personCanvas: HTMLCanvasElement | null = null
let bgCanvas: HTMLCanvasElement | null = null

/**
 * Draw one composited frame: segment the person out of the raw camera
 * frame, place them over the chosen background, clip to the bubble shape,
 * and render border/shadow — onto a canvas whose backing window is truly
 * alpha-transparent. No color keying anywhere in this pipeline.
 */
export async function compositeFrame(opts: CompositeOptions, timestampMs: number): Promise<void> {
  const { video, outCanvas, bubble, backgroundMode, customImagePath } = opts
  const size = bubble.sizePx
  outCanvas.width = size
  outCanvas.height = size
  const ctx = outCanvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size) // <-- fully transparent baseline (RGBA 0,0,0,0)

  if (video.readyState < 2 || video.videoWidth === 0) return

  const vw = video.videoWidth
  const vh = video.videoHeight

  if (!personCanvas) personCanvas = document.createElement('canvas')
  if (!bgCanvas) bgCanvas = document.createElement('canvas')
  personCanvas.width = vw
  personCanvas.height = vh
  bgCanvas.width = vw
  bgCanvas.height = vh

  const pCtx = personCanvas.getContext('2d')!
  const bCtx = bgCanvas.getContext('2d')!

  if (backgroundMode === 'original') {
    // No segmentation needed — just crop the raw feed.
    pCtx.drawImage(video, 0, 0, vw, vh)
  } else if (backgroundMode === 'blur-soft' || backgroundMode === 'blur-strong') {
    const mask = await safeSegment(video, timestampMs)
    bCtx.filter = backgroundMode === 'blur-strong' ? 'blur(28px)' : 'blur(12px)'
    bCtx.drawImage(video, -10, -10, vw + 20, vh + 20)
    bCtx.filter = 'none'
    drawPersonOverBackground(pCtx, video, bgCanvas, mask, vw, vh)
  } else {
    const mask = await safeSegment(video, timestampMs)
    if (backgroundMode === 'custom' && customImagePath) {
      const img = await loadImage(customImagePath)
      drawCover(bCtx, img, vw, vh)
    } else {
      const proc = proceduralBackground(backgroundMode, vw, vh)
      bCtx.drawImage(proc, 0, 0)
    }
    drawPersonOverBackground(pCtx, video, bgCanvas, mask, vw, vh)
  }

  // ---- Compose final circular/rounded/square bubble ----
  ctx.save()
  clipToBubbleShape(ctx, bubble, size)

  // Cover-fit the (already composited) person canvas into the bubble.
  const srcCanvas = backgroundMode === 'original' ? personCanvas : personCanvas
  const scale = Math.max(size / vw, size / vh)
  const dw = vw * scale
  const dh = vh * scale
  const dx = (size - dw) / 2
  const dy = (size - dh) / 2

  ctx.save()
  if (bubble.mirror) {
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(srcCanvas, size - dx - dw, dy, dw, dh)
  } else {
    ctx.drawImage(srcCanvas, dx, dy, dw, dh)
  }
  ctx.restore()
  ctx.restore()

  // Border
  if (bubble.borderEnabled) {
    ctx.save()
    clipToBubbleShape(ctx, bubble, size, true)
    ctx.lineWidth = bubble.borderThickness
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'
    strokeBubbleShape(ctx, bubble, size)
    ctx.restore()
  }

  // Shadow is drawn as a soft ring *behind* content using a second pass —
  // to keep it cheap we approximate with a canvas shadow on the shape path.
  if (bubble.shadowEnabled) {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.shadowColor = `rgba(0,0,0,${Math.min(0.6, bubble.shadowIntensity / 100)})`
    ctx.shadowBlur = bubble.shadowIntensity
    ctx.fillStyle = 'rgba(0,0,0,0.001)' // near-invisible fill just to cast the shadow
    fillBubbleShape(ctx, bubble, size)
    ctx.restore()
  }
}

function drawPersonOverBackground(
  pCtx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  bg: HTMLCanvasElement,
  mask: ImageSegmenterResult | undefined,
  vw: number,
  vh: number
) {
  // Start from the background, then paint the person on top using the
  // confidence mask as per-pixel alpha (head/hair/shoulders/body — not an
  // oval, not a blur-everything hack).
  pCtx.clearRect(0, 0, vw, vh)
  pCtx.drawImage(bg, 0, 0, vw, vh)

  if (!mask || !mask.confidenceMasks || !mask.confidenceMasks[0]) {
    // Segmentation not ready yet this frame — fall back to raw video so we
    // never show a blank bubble while the model warms up.
    pCtx.drawImage(video, 0, 0, vw, vh)
    return
  }

  const confMask = mask.confidenceMasks[0]
  const maskData = confMask.getAsFloat32Array() // 0..1 person likelihood, per pixel
  const mw = confMask.width
  const mh = confMask.height

  // Render raw video to a temp buffer, then apply mask alpha per pixel.
  const tmp = document.createElement('canvas')
  tmp.width = vw
  tmp.height = vh
  const tCtx = tmp.getContext('2d')!
  tCtx.drawImage(video, 0, 0, vw, vh)
  const frame = tCtx.getImageData(0, 0, vw, vh)
  const data = frame.data

  for (let y = 0; y < vh; y++) {
    const my = Math.floor((y / vh) * mh)
    for (let x = 0; x < vw; x++) {
      const mx = Math.floor((x / vw) * mw)
      const alpha = maskData[my * mw + mx]
      const idx = (y * vw + x) * 4 + 3
      data[idx] = Math.round(alpha * 255)
    }
  }
  tCtx.putImageData(frame, 0, 0)
  pCtx.drawImage(tmp, 0, 0)
  confMask.close()
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

function clipToBubbleShape(ctx: CanvasRenderingContext2D, bubble: BubbleSettings, size: number, inset = false) {
  ctx.beginPath()
  pathForShape(ctx, bubble, size, inset ? bubble.borderThickness / 2 : 0)
  ctx.clip()
}

function fillBubbleShape(ctx: CanvasRenderingContext2D, bubble: BubbleSettings, size: number) {
  ctx.beginPath()
  pathForShape(ctx, bubble, size, 0)
  ctx.fill()
}

function strokeBubbleShape(ctx: CanvasRenderingContext2D, bubble: BubbleSettings, size: number) {
  ctx.beginPath()
  pathForShape(ctx, bubble, size, bubble.borderThickness / 2)
  ctx.stroke()
}

function pathForShape(ctx: CanvasRenderingContext2D, bubble: BubbleSettings, size: number, inset: number) {
  const r = size / 2 - inset
  const cx = size / 2
  const cy = size / 2
  if (bubble.shape === 'circle') {
    ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2)
  } else if (bubble.shape === 'square') {
    ctx.rect(inset, inset, size - inset * 2, size - inset * 2)
  } else {
    const rr = size * 0.16
    const x = inset
    const y = inset
    const w = size - inset * 2
    const h = size - inset * 2
    roundRectPath(ctx, x, y, w, h, rr)
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
