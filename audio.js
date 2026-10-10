(function(){
  "use strict";
  var app = document.getElementById('app');
  var anchor = document.getElementById('openFolder');
  if(!app || !anchor) return;

  /* ── style ─────────────────────────────────────────────── */
  var st = document.createElement('style');
  st.textContent = `
  #grpSnd .sname{ max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--f-num); font-size:11px; color:var(--mute); padding:0 4px; }
  #grpSnd input[type=range]{ width:70px; }
  #grpSnd button.on{ background:var(--ochre); color:#14100a; }
  @media (max-width:620px){ #grpSnd .sname{ display:none; } #grpSnd input[type=range]{ width:56px; } }
  `;
  document.head.appendChild(st);

  /* ── controls ──────────────────────────────────────────── */
  var grp = document.createElement('div');
  grp.className = 'grp'; grp.id = 'grpSnd';
  grp.innerHTML =
    '<button id="sndOpen" title="Load a WAV (or other audio) file to play as a soundtrack">♪ WAV…</button>' +
    '<button id="sndPlay" class="icon hid" title="Play / pause the soundtrack (S)">▶</button>' +
    '<span class="sname hid" id="sndName"></span>' +
    '<input type="range" id="sndVol" class="hid" min="0" max="100" step="1" value="80" aria-label="Soundtrack volume" title="Volume">' +
    '<button id="sndLoop" class="hid on" aria-pressed="true" title="Repeat the soundtrack">Loop</button>' +
    '<button id="sndClear" class="icon hid" title="Remove the soundtrack">✕</button>';
  anchor.parentNode.parentNode.insertBefore(grp, anchor.parentNode);

  var file = document.createElement('input');
  file.type = 'file'; file.id = 'fileSnd'; file.className = 'hid';
  file.accept = 'audio/*,.wav,audio/wav,audio/x-wav,audio/wave,audio/vnd.wave';
  app.appendChild(file);

  var $ = function(id){ return document.getElementById(id); };
  var bOpen = $('sndOpen'), bPlay = $('sndPlay'), nm = $('sndName'), vol = $('sndVol'), bLoop = $('sndLoop'), bClr = $('sndClear');
  var extra = [nm, vol, bLoop, bClr, bPlay];

  var au = null, url = null, loop = true;
  try{ var sv = JSON.parse(localStorage.getItem('tps.snd') || '{}'); if(typeof sv.v === 'number') vol.value = sv.v; if(typeof sv.l === 'boolean') loop = sv.l; }catch(e){}
  function keep(){ try{ localStorage.setItem('tps.snd', JSON.stringify({v:+vol.value, l:loop})); }catch(e){} }

  function say(msg){
    var t = $('toast'); if(!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(say.t); say.t = setTimeout(function(){ t.classList.remove('on'); }, 1800);
  }
  function paint(){
    var playing = au && !au.paused && !au.ended;
    bPlay.textContent = playing ? '❚❚' : '▶';
    bPlay.setAttribute('aria-pressed', String(!!playing));
    bLoop.classList.toggle('on', loop);
    bLoop.setAttribute('aria-pressed', String(loop));
  }
  function setLoaded(on){ extra.forEach(function(el){ el.classList.toggle('hid', !on); }); }

  function isAudio(f){ return f && (/^audio\//.test(f.type) || /\.(wav|wave|mp3|m4a|aac|ogg|oga|flac|opus|weba)$/i.test(f.name)); }

  function clearSound(){
    if(au){ try{ au.pause(); }catch(e){} au.removeAttribute('src'); au = null; }
    if(url){ URL.revokeObjectURL(url); url = null; }
    setLoaded(false); nm.textContent = '';
    bOpen.textContent = '♪ WAV…';
  }
  function load(f){
    clearSound();
    url = URL.createObjectURL(f);
    au = new Audio(url);
    au.preload = 'auto'; au.loop = loop; au.volume = vol.value/100;
    au.addEventListener('play', paint); au.addEventListener('pause', paint); au.addEventListener('ended', paint);
    au.addEventListener('error', function(){ say('Could not play ' + f.name); clearSound(); });
    nm.textContent = f.name; nm.title = f.name;
    bOpen.textContent = '♪';
    bOpen.title = 'Load a different audio file';
    setLoaded(true); paint();
    var p = au.play();
    if(p && p.catch) p.catch(function(){ say('Tap ▶ to start the sound'); paint(); });
    say('♪ ' + f.name);
  }
  function toggle(){
    if(!au){ file.click(); return; }
    if(au.paused || au.ended){ var p = au.play(); if(p && p.catch) p.catch(function(){}); } else au.pause();
    paint();
  }

  bOpen.addEventListener('click', function(){ file.value = ''; file.click(); });
  file.addEventListener('change', function(){ var f = file.files && file.files[0]; if(!f) return; if(!isAudio(f)){ say('That is not an audio file'); return; } load(f); });
  bPlay.addEventListener('click', toggle);
  bClr.addEventListener('click', function(){ clearSound(); say('Sound removed'); });
  bLoop.addEventListener('click', function(){ loop = !loop; if(au){ au.loop = loop; if(loop && au.ended){ au.play(); } } paint(); keep(); });
  vol.addEventListener('input', function(){ if(au) au.volume = vol.value/100; keep(); });

  /* S toggles the sound; ignored while typing or while the manual is open */
  window.addEventListener('keydown', function(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key !== 's' && e.key !== 'S') return;
    var t = e.target && e.target.tagName;
    if(t === 'INPUT' || t === 'TEXTAREA') return;
    var hb = $('helpBox'); if(hb && !hb.classList.contains('hid')) return;
    toggle(); e.preventDefault();
  });

  /* an audio file dropped on the page loads as the soundtrack (mixed drops still load the pictures) */
  window.addEventListener('drop', function(e){
    var list = e.dataTransfer && e.dataTransfer.files;
    if(!list || !list.length) return;
    var arr = Array.prototype.slice.call(list), a = arr.filter(isAudio);
    if(!a.length) return;
    load(a[0]);
    if(a.length === arr.length){
      e.preventDefault(); e.stopImmediatePropagation();
      app.classList.remove('drop');
    }
  }, true);

  /* ── manual section (only if the manual is present) ────── */
  var hb = $('helpBox');
  if(hb){
    var keysH = $('h-keys');
    if(keysH){
      var sec = document.createElement('div');
      sec.innerHTML =
        '<h2 id="h-sound">Soundtrack (WAV)</h2>' +
        '<p>You can play an audio file while you look at pictures. WAV is what it is made for, though MP3, M4A, OGG and FLAC usually work too. The file stays on your device and is never uploaded.</p>' +
        '<ul>' +
        '<li>Press <b>♪ WAV…</b> in the bar and choose a file. It starts playing straight away. On a computer you can also drop an audio file onto the page.</li>' +
        '<li><b>▶ / ❚❚</b> (or <kbd>S</kbd>) plays and pauses. The slider sets the volume. <b>Loop</b> repeats the sound (on by default). <b>✕</b> removes it.</li>' +
        '<li>The sound is independent of the pictures. It keeps playing as you step through plates, run the slide show, change viewing mode, or go full screen, and it does not restart.</li>' +
        '<li>Loading a different file replaces the current one. Reloading the page forgets the file, so choose it again.</li>' +
        '</ul>' +
        '<div class="tip">If the sound does not start by itself, your browser wants a tap first: press ▶. If the ♪ WAV… button does nothing inside an embedded viewer on a tablet, open the viewer in a regular browser such as Chrome.</div>';
      while(sec.firstChild) keysH.parentNode.insertBefore(sec.firstChild, keysH);
    }
    var toc = hb.querySelector('.toc'), showBtn = toc && toc.querySelector('[data-go="h-show"]');
    if(toc){
      var tb = document.createElement('button'); tb.setAttribute('data-go', 'h-sound'); tb.textContent = 'Soundtrack';
      tb.addEventListener('click', function(){ var t = $('h-sound'); if(t) t.scrollIntoView({behavior:'smooth', block:'start'}); });
      if(showBtn && showBtn.nextSibling) toc.insertBefore(tb, showBtn.nextSibling); else toc.appendChild(tb);
    }
    var rows = hb.querySelectorAll('tr'), spaceRow = null;
    for(var i = 0; i < rows.length; i++){ var k = rows[i].querySelector('kbd'); if(k && k.textContent === 'Space'){ spaceRow = rows[i]; break; } }
    if(spaceRow){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><kbd>S</kbd></td><td>Play / pause the soundtrack</td>';
      spaceRow.parentNode.insertBefore(tr, spaceRow.nextSibling);
    }
  }
})();
