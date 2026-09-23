# Twin Pane Stereoscope

A single-page viewer for side-by-side stereo pairs **and** ordinary single pictures. In stereo mode it splits an image down the middle into two panes and drives both off **one shared transform** — pan and zoom stay identical, so the pair stays registered at any magnification.

Open `index.html` in a browser (needs `app.js` next to it). No build step. Works on GitHub Pages. Zip unpacking uses JSZip from a CDN.

## Viewing modes

- **Stereo pair** (default) — image is treated as left|right halves. `X` swaps them for cross-eyed vs parallel / VR viewing.
- **Single image** — press `M` or the **Stereo pair** button on the rail. The second pane, fusion dots, and alignment tools drop away. The whole file is one picture: useful for normal photos, not just 3D plates. Slide show, folder, files, and zip still work in this mode.

## Load images

- **Folder…** — every image in a folder (on a phone this first asks gallery vs folder).
- **Files…** — pick individual pictures.
- **Zip…** — pick a `.zip` already on the device. It is unpacked locally in the browser (no upload). jpeg, png, webp, gif, bmp, avif inside the archive are loaded in name order, including files in subfolders.
- **Drag and drop** a folder, loose images, or a `.zip` onto the page.

## Slide show

- **Slide show** on the rail, or `Space`, starts and stops.
- **Hold** is seconds between plates (1–120). Changing it while running restarts the timer. The value is remembered.
- Needs at least two loaded images. Loops the set. Arrow keys and the seek bar still work; the timer arms again after each plate.

## Other features

- Locked zoom/pan across both eyes in stereo mode.
- Keep zoom when stepping between plates.
- Vertical trim and window shift for pairs cut slightly off.
- Fusion dots as a free-viewing aid.
- Maximise / fullscreen, hideable chrome.

## Controls

| Key | Action |
|---|---|
| `Left` `Right` | Previous / next plate |
| `Space` | Start / stop slide show |
| `+` `-` | Zoom in / out |
| `0` | Fit to frame |
| `1` | Native (1:1) pixels |
| `X` | Swap cross-eyed / parallel |
| `M` | Stereo pair / single image |
| `F` | Fullscreen / maximise |
| `H` | Hide all chrome |
| `D` | Toggle fusion dots |
| `Shift` + arrows | Nudge right-eye alignment |
| `Esc` | Exit fullscreen / show chrome |

Opens on a generated depth-test card. Load your own files before starting a slide show.
