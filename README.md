<div align="center">

<img src="./docs/hero-animation.svg" alt="Teaching Studio — animated recording pipeline" width="100%" />

# 🎬 Teaching Studio

[![Typing SVG](https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&duration=3000&pause=900&color=38BDF8&center=true&vCenter=true&width=760&lines=Record+the+lesson.+Not+the+setup.;Screen+%2B+Webcam+%2B+Audio+%E2%86%92+MP4;Zero+setup.+Just+press+F9.)](https://git.io/typing-svg)

A Windows-first desktop recording studio for educators, trainers and creators — screen capture, always-on-top webcam, background replacement, audio controls and MP4 export in one workflow.

<p>
<a href="https://github.com/RICK2814/teaching-studio/releases/latest"><img src="https://img.shields.io/github/v/release/RICK2814/teaching-studio?style=for-the-badge&logo=github&label=LATEST%20RELEASE&color=38bdf8" /></a>
<a href="https://github.com/RICK2814/teaching-studio/stargazers"><img src="https://img.shields.io/github/stars/RICK2814/teaching-studio?style=for-the-badge&logo=github&color=8b5cf6" /></a>
<a href="https://github.com/RICK2814/teaching-studio/network/members"><img src="https://img.shields.io/github/forks/RICK2814/teaching-studio?style=for-the-badge&logo=github&color=6366f1" /></a>
<a href="https://github.com/RICK2814/teaching-studio/issues"><img src="https://img.shields.io/github/issues/RICK2814/teaching-studio?style=for-the-badge&logo=github&color=f97316" /></a>
<img src="https://img.shields.io/badge/Windows-10%2F11-0078D6?style=for-the-badge&logo=windows&logoColor=white" />
</p>

<p>
<img src="https://img.shields.io/github/last-commit/RICK2814/teaching-studio?style=flat-square&logo=git&logoColor=white&color=38bdf8&label=last%20commit" />
<img src="https://img.shields.io/github/languages/top/RICK2814/teaching-studio?style=flat-square&color=6366f1&label=top%20language" />
<img src="https://img.shields.io/github/languages/code-size/RICK2814/teaching-studio?style=flat-square&color=8b5cf6&label=code%20size" />
<img src="https://img.shields.io/github/license/RICK2814/teaching-studio?style=flat-square&color=22c55e" />
<img src="https://img.shields.io/maintenance/yes/2026?style=flat-square&color=22c55e" />
<img src="https://img.shields.io/badge/PRs-welcome-38bdf8?style=flat-square" />
<img src="https://komarev.com/ghpvc/?username=RICK2814-teaching-studio&label=Views&color=38bdf8&style=flat-square" alt="Repo views" />
</p>

<p>
<a href="https://github.com/RICK2814/teaching-studio/releases/latest">⬇️ Download</a> ·
<a href="https://youtu.be/mKT4hKMhg3k">▶️ Watch demo</a> ·
<a href="https://github.com/RICK2814/teaching-studio/issues">🐛 Report a bug</a> ·
<a href="https://github.com/RICK2814/teaching-studio/issues">💡 Request a feature</a>
</p>

<p>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Electron-30-47848F?style=for-the-badge&logo=electron&logoColor=white" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=0b1020" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" />
</p>

</div>

---

## ⚡ See the system move

<div align="center">
<img src="./docs/pipeline-animation.svg" alt="Animated Teaching Studio recording pipeline" width="100%" />
</div>

> **Repository-hosted visual pipeline:** the animation assets live inside the repository so the README does not depend on a placeholder demo URL.

<div align="center">

[![Tech Stack](https://skillicons.dev/icons?i=ts,react,electron,tailwind,vite,nodejs,windows&theme=dark)](https://skillicons.dev)

</div>

---

## 🧭 Navigation

<details open>
<summary><b>Explore</b></summary>

- [✨ Highlights](#-highlights)
- [🎞️ Animated pipeline](#-see-the-system-move)
- [🎥 Real-world demo](#-real-world-demo)
- [🧠 Architecture](#-architecture)
- [🔁 Recording Lifecycle](#-recording-lifecycle)
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
- [🤝 Contributing](#-contributing)
- [⭐ Star History](#-star-history)

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

<div align="center">
<img src="https://github-readme-stats.vercel.app/api/pin/?username=RICK2814&repo=teaching-studio&theme=tokyonight&hide_border=true&bg_color=0b1020&title_color=38bdf8&text_color=e2e8f0&icon_color=8b5cf6" alt="Teaching Studio repo card" />
</div>

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

## 🔁 Recording Lifecycle

A closer look at what actually happens between pressing **F9** and getting an MP4 — including the crash-recovery path.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> FirstRun: First launch
    FirstRun --> Idle: Setup complete
    Idle --> Recording: Press F9
    Recording --> Recording: Toggle mic (F7) / camera (F8)
    Recording --> Finalizing: Press F10
    Finalizing --> Saved: FFmpeg mux → MP4
    Saved --> Idle: Ready for next take
    Recording --> Interrupted: Unexpected exit
    Interrupted --> Recoverable: Incremental WebM chunks found
    Recoverable --> Finalizing: Resume finalize
```

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

<img src="https://img.shields.io/github/downloads/RICK2814/teaching-studio/total?style=flat-square&color=38bdf8&label=total%20downloads" alt="Total downloads" />
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

<div align="center">

![Terminal typing](https://readme-typing-svg.demolab.com/?font=Fira+Code&size=16&duration=2200&pause=600&color=94A3B8&center=false&vCenter=true&width=560&height=110&lines=%24+git+clone+https%3A%2F%2Fgithub.com%2FRICK2814%2Fteaching-studio.git;%24+cd+teaching-studio;%24+npm+install;%24+npm+run+dev)

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
<img src="./docs/usage-animation.svg" alt="Animated Teaching Studio usage workflow" width="100%" />
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
<img src="./docs/hotkeys-animation.svg" alt="Animated Teaching Studio hotkeys" width="100%" />
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
<img src="./docs/roadmap-animation.svg" alt="Animated Teaching Studio roadmap" width="100%" />
</div>

| Status | Item |
|:---:|---|
| 🔜 | In-app hotkey editor |
| 🔜 | One-click recording recovery UI |
| 🔜 | Improved multi-monitor presets |
| 🔜 | Automated Windows release builds |
| 🔜 | Code signing for production distribution |
| 🔜 | More webcam shapes and layout presets |
| 🔜 | More recording quality/export profiles |
| 🔜 | Richer animated product demo assets |

---

## 🐛 Troubleshooting

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for common problems and fixes.

---

## 🤝 Contributing

Contributions, bug reports and feature ideas are welcome.

```text
1. Fork the repository
2. Create a feature branch    → git checkout -b feature/my-improvement
3. Make your changes          → npm run typecheck && npm run build
4. Commit with a clear message
5. Open a Pull Request against main
```

<div align="center">
<img src="https://img.shields.io/github/contributors/RICK2814/teaching-studio?style=for-the-badge&color=38bdf8" alt="Contributors" />
<img src="https://img.shields.io/github/issues-pr/RICK2814/teaching-studio?style=for-the-badge&color=6366f1" alt="Open pull requests" />
</div>

---

## ⭐ Star History

<div align="center">

<a href="https://star-history.com/#RICK2814/teaching-studio&Date">
  <img src="https://api.star-history.com/svg?repos=RICK2814/teaching-studio&type=Date" alt="Star History Chart" width="100%" />
</a>

If Teaching Studio saves you setup time, consider dropping a ⭐ — it helps other educators find it.

</div>

---

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<div align="center">
<img src="./docs/hero-animation.svg" alt="Teaching Studio animated footer" width="100%" />

### **Teaching Studio**
**Capture. Teach. Export. Repeat.**

<sub>Built for teachers who'd rather be teaching than debugging OBS scenes.</sub>

[⬆ Back to top](#-teaching-studio)

</div>
