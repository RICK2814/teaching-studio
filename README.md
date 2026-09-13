<div align="center">

<img src="./docs/hero-animation.svg" alt="Teaching Studio — animated recording pipeline" width="100%" />

# 🎬 Teaching Studio

### **Record the lesson. Not the setup.**

A Windows-first desktop recording studio for educators, trainers and creators — screen capture, always-on-top webcam, background replacement, audio controls and MP4 export in one workflow.

<p>
<a href="https://github.com/RICK2814/teaching-studio/releases/latest"><img src="https://img.shields.io/github/v/release/RICK2814/teaching-studio?style=for-the-badge&logo=github&label=LATEST%20RELEASE" /></a>
<a href="https://github.com/RICK2814/teaching-studio/stargazers"><img src="https://img.shields.io/github/stars/RICK2814/teaching-studio?style=for-the-badge&logo=github" /></a>
<a href="https://github.com/RICK2814/teaching-studio/issues"><img src="https://img.shields.io/github/issues/RICK2814/teaching-studio?style=for-the-badge&logo=github" /></a>
<img src="https://img.shields.io/badge/Windows-10%2F11-0078D6?style=for-the-badge&logo=windows&logoColor=white" />
</p>

<p>
<a href="https://github.com/RICK2814/teaching-studio/releases/latest">⬇️ Download</a> ·
<a href="https://youtu.be/mKT4hKMhg3k">▶️ Watch demo</a> ·
<a href="https://github.com/RICK2814/teaching-studio/issues">🐛 Report a bug</a> ·
<a href="https://github.com/RICK2814/teaching-studio/issues">💡 Request a feature</a>
</p>

</div>

---

## ⚡ See the system move

<div align="center">
<img src="./docs/pipeline-animation.svg" alt="Animated Teaching Studio recording pipeline" width="100%" />
</div>

> **Repository-hosted visual pipeline:** the animation assets live inside the repository so the README does not depend on a placeholder demo URL.

---

## 🎥 Real-world demo

This is the workflow Teaching Studio is built for: teach from a real desktop application while the webcam remains visible as a floating, rounded, always-on-top bubble.

<div align="center">
<a href="https://youtu.be/mKT4hKMhg3k">
<img src="https://img.youtube.com/vi/mKT4hKMhg3k/maxresdefault.jpg" alt="Teaching Studio real-world demo — desktop teaching with floating webcam overlay" width="92%" />
</a>

**▶️ Watch the full Teaching Studio demonstration**

`Desktop content → Floating webcam → Teach → Stop → Export MP4`
</div>

---

## 🧭 Navigation

<details open>
<summary><b>Explore</b></summary>

