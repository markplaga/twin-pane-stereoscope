(function(){
  "use strict";
  var app = document.getElementById('app');
  if(!app) return;
  var st = document.createElement('style');
  st.textContent = `
  /* ── Help manual overlay ───────────────────────────────────── */
  #helpBox{ position:absolute; inset:0; z-index:80; display:flex; flex-direction:column; background:var(--ink); color:var(--text); -webkit-user-select:text; user-select:text; }
  #helpBox .hbar{ flex:0 0 auto; display:flex; align-items:center; gap:12px; padding:0 14px; height:46px; background:var(--panel); border-bottom:1px solid var(--line); }
  #helpBox .hbar h1{ margin:0; flex:1 1 auto; font-family:var(--f-disp); font-size:17px; font-weight:600; letter-spacing:.13em; text-transform:uppercase; }
  #helpBox .hbar h1 b{ color:var(--ochre); font-weight:600; }
  #helpBox .hbody{ flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; touch-action:pan-y; padding:18px 16px 60px; }
  #helpBox .hwrap{ max-width:780px; margin:0 auto; font-size:14.5px; line-height:1.62; }
  #helpBox h2{ margin:34px 0 8px; padding-top:6px; font-family:var(--f-disp); font-size:21px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--ochre); border-top:1px solid var(--line); }
  #helpBox h2:first-of-type{ margin-top:22px; }
  #helpBox h3{ margin:20px 0 4px; font-size:15px; font-weight:600; color:var(--text); }
  #helpBox p{ margin:8px 0; color:#cfd3da; }
  #helpBox ul, #helpBox ol{ margin:8px 0; padding-left:22px; color:#cfd3da; }
  #helpBox li{ margin:4px 0; }
  #helpBox b, #helpBox strong{ color:var(--text); font-weight:600; }
  #helpBox kbd{ font-family:var(--f-num); font-size:12px; padding:1px 6px; border:1px solid var(--line-hi); border-bottom-width:2px; border-radius:3px; background:var(--panel-hi); color:var(--text); white-space:nowrap; }
  #helpBox .toc{ display:flex; flex-wrap:wrap; gap:6px; margin:14px 0 4px; }
  #helpBox .toc button{ min-height:30px; padding:5px 10px; font-size:12.5px; background:var(--panel-hi); border:1px solid var(--line); }
  #helpBox table{ width:100%; border-collapse:collapse; margin:10px 0; font-size:13.5px; }
  #helpBox th, #helpBox td{ text-align:left; vertical-align:top; padding:7px 10px; border-bottom:1px solid var(--line); color:#cfd3da; }
  #helpBox th{ font-family:var(--f-disp); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--mute); font-weight:500; }
  #helpBox td:first-child{ white-space:nowrap; color:var(--text); }
  #helpBox .tip{ margin:12px 0; padding:9px 12px; border-left:2px solid var(--ochre-dk); background:#0e1013; color:#cfd3da; }
  #helpBox .lead{ font-size:16px; color:var(--text); }
`;
  document.head.appendChild(st);
  var wrap = document.createElement('div');
  wrap.innerHTML = `
  <div id="helpBox" class="hid" role="dialog" aria-modal="true" aria-label="Twin Pane Stereoscope manual">
    <div class="hbar">
      <h1>Twin Pane <b>Stereoscope</b> · Manual</h1>
      <button id="helpClose" title="Close the manual (Esc)">Close ✕</button>
    </div>
    <div class="hbody"><div class="hwrap">

      <p class="lead">Twin Pane Stereoscope shows a side-by-side stereo photograph as two panes that zoom and pan <b>together</b>, so the left and right views stay lined up at any magnification. It also works as a plain image viewer, and it can show two different pictures side by side. Everything runs on your own device. Your pictures are never uploaded anywhere.</p>

      <div class="toc">
        <button data-go="h-start">Quick start</button>
        <button data-go="h-open">Opening pictures</button>
        <button data-go="h-zips">Zip files</button>
        <button data-go="h-modes">Viewing modes</button>
        <button data-go="h-zoom">Zoom &amp; pan</button>
        <button data-go="h-nav">Moving between plates</button>
        <button data-go="h-show">Slide show</button>
        <button data-go="h-aids">Alignment &amp; aids</button>
        <button data-go="h-full">Full screen</button>
        <button data-go="h-keys">Keyboard &amp; gestures</button>
        <button data-go="h-cross">Cross-eyed viewing</button>
        <button data-go="h-fix">Troubleshooting</button>
      </div>

      <h2 id="h-start">Quick start</h2>
      <ol>
        <li>Tap <b>Folder…</b>, <b>Files…</b> or <b>Zip…</b> in the bottom bar and choose your pictures. (A built-in sample “depth test card” is shown until you do.)</li>
        <li>Each picture is cut in half down the middle. The two halves appear in the two panes. The app starts in <b>cross-eyed</b> mode: the left pane shows the picture’s <i>right</i> half and the right pane shows the <i>left</i> half.</li>
        <li>Pinch, scroll or double-tap to zoom. Both panes zoom to the same spot, so what you see on one side always lines up with the other.</li>
        <li>Use the ◀ ▶ buttons, the arrow keys, or swipe to move to the next picture. Press <b>F</b> or the ⛶ button for full screen.</li>
      </ol>
      <div class="tip">Not a stereo pair? Press <b>Stereo pair</b> in the bar to switch to <b>Single image</b>, or use <b>Side by side</b> to compare two different pictures.</div>

      <h2 id="h-open">Opening pictures</h2>
      <p>Supported types: JPEG, PNG, WebP, GIF, BMP, AVIF. Pictures are sorted by name in natural order, so <i>img2</i> comes before <i>img10</i>.</p>
      <table>
        <tr><th>Button</th><th>What it does</th></tr>
        <tr><td>Folder…</td><td>On a computer, opens a folder and loads every picture inside it, including sub-folders. On a phone or tablet it first shows a small menu: <b>Photo gallery</b> (pick photos from your gallery), <b>Browse folders…</b> (pick a whole folder, where the device supports it) and <b>Zip files or pictures…</b>.</td></tr>
        <tr><td>Files…</td><td>Pick one or more individual pictures. On a phone this opens your photo picker.</td></tr>
        <tr><td>Zip…</td><td>Pick one or more .zip files. Zips and pictures can both be chosen in this picker. See <i>Zip files</i> below.</td></tr>
        <tr><td>Drag &amp; drop</td><td>On a computer, drop pictures, a folder, or zip files anywhere on the page.</td></tr>
      </table>
      <p>Opening a new set of pictures replaces the current one. The header shows the picture’s name and pixel size, and the counter shows your place (for example “3 / 24”). When there is more than one picture, a slider appears in the bar so you can jump anywhere.</p>

      <h2 id="h-zips">Zip files</h2>
      <p>The app unpacks zips on your device and shows the pictures inside, in name order. Folders inside a zip are fine; anything that isn’t a picture is ignored.</p>
      <h3>Several zips in a row</h3>
      <p>You can select <b>more than one zip</b> at once. They are ordered by file name. The first zip opens straight away. Each later zip is <b>only unpacked after you have stepped past the last picture of the one before it</b>, so a large collection never has to sit in memory all at once.</p>
      <ul>
        <li>The header shows your position, for example <b>ZIP 2/4 · PLATE 7 / 31</b>.</li>
        <li>When you move forward from the last picture of the last zip, the app <b>circles back to the first zip</b> and starts over.</li>
        <li>Going backward from the first picture of a zip wraps to that same zip’s last picture; it does not reopen the previous zip.</li>
        <li>A zip with no pictures, or one that can’t be read, is skipped and the next one opens.</li>
        <li>The slide show, arrow keys, swipes and full-screen taps all move through zips the same way.</li>
        <li>Opening a folder or individual pictures cancels any zips still waiting.</li>
      </ul>

      <h2 id="h-modes">Viewing modes</h2>
      <h3>Stereo pair (default)</h3>
      <p>Each picture is a stereo pair with the two views side by side in one image. It is split down the middle. The button in the bar toggles <b>Cross-eye</b> and <b>Parallel</b>:</p>
      <ul>
        <li><b>Cross-eye</b> (default, key <kbd>X</kbd>): left pane = right half, right pane = left half. For viewing by crossing your eyes.</li>
        <li><b>Parallel</b>: left pane = left half, right pane = right half. For a hardware viewer, a VR headset, or parallel (wall-eyed) free viewing.</li>
      </ul>
      <p>Small coloured labels in the corner of each pane say which half is showing. They fade away on their own about ten seconds after the app opens.</p>
      <h3>Side by side (key <kbd>P</kbd>)</h3>
      <p>Shows <b>two different pictures</b> at once, one per pane, separated by a solid black bar. Plates 1 and 2 appear together, then 3 and 4, and so on; every step moves two pictures. If you have an odd number, the last one appears alone on the left. Zoom and pan are still shared, so the same region of both pictures is magnified together. That is handy for comparing two shots. The cross-eye switch, fusion dots and alignment controls are hidden in this mode, since they only apply to stereo pairs. Pictures of different sizes are each centred in their pane without being stretched.</p>
      <h3>Single image (key <kbd>M</kbd>)</h3>
      <p>Treats every file as an ordinary picture: one big pane, no splitting. Turning on Single image turns off Side by side, and the other way round.</p>
      <p>Your choice of mode is remembered between visits (see <i>Troubleshooting</i> if it isn’t).</p>

      <h2 id="h-zoom">Zoom &amp; pan</h2>
      <p>Both panes share a single zoom and position. That is what keeps a stereo pair registered, and it applies at every magnification. The readout in the bar shows the zoom and whether you are at <b>FIT</b> (whole picture visible), <b>NATIVE</b> (one screen pixel per picture pixel) or <b>MAGNIF</b>.</p>
      <ul>
        <li><b>Pinch</b> with two fingers to zoom around the point between them. Drag with two fingers to pan at the same time.</li>
        <li><b>Mouse wheel / trackpad</b> zooms around the pointer. <b>Drag</b> to pan.</li>
        <li><b>Double-tap</b> (or double-click) zooms in about 3×, centred where you tapped. Double-tap again to return to the fit view.</li>
        <li><b>＋ / −</b> buttons, or <kbd>+</kbd> <kbd>−</kbd> and <kbd>↑</kbd> <kbd>↓</kbd>, zoom around the centre.</li>
        <li><b>Fit</b> (<kbd>0</kbd>) shows the whole picture. <b>1:1</b> (<kbd>1</kbd>) goes to native pixels.</li>
      </ul>
      <p>You can zoom out no further than Fit and zoom in to about fourteen times Fit. Panning stops at the picture’s edges.</p>

      <h2 id="h-nav">Moving between plates</h2>
      <ul>
        <li><b>◀ ▶</b> buttons, or <kbd>←</kbd> <kbd>→</kbd>.</li>
        <li><b>Swipe</b> left or right on the pictures. Swiping moves between plates only when you are fully zoomed out, so it never fights with panning.</li>
        <li>The <b>slider</b> in the bar jumps straight to any plate.</li>
        <li>Going past the last plate wraps to the first. (With several zips, it moves to the next zip instead. See <i>Zip files</i>.)</li>
        <li>In <b>full screen</b>, tapping the lower three quarters of the screen also moves: left half = previous, right half = next.</li>
      </ul>
      <h3>Keep zoom</h3>
      <p>With <b>Keep zoom</b> on (settings ⚙, on by default), stepping to the next plate keeps the same relative zoom and centre. Inspect the same detail across a series. Turn it off to open each picture fitted to the screen.</p>

      <h2 id="h-show">Slide show</h2>
      <p>Press <b>Slide show</b> (or <kbd>Space</kbd>) to advance automatically. The <b>Hold</b> box sets how many seconds each plate stays up, from 1 to 120. Press <b>Stop</b> or <kbd>Space</kbd> again to end it. It follows the current mode, so in Side by side it advances two pictures at a time, and with several zips it flows from one zip into the next and loops. You can zoom in on a plate while the show runs; the timer simply moves on to the next plate when it expires.</p>

      <h2 id="h-aids">Alignment &amp; aids</h2>
      <p>Open the <b>⚙ settings</b> panel for these. The stereo-only items are hidden in Single image and Side by side modes.</p>
      <table>
        <tr><th>Control</th><th>What it does</th></tr>
        <tr><td>Stage width</td><td>Narrows the two panes toward the middle (40–100%). Useful if your viewing method works best with the panes closer together.</td></tr>
        <tr><td>Vertical trim</td><td>Nudges the <b>right-hand pane</b> up or down, in picture pixels, for pairs that were cut slightly off vertically.</td></tr>
        <tr><td>Window shift</td><td>Nudges the right-hand pane left or right. This changes where the scene appears to sit relative to the screen (the “stereo window”).</td></tr>
        <tr><td>X− X+ Y− Y+ / Reset</td><td>One-pixel nudges. <kbd>Shift</kbd> + arrow keys do the same.</td></tr>
        <tr><td>Fusion dots</td><td>A small dot at the top of each pane to help your eyes lock together. Toggle with <kbd>D</kbd>.</td></tr>
        <tr><td>Keep zoom</td><td>See <i>Moving between plates</i>.</td></tr>
      </table>
      <p>Trim and shift adjust only the right-hand pane, and the zoom and pan remain shared, so the adjustment stays correct at every magnification.</p>

      <h2 id="h-full">Full screen</h2>
      <p>Press <b>⛶</b> or <kbd>F</kbd>. The app hides its bars and fills the screen with the pictures. If your browser allows real fullscreen it uses it; otherwise it “maximises” inside the page.</p>
      <ul>
        <li><b>Exit:</b> tap or click the <b>top-right corner</b> (an invisible button), or press <kbd>Esc</kbd> or <kbd>F</kbd>.</li>
        <li><b>Previous / next:</b> tap the <b>lower three quarters</b> of the screen: left half goes back, right half goes forward. Nothing is drawn on screen.</li>
        <li><b>Zoom and pan still work.</b> Drag and pinch as usual. Double-tap-to-zoom works in the top quarter of the screen only, because taps below it change plates.</li>
      </ul>
      <div class="tip">If a page title or browser bar stays visible in full screen, the app is running inside another page or app that doesn’t allow real fullscreen. Opening the app directly in a normal browser (for example Chrome) gives true full screen.</div>
      <h3>Hide controls</h3>
      <p>The <b>◱</b> button (or <kbd>H</kbd>) hides all controls without going full screen. Press <kbd>H</kbd> or <kbd>Esc</kbd>, or double-click, to bring them back.</p>

      <h2 id="h-keys">Keyboard &amp; gestures</h2>
      <table>
        <tr><th>Key</th><th>Action</th></tr>
        <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Previous / next plate (two at a time in Side by side)</td></tr>
        <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Zoom in / out</td></tr>
        <tr><td><kbd>+</kbd> <kbd>−</kbd></td><td>Zoom in / out (larger steps)</td></tr>
        <tr><td><kbd>0</kbd></td><td>Fit the whole picture</td></tr>
        <tr><td><kbd>1</kbd></td><td>Native pixels (1:1)</td></tr>
        <tr><td><kbd>X</kbd></td><td>Cross-eye / Parallel</td></tr>
        <tr><td><kbd>P</kbd></td><td>Side by side on / off</td></tr>
        <tr><td><kbd>M</kbd></td><td>Single image / Stereo pair</td></tr>
        <tr><td><kbd>Space</kbd></td><td>Start / stop the slide show</td></tr>
        <tr><td><kbd>F</kbd></td><td>Full screen on / off</td></tr>
        <tr><td><kbd>H</kbd></td><td>Hide / show controls</td></tr>
        <tr><td><kbd>D</kbd></td><td>Fusion dots on / off</td></tr>
        <tr><td><kbd>Shift</kbd> + arrows</td><td>Nudge the right-hand pane by one pixel</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Close panels and this manual; leave full screen; bring back hidden controls</td></tr>
        <tr><td><kbd>?</kbd></td><td>Open this manual</td></tr>
      </table>
      <table>
        <tr><th>Gesture</th><th>Action</th></tr>
        <tr><td>Pinch</td><td>Zoom around the fingers</td></tr>
        <tr><td>Drag</td><td>Pan (when zoomed in)</td></tr>
        <tr><td>Swipe left / right</td><td>Next / previous plate (when zoomed out)</td></tr>
        <tr><td>Double-tap</td><td>Zoom in about 3×, or back to Fit</td></tr>
        <tr><td>Tap, lower ¾ (full screen)</td><td>Left half = previous, right half = next</td></tr>
        <tr><td>Tap, top-right corner (full screen)</td><td>Exit full screen</td></tr>
      </table>

      <h2 id="h-cross">Cross-eyed viewing: a short guide</h2>
      <ol>
        <li>Sit at a comfortable distance and keep the screen at a steady brightness.</li>
        <li>Keep the <b>fusion dots</b> on. Look at the two dots and slowly cross your eyes until they merge into one. You will momentarily see three dots, with the centre one sharp.</li>
        <li>Hold that, and the picture in the middle snaps into a single three-dimensional image.</li>
        <li>If the depth looks inside-out (near things look far), press <kbd>X</kbd> to switch to Parallel, or check that the picture itself is cross-eye or parallel format.</li>
        <li>If one eye’s view looks slightly higher than the other, use <b>Vertical trim</b>.</li>
      </ol>
      <p>Take breaks. Eye strain is a sign to rest, not to push through.</p>

      <h2 id="h-fix">Troubleshooting</h2>
      <h3>The Zip… or Folder… button does nothing</h3>
      <p>Some in-app viewers (for example, an embedded browser inside another app on a tablet) only open file pickers for images. Use <b>Files…</b>, or open the menu from Folder… and choose <b>Zip files or pictures…</b>. If a picker still won’t open, open the viewer in a regular browser such as Chrome. Phones often can’t pick a whole folder; use the photo gallery or Files… instead.</p>
      <h3>“No images found”</h3>
      <p>The folder or zip contained no supported picture types. Check the file extensions.</p>
      <h3>The depth looks wrong or the panes don’t match</h3>
      <p>Press <kbd>X</kbd> to swap the halves. If the pictures aren’t stereo pairs, use Single image (<kbd>M</kbd>) or Side by side (<kbd>P</kbd>).</p>
      <h3>Zip support failed to load</h3>
      <p>The zip reader is downloaded when the page opens. Check your connection and reload.</p>
      <h3>My settings aren’t remembered</h3>
      <p>Mode, alignment, stage width, slide-show time and other settings are saved in your browser. Private browsing or blocked site data prevents this; the app still works, but starts from defaults each time.</p>
      <h3>Large pictures load slowly</h3>
      <p>Very large pictures take a moment to decode. The app preloads the next and previous plates to keep stepping quick.</p>

      <p style="margin-top:34px;color:var(--mute);font-size:13px">Press <kbd>Esc</kbd> or <b>Close</b> to return to your pictures.</p>
    </div></div>
  </div>
`;
  var box = wrap.firstElementChild || wrap.querySelector('#helpBox');
  app.insertBefore(box, document.getElementById('toast'));
  var btn = document.createElement('button');
  btn.className = 'icon'; btn.id = 'help'; btn.title = 'Help and manual (?)'; btn.textContent = '?';
  var hideBtn = document.getElementById('hide');
  hideBtn.parentNode.appendChild(btn);
  function isOpen(){ return !box.classList.contains('hid'); }
  function setHelp(open){
    box.classList.toggle('hid', !open);
    if(open){
      ['panelSet','panelOpen'].forEach(function(id){ var p = document.getElementById(id); if(p) p.classList.add('hid'); });
      var s = document.getElementById('settings'); if(s) s.setAttribute('aria-pressed','false');
      box.querySelector('.hbody').scrollTop = 0;
      document.getElementById('helpClose').focus();
    }
  }
  btn.addEventListener('click', function(){ setHelp(true); });
  document.getElementById('helpClose').addEventListener('click', function(){ setHelp(false); });
  Array.prototype.forEach.call(box.querySelectorAll('[data-go]'), function(b){
    b.addEventListener('click', function(){ var t = document.getElementById(b.getAttribute('data-go')); if(t) t.scrollIntoView({behavior:'smooth', block:'start'}); });
  });
  // capture phase: while the manual is open it owns the keyboard
  window.addEventListener('keydown', function(e){
    if(isOpen()){
      if(e.key === 'Escape'){ setHelp(false); e.preventDefault(); }
      e.stopImmediatePropagation();
      return;
    }
    if(e.key === '?' && !(e.target.tagName === 'INPUT')){ setHelp(true); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
})();
