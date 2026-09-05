# Teaching Studio

> A Windows-first desktop studio for professional lecture recording — capture your screen, keep a webcam bubble on top, replace the background, and export a finished MP4 without OBS.

[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6.svg)](https://www.microsoft.com/windows/)
[![Electron](https://img.shields.io/badge/Electron-30-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Teaching Studio is designed for teachers, educators, trainers, and creators who want to record lessons from any Windows application while appearing in a polished webcam bubble.

## ✨ Features

- 🖥️ **Full-screen recording** — record YouTube, browsers, PDFs, PowerPoint, VS Code, and other Windows applications.
- 🎥 **Floating webcam bubble** — transparent, always-on-top camera overlay that stays visible while you teach.
- ✂️ **Background replacement** — segmentation-based background removal with presets and custom backgrounds.
- 🎙️ **Microphone + system audio** — configure lecture audio directly from the dashboard.
- ⚡ **Hardware-aware encoding** — FFmpeg finalization tries available hardware encoders before falling back to software encoding.
- 💾 **Crash-safe recording chunks** — recording data is written incrementally so interrupted sessions can leave recoverable temporary media.
- ⌨️ **Global hotkeys** — quick recording and camera/microphone controls while teaching.
- 🪟 **Native Windows experience** — packaged as a Windows x64 Electron application; no Python runtime is required.

## 📦 Download the Windows App

The easiest way to use Teaching Studio is to download the latest packaged release:

**[Download the latest Windows release](https://github.com/RICK2814/teaching-studio/releases/latest)**

### Current release

**v1.0.0** — Windows portable release.

Download:

[Teaching-Studio-1.0.0-win-x64-portable.zip](https://github.com/RICK2814/teaching-studio/releases/download/v1.0.0/Teaching-Studio-1.0.0-win-x64-portable.zip)

### Portable installation

1. Download the `win-x64-portable.zip` package.
2. Extract the ZIP to a folder of your choice.
3. Launch **Teaching Studio.exe**.
4. Complete the first-run camera, microphone, preview, background, and quality setup.

The portable release does not require a separate Node.js, Python, or Electron runtime.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 30 |
| UI | React 18 |
| Language | TypeScript 5 |
| Build tool | electron-vite + Vite |
| Styling | Tailwind CSS |
| Person segmentation | MediaPipe Tasks Vision |
| Recording | `getDisplayMedia()` + MediaRecorder |
| Video processing | FFmpeg via `ffmpeg-static` |
| Persistent settings | `electron-store` |
| Packaging | electron-builder |
| Windows target | x64 / NSIS |

## 🧠 Architecture

Teaching Studio uses a native desktop-overlay approach instead of software-only webcam compositing.

```text
┌───────────────────────────────┐
│        Windows Desktop        │
│                               │
│  Any App / Browser / PDF      │
│              +                │
│   Transparent Webcam Window   │
└───────────────┬───────────────┘
                │
                ▼
       Screen Capture Pipeline
          (getDisplayMedia)
                │
                ▼
       MediaRecorder → WebM
                │
                ▼
          FFmpeg Finalize
                │
                ▼
            MP4 (H.264/AAC)
```

The webcam bubble is implemented as a real transparent, always-on-top Windows window. During recording, the screen capture sees the desktop as composed by Windows, allowing the webcam bubble to become part of the captured frames without a separate screen/camera synchronization pipeline.

## 🚀 Development Setup

### Requirements

- Windows 10 or Windows 11 recommended for real device testing
- Node.js 18+
- npm
- Git

No Python installation or separate FFmpeg installation is required for the pinned project dependencies.

### Clone the repository

```powershell
git clone https://github.com/RICK2814/teaching-studio.git
cd teaching-studio
```

### Install dependencies

```powershell
npm install
```

### Run in development mode

```powershell
npm run dev
```

This launches the Electron application with hot reload.

## 🧰 Project Commands

Run commands from the project root:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Electron app in development mode |
| `npm run typecheck` | Run TypeScript checks without emitting files |
| `npm run build` | Build the Electron main, preload, and renderer bundles |
| `npm run dist` | Build and package a Windows x64 distributable |
| `npm run dist:dir` | Create an unpacked Windows build for smoke testing |

## 🏗️ Production Build

### Standard Windows build

```powershell
npm run dist
```

The packaging configuration writes artifacts to the `release/` directory.

The Windows target is configured as an **x64 NSIS installer** with:

- an optional installation directory
- a desktop shortcut
- the application icon from `resources/icon.ico`
- unsigned Windows binaries by default

### Unpacked smoke-test build

For a quick test before creating an installer:

```powershell
npm run dist:dir
```

The unpacked application is generated under:

```text
release/win-unpacked/
```

## 📤 Release / Deployment

Teaching Studio is distributed through **GitHub Releases**.

### Manual release workflow

```text
Code changes
    ↓
git push
    ↓
npm run dist
    ↓
release/ artifacts
    ↓
Create a GitHub Release
    ↓
Upload the generated Windows package
```

A typical version flow is:

```text
v1.0.0
v1.0.1
v1.0.2
```

When you publish a new version, update the release tag and upload the newly generated package from `release/`.

> GitHub Releases and GitHub Actions are separate concerns. A workflow file is only required when you want GitHub to build/package releases automatically.

## 🎬 Using the App

1. Complete the first-run wizard for camera, microphone, preview, background, and quality.
2. Configure bubble shape, size, position, border, and shadow.
3. Configure background replacement and audio options.
4. Start recording from the dashboard or press **F9**.
5. The dashboard minimizes and the webcam bubble remains on top while you teach.
6. Drag the bubble into position, or lock it to prevent accidental movement.
7. Use **F8** to toggle the camera and **F7** to toggle the microphone during recording.
8. Press **F10** or choose **Stop & Save**.
9. The recording is finalized as an MP4 in the configured output location; the default is `Videos/Teaching Studio/`.

## ⌨️ Hotkeys

| Hotkey | Action |
|---|---|
| `F9` | Start recording |
| `F10` | Stop and save recording |
| `F8` | Toggle camera |
| `F7` | Toggle microphone |

Hotkeys are currently represented in the application settings. A dedicated in-app hotkey editor is planned.

## 📁 Project Structure

```text
src/
├── main/
│   ├── main.ts                 # Electron main process and IPC handlers
│   ├── overlayWindow.ts        # Transparent always-on-top webcam window
│   ├── recorder.ts             # Chunk writer and FFmpeg finalize pipeline
│   ├── store.ts                # Persistent settings/history
│   ├── hotkeys.ts              # Global shortcut registration
│   ├── env.ts                  # Environment helpers
│   ├── preload-dashboard.ts    # Dashboard preload / bridge
│   └── preload-overlay.ts      # Overlay preload / bridge
│
├── renderer/
│   ├── dashboard/              # Main control panel
│   │   ├── App.tsx
│   │   ├── ui.tsx
│   │   ├── RecordingHistory.tsx
│   │   ├── FirstRunWizard.tsx
│   │   └── recordingEngine.ts
│   │
│   ├── overlay/                # Webcam bubble UI
│   │   ├── App.tsx
│   │   └── compositor.ts
│   │
│   └── globals.css
│
└── shared/
    └── types.ts                # Shared settings and IPC types
```

## 🧪 Verification Checklist

Before shipping a new Windows build, test the packaged app on an actual Windows 10/11 machine.

### Recording

- Camera ON/OFF during recording
- Microphone ON/OFF during recording
- Start and stop recording repeatedly
- 5+ minute continuous recording
- Audio/video synchronization after export

### Overlay

- Webcam bubble stays visible above teaching content
- Dragging remains smooth
- Lock Position prevents accidental movement
- Bubble resizing updates correctly
- No rectangular background around the transparent bubble

### Background replacement

- Test every preset
- Test a custom image
- Check edges around hair, shoulders, and clothing

### Application switching

Test switching between:

- YouTube / browser
- PDF
- PowerPoint
- Google Docs / Sheets
- VS Code
- Other Windows applications

### Export

Confirm that the final MP4:

- Opens in a standard media player
- Contains the expected audio
- Has synchronized audio/video
- Contains the webcam bubble in the recorded frames
- Does not show unexpected green fringing or a rectangular webcam box

## 📴 Offline MediaPipe Model

By default, the segmentation runtime/model can be loaded from Google's CDN on first use and subsequently benefit from the Chromium/OS cache.

For fully offline first-run environments, bundle the MediaPipe WASM runtime and the `selfie_segmenter.tflite` model under `resources/mediapipe/`, then update the corresponding paths in `src/renderer/overlay/compositor.ts` to load those local resources.

## 🛡️ Windows Defender / SmartScreen

The current Windows packaging configuration is **unsigned**. Unsigned Windows applications/installers may trigger SmartScreen warnings on first launch.

For broader distribution, sign the Windows package with an Authenticode certificate and configure the appropriate `electron-builder` signing settings.

## ⚠️ Known Limitations

- **Multi-monitor presets:** bubble position presets currently target the primary display's work area, although dragging onto another display is supported.
- **Hotkey editor:** hotkeys are configurable through stored settings, but there is not yet a full key-rebinding UI.
- **Recovery UI:** crash recovery data can be detected, but a dedicated one-click recovery interface is still a roadmap item.
- **Windows hardware validation:** the project is typechecked/build-verified, but hardware-specific capture, transparency, and encoder behavior should be validated on the target Windows machines before production use.

## 🗺️ Roadmap

- [ ] In-app hotkey editor
- [ ] One-click recording recovery UI
- [ ] Improved multi-monitor presets
- [ ] Automated Windows release builds
- [ ] Code signing for production distribution
- [ ] More webcam shapes and layout presets
- [ ] Additional recording quality/export profiles

## 🐛 Troubleshooting

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for common issues and fixes.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**Teaching Studio** — record your lesson, not your setup.