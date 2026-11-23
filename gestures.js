/* Hand-gesture control for Twin Pane Stereoscope.
   Uses the front camera + MediaPipe hand tracking (loaded from a CDN, runs on this device,
   nothing is uploaded). A recognised pose, held briefly, presses the Previous / Next buttons. */
(function(){
  "use strict";
  var app = document.getElementById('app');
  if(!app) return;
  var WASM  = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
  var MODEL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
  var LIB   = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
  var $ = function(id){ return document.getElementById(id); };

  /* ---------- settings ---------- */
  var S = { scheme:'pointup', hold:450, cooldown:1000, flip:false, auto:true };
  try{ Object.assign(S, JSON.parse(localStorage.getItem('tps.gest.v1') || '{}')); }catch(e){}
  function save(){ try{ localStorage.setItem('tps.gest.v1', JSON.stringify(S)); }catch(e){} }

  var HINTS = {
    finger:  'Hold one finger straight up for next, or two fingers (peace sign) for back.',
    thumbs:  'Thumb up for next, thumb down for back.',
    point:   'Point your index finger sideways: to your right for next, to your left for back.',
    pointup: 'Point your index finger up and lean it diagonally: up-right (your right) for next, up-left for back.',
    pinch:   'Pinch thumb and index finger, then drag left for next or right for back. Release to reset.',
    tilt:    'Hold an open palm up, then tilt it to your right for next, to your left for back.'
  };

  /* ---------- styles + interface ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#panelSet{ max-height:calc(100vh - var(--rail) - 70px); overflow:auto; }' +
    '#gestSec{ display:grid; gap:13px; border-top:1px solid var(--line); padding-top:13px; }' +
    '#gestSec h2{ margin:0; font-family:var(--f-disp); font-size:13px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ochre); }' +
    '#gestSec select{ width:100%; min-width:0; background:#0e1013; color:var(--text); border:1px solid var(--line); border-radius:2px; padding:8px 6px; font:inherit; font-size:13px; }' +
    '#gestCam{ position:absolute; right:12px; top:54px; width:150px; z-index:44; border-radius:4px; overflow:hidden; background:#000; border:1px solid var(--line-hi); transition:opacity .25s ease; }' +
    '#gestCam.gest-off{ opacity:0; pointer-events:none; }' +
    '#gestWrap{ position:relative; width:100%; aspect-ratio:4/3; }' +
    '#gestWrap video, #gestWrap canvas{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }' +
    '#gestLabel{ font-family:var(--f-num); font-size:10px; padding:3px 6px; color:var(--text); background:var(--panel); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }' +
    '#gestBar{ position:absolute; left:0; right:0; top:0; height:3px; background:var(--ochre); transform:scaleX(0); transform-origin:left; z-index:70; pointer-events:none; }';
  document.head.appendChild(css);

  // rail button, placed just before the settings / fullscreen group
  var gestBtn = document.createElement('button');
  gestBtn.id = 'gestBtn'; gestBtn.setAttribute('aria-pressed', 'false'); gestBtn.textContent = 'Gestures';
  gestBtn.title = 'Hand-gesture control (G)';
  var grp = document.createElement('div'); grp.className = 'grp'; grp.appendChild(gestBtn);
  var setGrp = $('settings') && $('settings').parentElement;
  if(setGrp && setGrp.parentElement) setGrp.parentElement.insertBefore(grp, setGrp);

  // settings section
  var sec = document.createElement('div'); sec.id = 'gestSec';
  sec.innerHTML =
    '<h2>Gesture control</h2>' +
    '<select id="gSet" aria-label="Gesture set">' +
      '<option value="pointup">Point up-right = next · up-left = back</option>' +
      '<option value="finger">One finger = next · Two fingers = back</option>' +
      '<option value="thumbs">Thumb up = next · Thumb down = back</option>' +
      '<option value="point">Point right = next · Point left = back</option>' +
      '<option value="pinch">Pinch &amp; drag left = next · right = back</option>' +
      '<option value="tilt">Open palm tilt right = next · left = back</option>' +
    '</select>' +
    '<p class="note" id="gHint"></p>' +
    '<div class="row"><span class="lab">Hold</span><input type="range" id="gHold" min="150" max="1000" step="50"><span class="val" id="gHoldVal"></span></div>' +
    '<div class="row"><span class="lab">Cooldown</span><input type="range" id="gCool" min="300" max="3000" step="100"><span class="val" id="gCoolVal"></span></div>' +
    '<div class="row"><span class="lab">Flip left/right</span><button id="gFlip" aria-pressed="false">Off</button></div>' +
    '<div class="row"><span class="lab">Hide camera after 3</span><button id="gAuto" aria-pressed="true">On</button></div>';
  if($('panelSet')) $('panelSet').appendChild(sec);

  // camera preview + hold bar
  var cam = document.createElement('div'); cam.id = 'gestCam'; cam.className = 'chrome gest-off';
  cam.innerHTML = '<div id="gestWrap"><video id="gestVideo" playsinline muted></video><canvas id="gestOverlay"></canvas></div><div id="gestLabel">camera off</div>';
  app.appendChild(cam);
  var bar = document.createElement('div'); bar.id = 'gestBar'; app.appendChild(bar);
  var video = $('gestVideo'), overlay = $('gestOverlay'), label = $('gestLabel'), octx = overlay.getContext('2d');

  function toast(msg){ var t = $('toast'); if(!t) return; t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function(){ t.classList.remove('on'); }, 1900); }
  function setBar(p){ bar.style.transform = 'scaleX(' + p + ')'; }

  /* ---------- gesture logic ---------- */
  var GRACE_MS = 160, REARM_MS = 350;
  function dist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
  function toUserX(dx){ return S.flip ? dx : -dx; }          // camera frames are not mirrored
  function handSize(lm){ return dist(lm[0], lm[9]) || 0.001; }
  function fingers(lm){
    var w = lm[0];
    function ext(tip, pip){ return dist(lm[tip], w) > dist(lm[pip], w) * 1.1; }
    return { index:ext(8,6), middle:ext(12,10), ring:ext(16,14), pinky:ext(20,18) };
  }
  var NONE = { act:null, label:'—' };
  var pinchStart = null, pinchLocked = false;

  var SCHEMES = {
    finger: { hold:null, detect:function(lm){
      var f = fingers(lm), vx = lm[8].x - lm[5].x, vy = lm[8].y - lm[5].y;
      var up = vy < 0 && Math.abs(vy) > Math.abs(vx);
      if(f.index && !f.middle && !f.ring && !f.pinky) return up ? {act:'next', label:'1 finger → next'} : {act:null, label:'1 finger (point up)'};
      if(f.index && f.middle && !f.ring && !f.pinky)  return up ? {act:'prev', label:'2 fingers → back'} : {act:null, label:'2 fingers (point up)'};
      return NONE;
    }},
    thumbs: { hold:null, detect:function(lm, g){
      if(g && g.score >= 0.6){
        if(g.categoryName === 'Thumb_Up')   return {act:'next', label:'thumb up → next'};
        if(g.categoryName === 'Thumb_Down') return {act:'prev', label:'thumb down → back'};
      }
      return NONE;
    }},
    point: { hold:null, detect:function(lm){
      var f = fingers(lm);
      if(f.index && !f.middle && !f.ring && !f.pinky){
        var vx = lm[8].x - lm[5].x, vy = lm[8].y - lm[5].y;
        if(Math.abs(vx) > 1.6 * Math.abs(vy)){
          return toUserX(vx) > 0 ? {act:'next', label:'point right → next'} : {act:'prev', label:'point left → back'};
        }
        return {act:null, label:'pointing (turn sideways)'};
      }
      return NONE;
    }},
    pointup: { hold:null, detect:function(lm){
      var f = fingers(lm);
      if(f.index && !f.middle && !f.ring && !f.pinky){
        var vx = lm[8].x - lm[5].x, vy = lm[8].y - lm[5].y;
        if(vy >= 0) return {act:null, label:'pointing (aim up)'};
        var raw = Math.atan2(vx, -vy) * 180 / Math.PI;     // 0 = straight up, + = image right
        var ang = S.flip ? raw : -raw;                      // + = toward the user's right
        if(ang >= 22 && ang <= 75)   return {act:'next', label:'point up-right → next'};
        if(ang <= -22 && ang >= -75) return {act:'prev', label:'point up-left → back'};
        return {act:null, label:Math.abs(ang) < 22 ? 'pointing up (lean it)' : 'pointing (too flat)'};
      }
      return NONE;
    }},
    pinch: { hold:60,
      onFire:function(){ pinchLocked = true; pinchStart = null; },
      detect:function(lm){
        var pinching = dist(lm[4], lm[8]) < 0.4 * handSize(lm);
        if(!pinching){ pinchStart = null; pinchLocked = false; return NONE; }
        if(pinchLocked) return {act:null, label:'release pinch'};
        var mx = (lm[4].x + lm[8].x) / 2;
        if(pinchStart === null) pinchStart = mx;
        var disp = toUserX(mx - pinchStart);                // + = user's right
        if(disp < -0.12) return {act:'next', label:'drag left → next'};
        if(disp >  0.12) return {act:'prev', label:'drag right → back'};
        return {act:null, label:'pinched — drag'};
      }
    },
    tilt: { hold:null, detect:function(lm){
      var f = fingers(lm);
      if(!(f.index && f.middle && f.ring && f.pinky)) return NONE;
      var vx = lm[9].x - lm[0].x, vy = lm[9].y - lm[0].y;
      var raw = Math.atan2(vx, -vy) * 180 / Math.PI;        // + = leaning to image right
      var ang = S.flip ? raw : -raw;                          // + = tilted toward the user's right
      if(ang >  30) return {act:'next', label:'tilt right → next'};
      if(ang < -30) return {act:'prev', label:'tilt left → back'};
      return {act:null, label:'open palm (tilt)'};
    }}
  };

  /* hold / cooldown / re-arm, shared by every gesture set */
  var cand = null, candSince = 0, lastSeen = -1e9, armed = true, lastFire = -1e9;
  function engine(act, now){
    var sc = SCHEMES[S.scheme];
    var hold = sc.hold == null ? S.hold : sc.hold;
    if(act === null){
      if(now - lastSeen > GRACE_MS){ cand = null; candSince = 0; setBar(0); }
      if(now - lastSeen > REARM_MS) armed = true;
      return;
    }
    lastSeen = now;
    if(act !== cand){ cand = act; candSince = now; }
    var progress = Math.min(1, (now - candSince) / hold);
    setBar(armed ? progress : 0);
    if(armed && progress >= 1 && now - lastFire > S.cooldown){
      var b = $(act === 'next' ? 'next' : 'prev');
      if(b) b.click();                                       // same path as the on-screen buttons
      onGesture();
      lastFire = now; armed = false; cand = null; setBar(0);
      if(sc.onFire) sc.onFire();
    }
  }

  /* hide the preview once gestures are working; bring it back after 30 s with none */
  var gestureCount = 0, autoHidden = false, idleT = null;
  function onGesture(){
    clearTimeout(idleT);
    idleT = setTimeout(function(){ gestureCount = 0; if(autoHidden){ autoHidden = false; paintCam(); } }, 30000);
    if(!S.auto) return;
    if(++gestureCount >= 3 && !autoHidden){ autoHidden = true; paintCam(); }
  }
  function resetAutoHide(){ clearTimeout(idleT); gestureCount = 0; autoHidden = false; }
  function paintCam(){ cam.classList.toggle('gest-off', !(running && !autoHidden)); }

  /* ---------- settings controls ---------- */
  function paintSettings(){
    $('gSet').value = S.scheme; $('gHint').textContent = HINTS[S.scheme];
    $('gHold').value = S.hold; $('gHoldVal').textContent = S.hold + ' ms';
    $('gCool').value = S.cooldown; $('gCoolVal').textContent = S.cooldown + ' ms';
    var fl = $('gFlip'); fl.textContent = S.flip ? 'On' : 'Off'; fl.setAttribute('aria-pressed', String(!!S.flip));
    var au = $('gAuto'); au.textContent = S.auto ? 'On' : 'Off'; au.setAttribute('aria-pressed', String(!!S.auto));
  }
  paintSettings();
  $('gSet').addEventListener('change', function(e){ S.scheme = e.target.value; pinchStart = null; pinchLocked = false; cand = null; armed = true; paintSettings(); save(); });
  $('gHold').addEventListener('input', function(e){ S.hold = +e.target.value; paintSettings(); save(); });
  $('gCool').addEventListener('input', function(e){ S.cooldown = +e.target.value; paintSettings(); save(); });
  $('gFlip').addEventListener('click', function(){ S.flip = !S.flip; paintSettings(); save(); });
  $('gAuto').addEventListener('click', function(){ S.auto = !S.auto; if(!S.auto){ resetAutoHide(); paintCam(); } paintSettings(); save(); });
  ['gHold','gCool'].forEach(function(id){ $(id).addEventListener('keydown', function(e){ e.stopPropagation(); }); });

  /* ---------- camera + hand tracking ---------- */
  var recognizer = null, stream = null, running = false, starting = false, lastVT = -1;

  function loadRecognizer(){
    if(recognizer) return Promise.resolve(recognizer);
    return import(LIB).then(function(mp){
      return mp.FilesetResolver.forVisionTasks(WASM).then(function(fs){
        function make(delegate){ return mp.GestureRecognizer.createFromOptions(fs, { baseOptions:{ modelAssetPath:MODEL, delegate:delegate }, runningMode:'VIDEO', numHands:1 }); }
        return make('GPU').catch(function(){ return make('CPU'); });
      });
    }).then(function(r){ recognizer = r; return r; });
  }
  function paintBtn(){ gestBtn.setAttribute('aria-pressed', String(running)); gestBtn.textContent = running ? 'Gestures on' : 'Gestures'; }

  function start(){
    if(running || starting) return;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Camera not available here (needs https)'); return; }
    starting = true; toast('Loading hand tracking…'); label.textContent = 'loading…';
    loadRecognizer().then(function(){
      return navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:640}, height:{ideal:480} }, audio:false });
    }).then(function(s){
      stream = s; video.srcObject = s; return video.play();
    }).then(function(){
      overlay.width = video.videoWidth || 640; overlay.height = video.videoHeight || 480;
      running = true; lastVT = -1; resetAutoHide(); paintCam(); paintBtn();
      label.textContent = '—'; toast('Gestures on — ' + HINTS[S.scheme].split('.')[0]);
      requestAnimationFrame(loop);
    }).catch(function(err){
      label.textContent = 'camera off'; toast('Could not start camera' + (err && err.name ? ' (' + err.name + ')' : ''));
    }).then(function(){ starting = false; });
  }
  function stop(){
    running = false;
    if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
    stream = null; video.srcObject = null;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    setBar(0); cand = null; resetAutoHide(); paintCam(); paintBtn();
    label.textContent = 'camera off'; toast('Gestures off');
  }
  function toggle(){ if(running) stop(); else start(); }
  gestBtn.addEventListener('click', toggle);
  window.addEventListener('keydown', function(e){
    if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === 'g' || e.key === 'G'){ toggle(); e.preventDefault(); }
  });

  function draw(lm){
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if(!lm) return;
    octx.fillStyle = '#d2a24c';
    for(var i = 0; i < lm.length; i++){ octx.beginPath(); octx.arc(lm[i].x * overlay.width, lm[i].y * overlay.height, 4, 0, 6.283); octx.fill(); }
  }
  function loop(){
    if(!running) return;
    if(video.readyState >= 2 && video.currentTime !== lastVT){
      lastVT = video.currentTime;
      var now = performance.now(), res = null;
      try{ res = recognizer.recognizeForVideo(video, now); }catch(e){}
      if(res && res.landmarks && res.landmarks.length){
        var lm = res.landmarks[0];
        var g = res.gestures && res.gestures[0] && res.gestures[0][0];
        var r = SCHEMES[S.scheme].detect(lm, g);
        label.textContent = r.label; draw(lm); engine(r.act, now);
      } else {
        label.textContent = '—'; draw(null);
        if(S.scheme === 'pinch'){ pinchStart = null; pinchLocked = false; }
        engine(null, now);
      }
    }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden && running && video.paused) video.play().catch(function(){});
  });
})();
