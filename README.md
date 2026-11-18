# Twin Pane Stereoscope

A single-page viewer for side-by-side stereo pairs **and** ordinary single pictures. In stereo mode it splits an image down the middle into two panes and drives both off **one shared transform** — pan and zoom stay identical, so the pair stays registered at any magnification.

Open `index.html` in a browser (needs `app.js`, `help.js`, `audio.js`, `profiles.js`, `cast.js` and `receiver.html` next to it). No build step. Works on GitHub Pages. Zip unpacking uses JSZip from a CDN.

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

## Soundtrack

- **♪ WAV…** in the bar loads an audio file (WAV, or usually MP3, M4A, OGG, FLAC) that plays while you view. It stays on the device; nothing is uploaded.
- ▶ / ❚❚ (or `S`) plays and pauses; a slider sets volume; **Loop** repeats (on by default); ✕ removes it. Volume and loop are remembered.
- The sound is independent of the pictures and keeps playing through stepping, slide show, mode changes and full screen. An audio file can also be dropped onto the page.
- If it will not start by itself, press ▶ (browsers may require a tap first).

## Profiles
A profile is a saved setup: the viewing mode (cross-eyed, parallel, side by side, or single 2D image), the alignment, stage width, fusion dots, keep-zoom and slide-show hold settings, the pictures that were open (a zip, several zips, a folder or loose files) and the soundtrack with its volume and loop setting.

- **Save…** in the bar opens the save panel. Type a name and press Save profile. An existing name is updated.
- The **Profiles…** drop-down lists every saved profile and loading one is a single choice. To delete one, pick it, open Save… and press Delete twice.
- A web page cannot read a file path. In **Chrome or Edge on a computer**, files and folders opened with the Folder / Files / Zip / ♪ WAV buttons, or dropped on the page, keep a permission handle in IndexedDB, so loading the profile reopens them (the browser may ask once to allow access). In **Safari, Firefox and on phones and tablets** a browser cannot keep a file location at all, so the save panel has **Keep a copy of the files in this browser** (ticked by default there). It stores the zip, pictures and WAV inside the browser, so the profile reopens them with no picking. The panel shows the size. Each profile keeps its own copy. iOS may clear site storage after about a week of not using the site unless it is added to the Home Screen. Without a copy only the settings and file names are saved, and a toast lists the files to choose again.
- Loading a profile also maximises the viewer (Esc or the top-right corner exits).
- Loading replaces the pictures and the soundtrack the profile saved. A profile saved without a soundtrack leaves the current sound alone.
- Profiles are stored in this browser (`localStorage` key `tps.prof.v2`, handles in the `tps-profiles` IndexedDB). Nothing is uploaded. This is separate from the standalone `profiles.html` settings page.

## Cast to a Chromecast

- **Cast** on the rail (or `C`) opens Chrome's device picker. Pick a Chromecast and the TV shows only the pictures, with no controls; the phone or tablet stays the remote.
- Uses the browser Presentation API: `receiver.html` runs on the Chromecast, and `cast.js` streams each picture and the current zoom/pan to it from the sender. Stepping, slide show, zoom, pan, swap, side by side, single image and right-eye nudge all follow. Fusion dots and eye labels are not shown on the TV.
- Needs Chrome and the page served over **https** (GitHub Pages works). The button is hidden where the API is missing (Safari, Firefox, all iOS browsers). The sender and Chromecast must be on the same network.
- Not yet verified on real hardware: it was tested against a simulated connection only.

## Full screen

- `F` or the full-screen button maximises the viewer.
- Invisible controls: tap the **top-right corner** to exit; tap the **lower four fifths** of the screen to move — left half = previous, right half = next.
- Double-tap-to-zoom works in the top fifth while in full screen.

## Other features

- Locked zoom/pan across both eyes in stereo mode.
- Keep zoom when stepping between plates.
- Vertical trim and window shift for pairs cut slightly off.
- Fusion dots as a free-viewing aid; eye labels fade after about ten seconds.
- Hideable chrome.
- Optional WAV soundtrack.
- Cast to a Chromecast.
- Built-in manual (**?**).

## Controls

| Key | Action |
|---|---|
| `Left` `Right` | Previous / next plate |
| `Space` | Start / stop slide show |
| `S` | Play / pause soundtrack |
| `+` `-` | Zoom in / out |
| `0` | Fit to frame |
| `1` | Native (1:1) pixels |
| `X` | Swap cross-eyed / parallel |
| `P` | Side by side on / off |
| `M` | Stereo pair / single image |
| `C` | Cast to a Chromecast |
| `F` | Fullscreen / maximise |
| `H` | Hide all chrome |
| `D` | Toggle fusion dots |
| `Shift` + arrows | Nudge right-eye alignment |
| `?` | Open the manual |
| `Esc` | Close manual / exit fullscreen / show chrome |

## Tablets and in-app viewers

Some embedded viewers (for example inside another app on an Android tablet) only open file pickers that accept images. Use **Files…**, or the **Zip files or pictures…** entry in the Folder menu. If a picker still will not open, open the page in a regular browser such as Chrome.

Opens on a generated depth-test card. Load your own files before starting a slide show.