- [✨ Highlights](#-highlights)
- [🎞️ Animated pipeline](#-see-the-system-move)
- [🎥 Real-world demo](#-real-world-demo)
- [🧠 Architecture](#-architecture)
- [🧩 Features](#-features)
- [🛠️ Stack](#️-technology-stack)
- [🚀 Development](#-development-setup)
- [📦 Build & Release](#-build--release)
- [🎬 Usage](#-usage)
- [⌨️ Hotkeys](#️-hotkeys)
- [📁 Project Structure](#-project-structure)
- [🧪 Verification](#-verification)
- [🗺️ Roadmap](#️-roadmap)
- [⚠️ Limitations](#️-limitations)

</details>

---

## ✨ Highlights

<div align="center">
<img src="./docs/highlights-animation.svg" alt="Animated Teaching Studio highlights" width="100%" />
</div>

| Capability | Implementation |
|---|---|
| 🖥️ Desktop capture | `getDisplayMedia()` |
| 🎥 Floating camera | Transparent always-on-top Electron window |
| 🎨 Background replacement | MediaPipe Tasks Vision segmentation |
| 🎙️ Audio | Microphone + system audio controls |
| ⚡ Encoding | FFmpeg with hardware → software fallback |
| 💾 Recovery | Incremental recording chunks |
| ⌨️ Hotkeys | F7 / F8 / F9 / F10 |
| 🪟 Platform | Windows x64 Electron desktop app |

**Less setup. More teaching.**

---

## 🧠 Architecture

<div align="center">
<img src="./docs/architecture-animation.svg" alt="Animated Teaching Studio architecture" width="100%" />
</div>

Teaching Studio separates the dashboard, native overlay and recording finalization responsibilities instead of forcing everything into one renderer.

```mermaid
flowchart LR
    U[Teacher] --> D[Dashboard]
    D --> P[Preload / IPC]
    P --> M[Electron Main Process]
    M --> O[Transparent Webcam Overlay]
    W[Windows Desktop] --> C[getDisplayMedia]
    O --> W
    C --> R[MediaRecorder]
    R --> CH[WebM Chunks]
    CH --> F[FFmpeg Finalizer]
    F --> E[MP4 H.264/AAC]
```

### 🔬 Why the overlay approach matters

The webcam bubble is a **real transparent, always-on-top desktop window**. Windows composes that overlay into the desktop, allowing the screen-capture path to capture a composed desktop view that already includes the camera bubble.

---

## 🔄 Recording Pipeline

<div align="center">
<img src="./docs/pipeline-animation.svg" alt="Animated recording pipeline" width="100%" />
</div>

```text
Select display → getDisplayMedia() → MediaRecorder → WebM chunks → FFmpeg → final MP4
```

### 💾 Crash-aware media flow

Incremental chunks keep temporary media recoverable when a recording is interrupted before finalization.

---

## 🧩 Features

<div align="center">
<img src="./docs/features-animation.svg" alt="Animated Teaching Studio features" width="100%" />
</div>

### 🖥️ Full desktop recording
Capture YouTube, browsers, PDFs, PowerPoint, VS Code and other Windows applications.

### 🎥 Floating webcam bubble
A transparent, always-on-top camera window stays visible while you teach.

### 🎨 Background replacement
Use segmentation-based removal with presets and custom backgrounds.

### 🎙️ Microphone + system audio
Configure lecture audio directly from the dashboard.

### ⚡ Hardware-aware encoding
The FFmpeg finalization pipeline tries available hardware encoders before software fallback.

### 💾 Crash-safe chunks
Recording data is written incrementally so interrupted sessions can leave recoverable temporary media.

### ⌨️ Global hotkeys
Control core recording actions without returning to the dashboard.

---

## 🛠️ Technology Stack

<div align="center">
<img src="./docs/stack-animation.svg" alt="Animated Teaching Studio technology stack" width="100%" />
</div>

| Layer | Technology |
|---|---|
| 🖥️ Desktop runtime | Electron 30 |
| 🎨 UI | React 18 |
| 🧠 Language | TypeScript 5 |
| ⚙️ Build | electron-vite + Vite |
| 💅 Styling | Tailwind CSS |
| 🧍 Segmentation | MediaPipe Tasks Vision |
| 🎥 Capture | `getDisplayMedia()` + `MediaRecorder` |
| 🎞️ Processing | FFmpeg via `ffmpeg-static` |
| 💾 Persistence | `electron-store` |
| 📦 Packaging | electron-builder |
| 🪟 Target | Windows x64 / NSIS |

---

## 📦 Download

<div align="center">
<a href="https://github.com/RICK2814/teaching-studio/releases/latest"><img src="https://img.shields.io/badge/⬇️%20DOWNLOAD-LATEST%20WINDOWS%20BUILD-2563EB?style=for-the-badge" alt="Download latest Windows build" /></a>

### Current release

**v1.0.0 — Windows portable release**

<a href="https://github.com/RICK2814/teaching-studio/releases/download/v1.0.0/Teaching-Studio-1.0.0-win-x64-portable.zip">Teaching-Studio-1.0.0-win-x64-portable.zip</a>
</div>

### Portable install

```text
1. Download the portable ZIP
2. Extract it
3. Launch Teaching Studio.exe
4. Complete first-run setup
5. Press F9 and start teaching
```

No separate Python, Node.js or Electron runtime is required for the packaged portable build.

---

## 🚀 Development Setup

<div align="center">
<img src="./docs/development-animation.svg" alt="Animated Teaching Studio development workflow" width="100%" />
</div>

### Requirements

- Windows 10 or Windows 11 for real device testing
- Node.js 18+
- npm
- Git

### Clone

```powershell
git clone https://github.com/RICK2814/teaching-studio.git
cd teaching-studio
```

### Install

```powershell
npm install
```

### Run

```powershell
npm run dev
```

---

## 🧰 Project Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development mode with hot reload |
| `npm run typecheck` | TypeScript validation |
| `npm run build` | Build main, preload and renderer bundles |
| `npm run dist` | Build a Windows x64 distributable |
| `npm run dist:dir` | Build an unpacked Windows app for smoke testing |

---

## 📦 Build & Release

<div align="center">
<img src="./docs/release-animation.svg" alt="Animated Teaching Studio build and release workflow" width="100%" />
</div>

### Standard build

```powershell
npm run dist
```

### Unpacked build

```powershell
npm run dist:dir
```

Output:

```text
release/win-unpacked/
```

The Windows packaging configuration targets x64 and uses NSIS. Current binaries are unsigned by default.

---

## 🎬 Usage

<div align="center">
<img src="./docs/usage-animation.gif" alt="Animated Teaching Studio usage workflow" width="100%" />
</div>

### Real teaching flow

```text
1. FIRST RUN → Camera · Microphone · Quality · Background
2. OVERLAY  → Shape · Size · Position · Border · Shadow
3. RECORD   → Dashboard → F9
4. TEACH    → Bubble stays on top of the desktop content
5. CONTROL  → F7 mic · F8 camera
6. FINISH   → F10 → MP4
```

### What the real demo shows

Teaching Studio is designed for exactly this kind of session: a PDF, browser, presentation or code editor can remain the main teaching surface while the **floating webcam bubble stays visible above it**.

<a href="https://youtu.be/mKT4hKMhg3k">▶️ Watch the real-world demo on YouTube</a>

Default output location:

```text
Videos/Teaching Studio/
```

---

## ⌨️ Hotkeys

<div align="center">
<img src="./docs/hotkeys-animation.gif" alt="Animated Teaching Studio hotkeys" width="100%" />
</div>

| Key | Action |
|:---:|---|
| `F9` | Start recording |
| `F10` | Stop and save |
| `F8` | Toggle camera |
| `F7` | Toggle microphone |

A full in-app hotkey editor is planned.

---

## 📁 Project Structure

<div align="center">
<img src="./docs/structure-animation.svg" alt="Animated Teaching Studio project structure" width="100%" />
</div>

```text
src/
├── main/
│   ├── main.ts
│   ├── overlayWindow.ts
│   ├── recorder.ts
│   ├── store.ts
│   ├── hotkeys.ts
│   ├── env.ts
│   ├── preload-dashboard.ts
│   └── preload-overlay.ts
│
├── renderer/
│   ├── dashboard/
│   │   ├── App.tsx
│   │   ├── ui.tsx
│   │   ├── RecordingHistory.tsx
│   │   ├── FirstRunWizard.tsx
│   │   └── recordingEngine.ts
│   │
│   ├── overlay/
│   │   ├── App.tsx
│   │   └── compositor.ts
│   │
│   └── globals.css
│
└── shared/
    └── types.ts
```

---

## 🧪 Verification

<div align="center">
<img src="./docs/verification-animation.svg" alt="Animated Teaching Studio verification workflow" width="100%" />
</div>

Before shipping a Windows build, validate it on an actual Windows 10/11 machine.

### Recording

- Camera ON/OFF during recording
- Microphone ON/OFF during recording
- Repeated start/stop cycles
- 5+ minute continuous session
- Audio/video synchronization

### Overlay

- Always visible above teaching content
- Smooth dragging
- Lock Position works
- Resize behavior works
- No unwanted rectangular background

### Background replacement

- Every preset
- Custom image
- Hair / shoulder / clothing edges

### Export

- MP4 opens in a standard player
- Audio is present
- Audio/video stays synchronized
- Webcam bubble appears in captured frames
- No unexpected green fringing

---

## 📴 Offline MediaPipe Model

The segmentation runtime/model can be loaded from Google's CDN on first use and may subsequently benefit from cache.

For fully offline first-run environments, bundle the MediaPipe WASM runtime and `selfie_segmenter.tflite` under `resources/mediapipe/`, then update the corresponding local paths in `src/renderer/overlay/compositor.ts`.

---

## 🛡️ Windows Defender / SmartScreen

Current Windows packaging is **unsigned**. Unsigned Windows applications may trigger SmartScreen warnings on first launch.

For wider distribution, sign the Windows package with an Authenticode certificate and configure the corresponding `electron-builder` signing settings.

---

## ⚠️ Limitations

- Multi-monitor presets currently target the primary display work area, although dragging onto another display is supported.
- Hotkeys have stored settings, but there is not yet a complete in-app key-rebinding editor.
- Crash recovery data can be detected, but a one-click recovery UI remains on the roadmap.
- Hardware-specific capture, transparency and encoder behavior should be validated on target Windows machines.

---

## 🗺️ Roadmap

<div align="center">
<img src="./docs/roadmap-animation.gif" alt="Animated Teaching Studio roadmap" width="100%" />
</div>

- [ ] In-app hotkey editor
- [ ] One-click recording recovery UI
- [ ] Improved multi-monitor presets
- [ ] Automated Windows release builds
- [ ] Code signing for production distribution
- [ ] More webcam shapes and layout presets
- [ ] More recording quality/export profiles
- [ ] Richer animated product demo assets

---

## 🐛 Troubleshooting

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for common problems and fixes.

---

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<div align="center">
<img src="./docs/hero-animation.svg" alt="Teaching Studio animated footer" width="100%" />

### **Teaching Studio**
**Capture. Teach. Export. Repeat.**

</div>
