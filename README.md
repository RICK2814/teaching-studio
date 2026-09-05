# Teaching Studio

A professional lecture-recording desktop app for Windows: record **anything on your
screen** — YouTube, a browser, Google Docs/Sheets, a PDF, PowerPoint, VS Code, any
Windows app — while you appear as a small, professional, circular webcam bubble
floating on top. No OBS, no green screen, no manual scene setup.

## Quick start

### Download the Windows app

Download the latest portable Windows release from the
[GitHub Releases page](https://github.com/RICK2814/teaching-studio/releases/latest).
Extract the ZIP file, then run **Teaching Studio.exe**. No installer or separate
runtime setup is required.

Direct download for v1.0.0:
[Teaching-Studio-1.0.0-win-x64-portable.zip](https://github.com/RICK2814/teaching-studio/releases/download/v1.0.0/Teaching-Studio-1.0.0-win-x64-portable.zip)

### Run from source

Prerequisites: **Node.js 18+** and **npm** on Windows.

```powershell
git clone https://github.com/RICK2814/teaching-studio.git
```

Open the project folder:

```powershell
cd teaching-studio
```

Install dependencies:

```powershell
npm install
```

Start the app in development mode:

```powershell
npm run dev
```

The `npm run dev` command starts the Electron desktop app with hot reload.

## Why this architecture works (read this first)

The single trickiest requirement in the spec is: *the webcam bubble must be baked
into the final recording, with true per-pixel transparency outside the circle, and
the teacher must be free to switch between any Windows application.*

Rather than manually compositing a webcam video track onto a screen video track in
software (fragile, and hard to keep in perfect sync), this app uses a much more
robust trick:

1. The camera bubble is a **real Windows OS window** — frameless, `transparent: true`
   (true RGBA alpha, not a color key), always-on-top, click-through except over the
   opaque circle itself.
2. When you record, the app captures **the entire screen** (via
   `getDisplayMedia`, auto-routed to the whole primary display by the main process —
   no picker prompt).
3. Because the bubble window is real and on top, **Windows' own compositor already
   draws it into every frame of the screen capture.** There is no separate merge step,
   no frame-timing drift between screen and camera, and no black rectangle — the
   captured pixels *are* the same pixels a viewer sitting at your desk would see.

This is also why there's no OBS requirement: OBS exists to do exactly this kind of
compositing, but Windows' own window manager already does it for you once the bubble
is a genuinely transparent top-most window.

## Stack

- **Electron 30** + **React 18** + **TypeScript** + **Tailwind CSS**
- **@mediapipe/tasks-vision** (`ImageSegmenter`, GPU-accelerated selfie segmentation)
  for real head/hair/shoulders/body segmentation — pure JS/WASM, **no Python
  dependency**, so it can't break on Python 3.13 or MediaPipe's Python wheel support.
- **ffmpeg-static** for encoding: MediaRecorder produces WebM (VP9/VP8 + Opus)
  incrementally; on "Stop & Save" the app transcodes to H.264 + AAC in an MP4
  container via FFmpeg, trying NVENC → QuickSync → AMF → libx264 in order so
  recording never hard-fails if a specific hardware encoder isn't present.
- **electron-store** for settings/history persistence (JSON on disk, no DB server).

## Project layout

```
src/
  main/                    Electron main process
    main.ts                App bootstrap, all IPC handlers
    overlayWindow.ts        Transparent/always-on-top bubble window management
    recorder.ts             Crash-safe chunk writer + FFmpeg finalize pipeline
    store.ts                Settings + recording history persistence
    hotkeys.ts               Global hotkey registration
    env.ts
    preload-dashboard.ts     contextBridge API for the dashboard window
    preload-overlay.ts       contextBridge API for the overlay window
  renderer/
    globals.css              Tailwind entry
    dashboard/                Main control-panel React app
      App.tsx, ui.tsx, RecordingHistory.tsx, FirstRunWizard.tsx,
      recordingEngine.ts      getDisplayMedia + mic capture + MediaRecorder
    overlay/                  Camera-bubble React app (the transparent window's content)
      App.tsx                 Camera stream lifecycle, render loop, drag handling
      compositor.ts            Segmentation -> background composite -> shape mask -> border/shadow
  shared/
    types.ts                  Single source of truth: settings shape + all IPC channel names
```

## Building on Windows

Prerequisites: **Node.js 18+** and **npm**. Nothing else — no Python, no Visual
Studio build tools should be required for the pinned dependency versions (Electron
ships prebuilt binaries; `ffmpeg-static` ships a prebuilt `ffmpeg.exe`).

```powershell
git clone https://github.com/RICK2814/teaching-studio.git
```

Open the project folder:

```powershell
cd teaching-studio
```

Install dependencies:

```powershell
npm install
```

Start the app:

```powershell
npm run dev
```

To produce a distributable Windows installer:

```powershell
npm run build       # compiles main/preload/renderer via electron-vite
npm run dist         # packages + builds an NSIS installer into /release
```

`npm run dist:dir` produces an unpacked build in `release/win-unpacked` if you just
want to smoke-test the packaged app without building the installer.

### Bundling the segmentation model for offline use

By default the app loads the MediaPipe WASM runtime and the `selfie_segmenter.tflite`
model from Google's CDN the first time segmentation runs, then the OS/Chromium HTTP
cache keeps it available offline afterward. If you need a fully offline first-run
(e.g. air-gapped classroom machines), download these once and bundle them under
`resources/mediapipe/`, then point `WASM_BASE` and `MODEL_URL` in
`src/renderer/overlay/compositor.ts` at `file://` paths into
`process.resourcesPath`:

- WASM runtime: `@mediapipe/tasks-vision` npm package ships a `wasm/` folder you can
  copy directly — no download needed, it's already in `node_modules`.
- Model: `selfie_segmenter.tflite` from Google's MediaPipe model zoo (Selfie
  Segmenter, "general" or "landscape" variant — either works here).

### Windows Defender / SmartScreen

Unsigned NSIS installers will trigger a SmartScreen warning on first run. For
distribution beyond your own machine, code-sign the installer with an
Authenticode certificate (add `certificateFile`/`certificateSubjectName` /
`signingHashAlgorithms` to `electron-builder`'s `win` config in `package.json`).

## Using the app

1. First launch walks you through camera, mic, preview, background, and quality
   (skippable/repeatable — settings persist to disk).
2. Configure the bubble (shape, size, position, border, shadow), background
   replacement, mic/system audio, and video quality on the dashboard.
3. Click **Start Recording** (or press `F9`). After a 3-2-1 countdown the dashboard
   minimizes and only the camera bubble remains on top — teach from anything.
4. Drag the bubble anywhere; click **Lock Position** to stop accidental drags.
   Toggle camera (`F8`) or mic (`F7`) mid-recording without stopping.
5. Press `F10` or click **Stop & Save**; the dashboard restores and the app
   transcodes to a single finished MP4 in your output folder (default
   `Videos/Teaching Studio/`).

Hotkeys are editable in `AppSettings.hotkeys` today via the settings JSON; a UI
editor is a natural next addition (see Roadmap below).

## Crash safety

`recorder.ts` writes every MediaRecorder chunk to disk as it arrives (default
1-second timeslices), so a crash mid-lecture leaves a valid, playable `.webm` in
`%AppData%/teaching-studio/recording-tmp/`. On next launch the app detects orphaned
temp recordings and can offer recovery (finalize them into MP4 the same way a
normal stop does).

## Testing checklist (map to the original spec's 25 items)

Run through this on an actual Windows 10/11 machine before shipping:

1–4. Camera ON/OFF, Mic ON/OFF — toggle mid-recording, confirm bubble/audio react
     immediately and screen recording is unaffected.
5–8. Screen recording starts/stops cleanly; bubble visible while recording; camera
     OFF hides the bubble but keeps recording; bubble drag works smoothly.
9–10. Lock Position prevents drag; resizing via the Bubble Size slider updates
      live.
11–12. Background replacement (each preset) and a custom uploaded image both
       render with the person cleanly separated from the real room.
13–18. Switch between YouTube, another website, a PDF, PowerPoint, VS Code, and
       back — bubble stays on top and click-through the whole time.
19–21. Record 5+ minutes continuously; confirm the exported MP4 audio/video stay
       in sync end to end.
22–25. Inspect the exported MP4 frame-by-frame around the bubble: no green
       fringing, no mirrored double-image, no rectangular box around the circle,
       and the desktop stays fully clickable under the bubble throughout.

## Known limitations / roadmap

- **Multi-monitor**: bubble positions resolve against the *primary* display;
  dragging onto a secondary monitor works, but presets ("Bottom Right", etc.)
  always target the primary display's work area.
- **Hotkey editor UI**: hotkeys are configurable in settings storage today but the
  dashboard doesn't yet expose a rebind-by-pressing-a-key control.
- **Recording recovery UI**: `recovery:found` is emitted with orphaned file paths
  after a crash, but the dashboard doesn't yet render a recovery dialog — wire this
  up to `finalizeRecording`-style logic if you want one-click recovery in the UI.
- This project was developed and typechecked/build-verified on Linux; the transparent
  layered window, per-pixel hit-testing, and hardware encoder paths are all
  standard, well-supported Electron/Chromium/FFmpeg-on-Windows behavior, but they
  have not been exercised on real Windows hardware as part of this delivery — run
  the checklist above before relying on it for a real lecture.

See `TROUBLESHOOTING.md` for common issues and fixes.
