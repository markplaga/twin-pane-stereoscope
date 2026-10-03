# Twin Pane Stereoscope

A single-page viewer for side-by-side stereo pairs **and** ordinary single pictures. In stereo mode it splits an image down the middle into two panes and drives both off **one shared transform** — pan and zoom stay identical, so the pair stays registered at any magnification.

Open `index.html` in a browser (needs `app.js` and `help.js` next to it). No build step. Works on GitHub Pages. Zip unpacking uses JSZip from a CDN.

Press **?** (or the **?** button on the rail) for the built-in manual.

## Viewing modes

- **Stereo pair** (default) — image is treated as left|right halves. `X` swaps them for cross-eyed vs parallel / VR viewing.
- **Side by side** — press `P` or the **Side by side** button. Shows two *different* pictures at once, one per pane, separated by a black bar. Each step advances two pictures; an odd last picture appears alone. Zoom and pan are still shared.
- **Single image** — press `M` or the **Stereo pair** button on the rail. The second pane, fusion dots, and alignment tools drop away. The whole file is one picture: useful for normal photos, not just 3D plates. Slide show, folder, files, and zip still work in this mode.

## Load images

- **Folder…** — every image in a folder (on a phone this first asks gallery vs folder vs zip/pictures).
- **Files…** — pick individual pictures.
- **Zip…** — pick one or more `.zip` files already on the device. They are unpacked locally in the browser (no upload). jpeg, png, webp, gif, bmp, avif inside each archive are loaded in name order, including files in subfolders.
- **Drag and drop** a folder, loose images, or `.zip` files onto the page.

### Multiple zips

Select several zips at once. The first opens immediately; each later zip is only unpacked after you step past the last picture of the previous one. After the last picture of the last zip, the viewer wraps back to the first zip. The header shows `ZIP n/N`.

## Slide show

- **Slide show** on the rail, or `Space`, starts and stops.
- **Hold** is seconds between plates (1–120). Changing it while running restarts the timer. The value is remembered.
- Needs at least two loaded images. Loops the set (and flows through multiple zips). Arrow keys and the seek bar still work; the timer arms again after each plate.

## Full screen

- `F` or the full-screen button maximises the viewer.
- Invisible controls: tap the **top-right corner** to exit; tap the **lower three quarters** of the screen to move — left half = previous, right half = next.
- Double-tap-to-zoom works in the top quarter while in full screen.

## Other features

- Locked zoom/pan across both eyes in stereo mode.
- Keep zoom when stepping between plates.
- Vertical trim and window shift for pairs cut slightly off.
- Fusion dots as a free-viewing aid; eye labels fade after about ten seconds.
- Hideable chrome.
- Built-in manual (**?**).

## Controls

| Key | Action |
|---|---|
| `Left` `Right` | Previous / next plate |
| `Space` | Start / stop slide show |
| `+` `-` | Zoom in / out |
| `0` | Fit to frame |
| `1` | Native (1:1) pixels |
| `X` | Swap cross-eyed / parallel |
| `P` | Side by side on / off |
| `M` | Stereo pair / single image |
| `F` | Fullscreen / maximise |
| `H` | Hide all chrome |
| `D` | Toggle fusion dots |
| `Shift` + arrows | Nudge right-eye alignment |
| `?` | Open the manual |
| `Esc` | Close manual / exit fullscreen / show chrome |

## Tablets and in-app viewers

Some embedded viewers (for example inside another app on an Android tablet) only open file pickers that accept images. Use **Files…**, or the **Zip files or pictures…** entry in the Folder menu. If a picker still will not open, open the page in a regular browser such as Chrome.

Opens on a generated depth-test card. Load your own files before starting a slide show.
