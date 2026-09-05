# Troubleshooting

### The bubble shows a black or white square instead of being transparent
Almost always means the overlay `BrowserWindow` was created without
`transparent: true` actually taking effect — this can happen if
`backgroundColor` is set to an opaque value elsewhere, or if a Windows GPU
driver forces DWM compositing off. Confirm Windows is running with
Aero/DWM composition enabled (default on Win10/11) and that
`hasShadow: false` + `transparent: true` are both set on the overlay window
(`src/main/overlayWindow.ts`).

### Green pixels or a color fringe around the bubble
This codebase never uses chroma keying — if you see green, you've likely
modified `compositor.ts` to draw an intermediate canvas with an opaque
green fill before the alpha mask is applied. Check that `ctx.clearRect(...)`
runs at the start of every `compositeFrame` call and that nothing draws to
`outCanvas` outside the clipped shape path.

### Bubble intercepts clicks meant for the app underneath
The overlay window relies on a hover hit-test (`App.tsx` in
`renderer/overlay`) that reads pixel alpha under the cursor and tells main
to toggle `setIgnoreMouseEvents`. If clicks are being swallowed everywhere,
check that `overlayWin.setIgnoreMouseEvents(true, { forward: true })` is
being called on startup and after every drag ends
(`OVERLAY_DRAG_END` handler in `main.ts`).

### Recording has no audio / wrong audio
- "System only" or "Mic + System" requires Windows loopback audio, provided
  by Electron's `setDisplayMediaRequestHandler` with `audio: 'loopback'`.
  This needs Electron ≥ 27 on Windows; confirm your Electron version.
- If mic audio is silent, check Windows privacy settings
  (Settings → Privacy → Microphone) allow desktop apps to access the mic.

### Export fails / "All encoders failed"
The app tries NVENC → QuickSync → AMF → libx264 automatically when
`encoder: 'auto'`. If all four fail, your `ffmpeg-static` binary may not be
present (check `node_modules/ffmpeg-static` after `npm install`) or the
temp `.webm` was corrupted by an unclean shutdown. The unfinalized `.webm`
is preserved at the path reported in the error — it is a normal WebM file
playable in any modern browser or VLC even if MP4 conversion failed.

### High CPU usage / dropped frames during segmentation
Selfie segmentation runs per camera frame on the GPU delegate by default
(`delegate: 'GPU'` in `compositor.ts`). On machines without a capable GPU,
switch it to `'CPU'` — slower per-frame but more predictable — or reduce
`camera.resolution`/`camera.fps` in settings, since the segmentation cost
scales with camera frame size, not screen recording resolution.

### The app won't build / `electron-builder` errors on Windows
Run `npm run postinstall` (`electron-builder install-app-deps`) manually if
`npm install` didn't trigger it. Ensure you're on Node 18+ — older Node
versions can fail native module rebuilds electron-builder performs for
packaging.

### Recovering a lecture after a crash
Look in `%AppData%/teaching-studio/recording-tmp/` for a `<uuid>.webm`
file matching the time of the crash. It's a valid, playable WebM up to the
last flushed chunk (chunks flush roughly every second). You can either play
it directly or run it through the same FFmpeg command `recorder.ts` uses
(`finalizeRecording`) to get a clean MP4.
