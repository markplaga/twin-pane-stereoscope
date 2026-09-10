# Twin Pane Stereoscope

A single-file, single-page viewer for side-by-side stereo images. Splits the image down the middle into two panes and drives both off **one shared transform** — pan and zoom are always identical on both sides, so the pair stays registered at any magnification, from fit-to-frame to pixel level.

Open `index.html` in any browser — no build step, no dependencies. It also works as-is on GitHub Pages.

## Features

- **Locked stereo zoom/pan** — pinch, wheel, or drag on either pane; both move together by construction.
- **Cross-eyed or parallel viewing** — `X` swaps which half goes in which pane.
- **Folder / file browsing** — point it at a folder of stereo pairs (or drag one onto the page) and step through them with arrow keys, a seek bar, or swipe.
- **Keep zoom across plates** — stay zoomed into the same spot as you move between images.
- **Fine alignment** — vertical trim and horizontal window-shift for pairs that were cut slightly off, plus fusion dots as a free-viewing aid.
- **Maximised / fullscreen view**, hideable chrome, full keyboard control.

## Controls

| Key | Action |
|---|---|
| `←` `→` | Previous / next plate |
| `+` `−` | Zoom in / out |
| `0` | Fit to frame |
| `1` | Native (1:1) pixels |
| `X` | Swap cross-eyed / parallel |
| `F` | Fullscreen / maximise |
| `H` | Hide all chrome |
| `D` | Toggle fusion dots |
| `Shift` + arrows | Nudge right-eye alignment |
| `Esc` | Exit fullscreen / show chrome |

Opens on a generated depth-test card by default — free-view it to confirm alignment before loading your own images.
