(function(){
  "use strict";
  var app = document.getElementById('app');
  var stage = document.getElementById('stage');
  var paneA = document.getElementById('paneA'), paneB = document.getElementById('paneB');
  var frameA = document.getElementById('frameA'), frameB = document.getElementById('frameB');
  var imgA = document.getElementById('imgA'), imgB = document.getElementById('imgB');
  var S = { swap:true, mono:false, dots:true, keep:true, stagew:100, ax:0, ay:0, hold:5, pair:false };
  try{ var raw = localStorage.getItem('tps.v1'); if(raw) S = Object.assign(S, JSON.parse(raw)); }catch(e){}
  function save(){ try{ localStorage.setItem('tps.v1', JSON.stringify(S)); }catch(e){} }
  var plates = [], idx = 0, playing = false, playTimer = 0, dims1 = null, dims2 = null;
  var zipQueue = [], zipAll = [], zipNo = 0, zipTotal = 0, zipBusy = false;
  function stepN(){ return S.pair ? 2 : 1; }
  var natW = 0, natH = 0, halfW = 0, view = { s:1, tx:0, ty:0 }, fitS = 1, paneW = 1, paneH = 1;
  function sampleURL(){
    var EW = 900, EH = 600, c = document.createElement('canvas');
    c.width = EW*2; c.height = EH;
    var g = c.getContext('2d');
    function eye(ox, sign){
      g.save(); g.beginPath(); g.rect(ox,0,EW,EH); g.clip(); g.translate(ox,0);
      g.fillStyle = '#10141c'; g.fillRect(0,0,EW,EH);
      for(var i=0;i<3;i++){
        var d = [-28,0,40][i], xo = sign*d/2;
        g.fillStyle = '#161a22'; g.fillRect(80+i*240+xo, 160, 200, 160);
        g.strokeStyle = d>0 ? '#d2a24c' : (d<0 ? '#4aa6c4' : '#8d959f');
        g.strokeRect(80.5+i*240+xo, 160.5, 199, 159);
        g.fillStyle = '#e6e8ec'; g.font = '16px sans-serif';
        g.fillText(['BEHIND','WINDOW','FRONT'][i], 96+i*240+xo, 220);
      }
      g.restore();
    }
    eye(0,-1); eye(EW,1);
    return c.toDataURL('image/png');
  }
  function measure(){ var r = paneA.getBoundingClientRect(); paneW = Math.max(1, r.width); paneH = Math.max(1, r.height); if(!halfW) return; fitS = Math.min(paneW/halfW, paneH/natH); }
  function maxS(){ return Math.max(fitS*14, 6); }
  function clamp(){ var w = halfW*view.s, h = natH*view.s; view.tx = (w <= paneW) ? (paneW-w)/2 : Math.min(0, Math.max(paneW-w, view.tx)); view.ty = (h <= paneH) ? (paneH-h)/2 : Math.min(0, Math.max(paneH-h, view.ty)); }
  function render(){ if(!halfW) return; clamp(); var s = view.s; frameA.style.width = frameB.style.width = halfW+'px'; frameA.style.height = frameB.style.height = natH+'px'; frameA.style.transform = 'translate('+view.tx.toFixed(2)+'px,'+view.ty.toFixed(2)+'px) scale('+s+')'; frameB.style.transform = 'translate('+(view.tx+(S.pair?0:S.ax)*s).toFixed(2)+'px,'+(view.ty+(S.pair?0:S.ay)*s).toFixed(2)+'px) scale('+s+')'; var pct = Math.round(s*100); document.getElementById('zoomRead').innerHTML = pct+'%<small>'+(Math.abs(s-fitS)<fitS*0.005?'FIT':(Math.abs(s-1)<0.005?'NATIVE':'MAGNIF'))+'</small>'; }
  function fitView(){ measure(); view.s = fitS; clamp(); render(); }
  function zoomAbout(px, py, factor){ var ns = Math.min(maxS(), Math.max(fitS, view.s*factor)); if(ns === view.s) return; var k = ns/view.s; view.tx = px - (px - view.tx)*k; view.ty = py - (py - view.ty)*k; view.s = ns; render(); }
  function zoomCentre(f){ zoomAbout(paneW/2, paneH/2, f); }
  function setSlug(){ var p = plates[idx] || {name:'—'}, p2 = S.pair ? plates[idx+1] : null; document.getElementById('slugName').textContent = p.name + (p2 ? '  +  '+p2.name : ''); document.getElementById('slugDim').textContent = !natW ? '—' : (S.pair ? ((dims1?dims1[0]:natW)+'×'+(dims1?dims1[1]:natH)+(dims2?'  +  '+dims2[0]+'×'+dims2[1]:'')) : S.mono ? (natW+'×'+natH) : (natW+'×'+natH+'  ·  '+halfW+'×'+natH+' per eye')); var lab = (S.pair && p2) ? ((idx+1)+'–'+(idx+2)) : String(idx+1); document.getElementById('counter').innerHTML = lab+' / '+plates.length+'<small>PLATE</small>'; document.getElementById('plateNo').textContent = (zipTotal > 1 ? 'ZIP '+zipNo+'/'+zipTotal+' · ' : '')+'PLATE '+lab+' / '+plates.length; var seek = document.getElementById('seek'); seek.max = Math.max(0, plates.length-1); seek.step = stepN(); seek.value = idx; seek.classList.toggle('hid', plates.length < 2); }
  function clampHold(n){ n = parseFloat(n); if(!isFinite(n)) n = 5; return Math.max(1, Math.min(120, Math.round(n))); }
  function paintPlay(){ var b = document.getElementById('play'); b.setAttribute('aria-pressed', String(playing)); b.textContent = playing ? 'Stop' : 'Slide show'; document.getElementById('hold').value = S.hold; document.getElementById('holdVal').textContent = S.hold+' s'; }
  function armPlay(){ clearTimeout(playTimer); playTimer = 0; if(!playing || plates.length < 2) return; playTimer = setTimeout(function(){ show(idx+stepN()); }, S.hold*1000); }
  function setPlaying(on){ playing = !!on && plates.length >= 2; if(!playing){ clearTimeout(playTimer); playTimer = 0; } paintPlay(); armPlay(); if(playing) toast('Slide show · '+S.hold+' s'); else if(plates.length) toast('Slide show stopped'); }
  function loadDims(url, cb){ var im = new Image(); im.onload = function(){ cb(im.naturalWidth, im.naturalHeight); }; im.onerror = function(){ cb(0,0); }; im.src = url; }
  function show(i, opts){ if(!plates.length) return; if(i >= plates.length && opts !== 'first' && (zipQueue.length || zipAll.length > 1)){ loadNextZip(); return; } idx = (i + plates.length) % plates.length; if(S.pair) idx -= idx % 2; var p = plates[idx], p2 = S.pair ? plates[idx+1] : null; var keep = S.keep && halfW && opts !== 'first'; var ratio = keep ? view.s/fitS : 1; var cxN = keep ? ((paneW/2 - view.tx)/view.s)/halfW : .5; var cyN = keep ? ((paneH/2 - view.ty)/view.s)/natH : .5;
    loadDims(p.url, function(w, h){ if(!w){ toast('Could not read '+p.name); return; }
      function go(w2, h2){
        if(S.pair){ dims2 = w2 ? [w2,h2] : null; dims1 = [w,h]; natW = w; halfW = Math.max(w,w2); natH = Math.max(h,h2); imgA.src = p.url; imgA.style.width = w+'px'; imgA.style.height = h+'px'; imgA.style.left = ((halfW-w)/2)+'px'; imgA.style.top = ((natH-h)/2)+'px'; if(w2){ imgB.src = p2.url; imgB.style.visibility = 'visible'; imgB.style.width = w2+'px'; imgB.style.height = h2+'px'; imgB.style.left = ((halfW-w2)/2)+'px'; imgB.style.top = ((natH-h2)/2)+'px'; } else imgB.style.visibility = 'hidden'; }
        else { dims1 = dims2 = null; natW = w; natH = h; halfW = S.mono ? natW : Math.floor(natW/2); imgA.src = imgB.src = p.url; imgA.style.width = imgB.style.width = natW+'px'; imgA.style.height = imgB.style.height = natH+'px'; imgA.style.top = imgB.style.top = '0px'; imgB.style.visibility = 'visible'; }
        applySwap(); measure(); view.s = keep ? Math.min(maxS(), Math.max(fitS, fitS*ratio)) : fitS; view.tx = paneW/2 - cxN*halfW*view.s; view.ty = paneH/2 - cyN*natH*view.s; render(); setSlug(); preload(idx+stepN()); preload(idx+stepN()+1); preload(idx-stepN()); armPlay();
      }
      if(S.pair && p2) loadDims(p2.url, function(w2, h2){ go(w2, h2); }); else go(0,0);
    });
  }
  function preload(i){ if(plates.length < 2) return; var p = plates[(i+plates.length)%plates.length]; if(p && !p.pre){ p.pre = new Image(); p.pre.src = p.url; } }
  function applySwap(){ if(S.pair){ paneA.dataset.eye = 'PICTURE 1'; paneB.dataset.eye = 'PICTURE 2'; paneA.dataset.tab = ''; paneB.dataset.tab = ''; document.getElementById('modeTag').textContent = 'Side by side'; return; } if(S.mono){ imgA.style.left = '0px'; paneA.dataset.eye = 'IMAGE'; paneA.dataset.tab = ''; document.getElementById('modeTag').textContent = 'Single image'; return; } imgA.style.left = (S.swap ? -halfW : 0)+'px'; imgB.style.left = (S.swap ? 0 : -halfW)+'px'; paneA.dataset.eye = S.swap ? 'RIGHT HALF' : 'LEFT HALF'; paneB.dataset.eye = S.swap ? 'LEFT HALF' : 'RIGHT HALF'; paneA.dataset.tab = S.swap ? 'R' : 'L'; paneB.dataset.tab = S.swap ? 'L' : 'R'; document.getElementById('modeTag').textContent = S.swap ? 'Cross-eyed' : 'Parallel / VR'; var sw = document.getElementById('swap'); sw.textContent = S.swap ? 'Cross-eye' : 'Parallel'; sw.setAttribute('aria-pressed', String(S.swap)); }
  function syncModes(){ app.classList.toggle('mono', !!S.mono); app.classList.toggle('pair', !!S.pair); var b = document.getElementById('mono'); b.textContent = S.mono ? 'Single image' : 'Stereo pair'; b.setAttribute('aria-pressed', String(!!S.mono)); var q = document.getElementById('pair'); q.textContent = 'Side by side'; q.setAttribute('aria-pressed', String(!!S.pair)); }
  function changeMode(){ syncModes(); save(); if(plates.length) show(idx, 'first'); }
  function applyMono(){ app.classList.toggle('mono', !!S.mono); var b = document.getElementById('mono'); b.textContent = S.mono ? 'Single image' : 'Stereo pair'; b.setAttribute('aria-pressed', String(!!S.mono)); if(natW){ halfW = S.mono ? natW : Math.floor(natW/2); applySwap(); measure(); view.s = fitS; render(); setSlug(); } }
  var IMG_RE = /\.(jpe?g|png|webp|gif|bmp|avif|jfif)$/i;
  var coll = new Intl.Collator(undefined, {numeric:true, sensitivity:'base'});
  function loadFiles(list){ var files = Array.prototype.slice.call(list).filter(function(f){ return IMG_RE.test(f.name) || /^image\//.test(f.type||''); }); if(!files.length){ toast('No images found there'); return; } files.sort(function(a,b){ return coll.compare(a.webkitRelativePath||a.name, b.webkitRelativePath||b.name); }); zipQueue = []; zipAll = []; zipNo = 0; zipTotal = 0; plates.forEach(function(p){ if(p.revoke) URL.revokeObjectURL(p.url); }); plates = files.map(function(f){ return { name: f.webkitRelativePath||f.name, url: URL.createObjectURL(f), revoke:true }; }); idx = 0; show(0, 'first'); toast(plates.length+(plates.length===1?' plate loaded':' plates loaded')); }
  function mimeFor(name){ var ext = (/\.([a-z0-9]+)$/i.exec(name)||[,''])[1].toLowerCase(); return {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',avif:'image/avif',jfif:'image/jpeg'}[ext]||'application/octet-stream'; }
  function isZip(f){ return /\.zip$/i.test(f.name); }
  function unzipFile(file){ zipQueue = []; zipAll = [file]; zipNo = 1; zipTotal = 1; readZip(file); }
  function openZips(list){ var zs = Array.prototype.slice.call(list).filter(isZip); if(!zs.length){ toast('No zip files selected'); return; } zs.sort(function(a,b){ return coll.compare(a.name, b.name); }); zipAll = zs; zipQueue = zs.slice(1); zipNo = 1; zipTotal = zs.length; readZip(zs[0]); }
  function loadNextZip(){ if(zipBusy) return; if(!zipQueue.length){ if(zipAll.length < 2) return; zipQueue = zipAll.slice(1); zipNo = 1; readZip(zipAll[0]); return; } zipNo++; readZip(zipQueue.shift()); }
  function readZip(file){ if(!window.JSZip){ toast('Zip support failed to load'); return; } zipBusy = true; toast('Unpacking '+file.name); JSZip.loadAsync(file).then(function(zip){ var entries = []; zip.forEach(function(path, entry){ if(!entry.dir && IMG_RE.test(entry.name)) entries.push(entry); }); if(!entries.length){ toast('No images found in '+file.name); return null; } entries.sort(function(a,b){ return coll.compare(a.name,b.name); }); return Promise.all(entries.map(function(entry){ return entry.async('arraybuffer').then(function(buf){ return { name: entry.name, url: URL.createObjectURL(new Blob([buf],{type:mimeFor(entry.name)})), revoke:true }; }); })); }).then(function(newPlates){ zipBusy = false; if(!newPlates){ if(zipQueue.length) loadNextZip(); return; } plates.forEach(function(p){ if(p.revoke) URL.revokeObjectURL(p.url); }); plates = newPlates; idx = 0; show(0,'first'); toast((zipTotal > 1 ? 'Zip '+zipNo+' of '+zipTotal+': ' : '')+plates.length+(plates.length===1?' plate':' plates')+' from '+file.name); }).catch(function(){ zipBusy = false; toast('Could not read '+file.name); if(zipQueue.length) loadNextZip(); }); }
  var ptrs = new Map(), activePane = null, prevC = null, prevD = 0, swipeAcc = 0, swiping = false, lastTap = 0, moved = 0;
  function local(e){ var r = (activePane||paneA).getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; }
  function centroid(){ var xs=0,ys=0,n=0; ptrs.forEach(function(p){ xs+=p.x; ys+=p.y; n++; }); return {x:xs/n,y:ys/n}; }
  function spread(){ var a=Array.from(ptrs.values()); if(a.length<2) return 0; return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); }
  stage.addEventListener('pointerdown', function(e){ var pane = e.target.closest && e.target.closest('.pane'); if(!pane) return; if(!ptrs.size) activePane = pane; pane.setPointerCapture && pane.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, local(e)); prevC = centroid(); prevD = spread(); moved = 0; swipeAcc = 0; swiping = (ptrs.size===1) && (view.s<=fitS*1.02) && plates.length>1; activePane.classList.add('dragging'); e.preventDefault(); });
  stage.addEventListener('pointermove', function(e){ if(!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, local(e)); var c = centroid(), d = spread(); if(ptrs.size>=2){ swiping=false; if(prevD>0&&d>0) zoomAbout(c.x,c.y,d/prevD); view.tx+=c.x-prevC.x; view.ty+=c.y-prevC.y; render(); } else { var dx=c.x-prevC.x, dy=c.y-prevC.y; moved+=Math.abs(dx)+Math.abs(dy); if(swiping) swipeAcc+=dx; else { view.tx+=dx; view.ty+=dy; render(); } } prevC=c; prevD=d; e.preventDefault(); });
  function endPtr(e){ if(!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if(ptrs.size){ prevC=centroid(); prevD=spread(); return; } if(activePane) activePane.classList.remove('dragging'); if(swiping && Math.abs(swipeAcc)>Math.max(50,paneW*0.12)) show(idx+(swipeAcc<0?1:-1)*stepN()); else if(moved<6){ var sr = stage.getBoundingClientRect(); if(e.type==='pointerup' && app.classList.contains('maxed') && e.clientY > sr.top + sr.height*0.25){ show(idx + (e.clientX < sr.left + sr.width/2 ? -1 : 1)*stepN()); lastTap = 0; } else { var now=Date.now(); if(now-lastTap<320){ var p=local(e); if(view.s>fitS*1.02) fitView(); else zoomAbout(p.x,p.y,3.2); lastTap=0; } else lastTap=now; } } swiping=false; activePane=null; }
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);
  stage.addEventListener('wheel', function(e){ e.preventDefault(); activePane = e.target.closest ? (e.target.closest('.pane')||paneA) : paneA; var p = local(e); zoomAbout(p.x,p.y, Math.exp(-e.deltaY*(e.deltaMode===1?0.05:0.0018))); activePane=null; }, {passive:false});
  function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(function(){ t.classList.remove('on'); },1900); }
  function on(id, fn){ document.getElementById(id).addEventListener('click', fn); }
  on('prev', function(){ show(idx-stepN()); });
  on('next', function(){ show(idx+stepN()); });
  on('play', function(){ setPlaying(!playing); });
  document.getElementById('hold').addEventListener('change', function(e){ S.hold = clampHold(e.target.value); paintPlay(); save(); if(playing) armPlay(); });
  document.getElementById('hold').addEventListener('keydown', function(e){ e.stopPropagation(); });
  on('zin', function(){ zoomCentre(1.35); });
  on('zout', function(){ zoomCentre(1/1.35); });
  on('fit', fitView);
  on('one', function(){ var cx=(paneW/2-view.tx)/view.s, cy=(paneH/2-view.ty)/view.s; view.s=Math.min(maxS(), Math.max(fitS,1)); view.tx=paneW/2-cx*view.s; view.ty=paneH/2-cy*view.s; render(); });
  on('swap', function(){ S.swap=!S.swap; applySwap(); save(); });
  on('mono', function(){ S.mono=!S.mono; if(S.mono) S.pair=false; changeMode(); });
  on('pair', function(){ S.pair=!S.pair; if(S.pair) S.mono=false; changeMode(); });
  document.getElementById('seek').addEventListener('input', function(e){ show(+e.target.value); });
  var openPanel=document.getElementById('panelOpen'), folderBtn=document.getElementById('openFolder');
  var coarse=!!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches);
  function closeOpenPanel(){ openPanel.classList.add('hid'); folderBtn.setAttribute('aria-expanded','false'); }
  on('openFolder', function(){ if(!coarse){ document.getElementById('fileFolder').click(); return; } var willOpen=openPanel.classList.contains('hid'); document.getElementById('panelSet').classList.add('hid'); document.getElementById('settings').setAttribute('aria-pressed','false'); if(willOpen){ openPanel.style.bottom=(document.querySelector('footer').offsetHeight+8)+'px'; openPanel.classList.remove('hid'); } else closeOpenPanel(); });
  on('openGallery', function(){ closeOpenPanel(); document.getElementById('filePick').click(); });
  on('openDir', function(){ closeOpenPanel(); document.getElementById('fileFolder').click(); });
  on('openFiles', function(){ document.getElementById('filePick').click(); });
  document.addEventListener('pointerdown', function(e){ if(openPanel.classList.contains('hid')) return; if(openPanel.contains(e.target)||folderBtn.contains(e.target)) return; closeOpenPanel(); }, true);
  document.getElementById('fileFolder').addEventListener('change', function(e){ loadFiles(e.target.files); e.target.value=''; });
  document.getElementById('filePick').addEventListener('change', function(e){ loadFiles(e.target.files); e.target.value=''; });
  function routeFiles(list){ var fl = Array.prototype.slice.call(list); if(!fl.length) return; if(fl.some(isZip)) openZips(fl); else loadFiles(fl); }
  document.getElementById('fileZip').addEventListener('change', function(e){ var fl = Array.prototype.slice.call(e.target.files); e.target.value=''; if(fl.length && !fl.some(isZip)){ toast('That doesn’t look like a .zip file'); return; } if(fl.length) openZips(fl); });
  document.getElementById('fileAny').addEventListener('change', function(e){ var fl = Array.prototype.slice.call(e.target.files); e.target.value=''; routeFiles(fl); });
  on('openAny', function(){ closeOpenPanel(); document.getElementById('fileAny').click(); });
  on('openZip', function(){ document.getElementById('fileAny').click(); });
  function fsElement(){ return document.fullscreenElement||document.webkitFullscreenElement||null; }
  function fsExit(){ if(document.exitFullscreen) return document.exitFullscreen(); if(document.webkitExitFullscreen) return document.webkitExitFullscreen(); }
  function fsRequest(el){ var fn=el.requestFullscreen||el.webkitRequestFullscreen; if(!fn) return Promise.reject(); try{ return Promise.resolve(fn.call(el,{navigationUI:'hide'})); }catch(err){ return Promise.reject(err); } }
  function relayout(){ requestAnimationFrame(function(){ var ratio=fitS?view.s/fitS:1; measure(); view.s=Math.min(maxS(),Math.max(fitS,fitS*ratio)); render(); }); }
  function setMax(on){ app.classList.toggle('maxed', on); relayout(); if(on) toast('Tap bottom-left / bottom-right for previous / next · top-right corner or Esc to exit'); }
  on('full', function(){ if(app.classList.contains('maxed')){ if(fsElement()) fsExit(); setMax(false); return; } setMax(true); fsRequest(app).catch(function(){ toast('Maximised instead. Esc to exit.'); }); });
  on('exitMax', function(){ document.getElementById('full').click(); });
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(t){ document.addEventListener(t, function(){ if(!fsElement()&&app.classList.contains('maxed')) setMax(false); else relayout(); }); });
  on('hide', function(){ app.classList.add('hidechrome'); toast('Controls hidden — press H or tap twice'); });
  var setBtn=document.getElementById('settings'), setPanel=document.getElementById('panelSet');
  on('settings', function(){ closeOpenPanel(); var open=setPanel.classList.toggle('hid'); setBtn.setAttribute('aria-pressed', String(!open)); });
  function bindRange(id,key,fmt,after){ var el=document.getElementById(id), out=document.getElementById(id+'Val'); el.value=S[key]; out.textContent=fmt(S[key]); el.addEventListener('input', function(){ S[key]=+el.value; out.textContent=fmt(S[key]); if(after) after(); render(); save(); }); }
  bindRange('stagew','stagew',function(v){return v+'%';}, function(){ stage.style.setProperty('--stagew', S.stagew+'%'); document.getElementById('dots').style.setProperty('--stagew', S.stagew+'%'); requestAnimationFrame(function(){ measure(); if(view.s<fitS) view.s=fitS; render(); }); });
  bindRange('alignY','ay',function(v){return v+' px';});
  bindRange('alignX','ax',function(v){return v+' px';});
  function nudge(dx,dy){ S.ax=Math.max(-120,Math.min(120,S.ax+dx)); S.ay=Math.max(-60,Math.min(60,S.ay+dy)); document.getElementById('alignX').value=S.ax; document.getElementById('alignY').value=S.ay; document.getElementById('alignXVal').textContent=S.ax+' px'; document.getElementById('alignYVal').textContent=S.ay+' px'; render(); save(); }
  on('nx-', function(){ nudge(-1,0); }); on('nx+', function(){ nudge(1,0); }); on('ny-', function(){ nudge(0,-1); }); on('ny+', function(){ nudge(0,1); }); on('nreset', function(){ S.ax=0; S.ay=0; nudge(0,0); });
  function toggle(id,key,cls){ var b=document.getElementById(id); function paint(){ b.textContent=S[key]?'On':'Off'; b.setAttribute('aria-pressed', String(!!S[key])); if(cls) app.classList.toggle(cls, !!S[key]); } b.addEventListener('click', function(){ S[key]=!S[key]; paint(); save(); }); paint(); }
  toggle('tDots','dots','dots'); toggle('tKeep','keep',null);
  window.addEventListener('keydown', function(e){ if(e.target.tagName==='INPUT' && e.target.type==='number') return; if(e.target.tagName==='INPUT' && e.target.type==='range' && (e.key==='ArrowLeft'||e.key==='ArrowRight')) return; var k=e.key; if(k===' '||k==='Spacebar'){ setPlaying(!playing); e.preventDefault(); return; } if(e.shiftKey && (k==='ArrowLeft'||k==='ArrowRight'||k==='ArrowUp'||k==='ArrowDown')){ nudge(k==='ArrowLeft'?-1:k==='ArrowRight'?1:0, k==='ArrowUp'?-1:k==='ArrowDown'?1:0); e.preventDefault(); return; } switch(k){ case 'ArrowLeft': show(idx-stepN()); break; case 'ArrowRight': show(idx+stepN()); break; case 'p': case 'P': document.getElementById('pair').click(); break; case 'ArrowUp': zoomCentre(1.25); break; case 'ArrowDown': zoomCentre(1/1.25); break; case '+': case '=': zoomCentre(1.35); break; case '-': case '_': zoomCentre(1/1.35); break; case '0': fitView(); break; case '1': document.getElementById('one').click(); break; case 'x': case 'X': if(!S.mono) document.getElementById('swap').click(); break; case 'm': case 'M': document.getElementById('mono').click(); break; case 'f': case 'F': document.getElementById('full').click(); break; case 'h': case 'H': app.classList.toggle('hidechrome'); break; case 'd': case 'D': document.getElementById('tDots').click(); break; case 'Escape': closeOpenPanel(); setPanel.classList.add('hid'); setBtn.setAttribute('aria-pressed','false'); if(app.classList.contains('maxed')){ if(fsElement()) fsExit(); setMax(false); } else app.classList.remove('hidechrome'); break; default: return; } e.preventDefault(); });
  stage.addEventListener('dblclick', function(){ if(app.classList.contains('hidechrome')) app.classList.remove('hidechrome'); });
  var dragDepth=0;
  window.addEventListener('dragenter', function(e){ e.preventDefault(); dragDepth++; app.classList.add('drop'); });
  window.addEventListener('dragover', function(e){ e.preventDefault(); });
  window.addEventListener('dragleave', function(e){ e.preventDefault(); if(--dragDepth<=0){ dragDepth=0; app.classList.remove('drop'); } });
  window.addEventListener('drop', function(e){ e.preventDefault(); dragDepth=0; app.classList.remove('drop'); var dropped=e.dataTransfer.files; if(dropped && dropped.length && Array.prototype.every.call(dropped, isZip)){ openZips(dropped); return; } if(dropped) loadFiles(dropped); });
  stage.style.setProperty('--stagew', S.stagew+'%');
  document.getElementById('dots').style.setProperty('--stagew', S.stagew+'%');
  if(S.pair) S.mono = false;
  app.classList.toggle('mono', !!S.mono);
  (function(){ var b=document.getElementById('mono'); b.textContent=S.mono?'Single image':'Stereo pair'; b.setAttribute('aria-pressed', String(!!S.mono)); })();
  syncModes();
  applySwap();
  if(window.ResizeObserver){ new ResizeObserver(function(){ var ratio=fitS?view.s/fitS:1; measure(); view.s=Math.min(maxS(),Math.max(fitS,fitS*ratio)); render(); }).observe(stage); }
  window.addEventListener('resize', function(){ measure(); render(); });
  S.hold=clampHold(S.hold);
  document.getElementById('hold').value=S.hold;
  paintPlay();
  // eye tabs show on first display, then fade away after 10 seconds
  setTimeout(function(){ app.classList.add('tabs-off'); }, 10000);
  plates=[{ name:'Depth test card (sample)', url:sampleURL(), revoke:false }];
  show(0,'first');
})();
