/* Cast to a Chromecast (or other Presentation API display).
   The phone/tablet stays the controller; the TV shows only the pictures (receiver.html). */
(function(){
  "use strict";
  var btn = document.getElementById('cast');
  if(!btn) return;
  var supported = typeof PresentationRequest !== 'undefined' && !!window.tpsCast;
  if(!supported){
    /* keep the button visible but explain why it cannot work here */
    btn.classList.add('off'); btn.title = 'Casting is not available in this browser';
    btn.addEventListener('click', function(){
      var t = document.getElementById('toast'); if(!t) return;
      t.textContent = 'Casting needs Chrome on Android or a computer. This browser cannot cast pages.';
      t.classList.add('on'); clearTimeout(btn._t); btn._t = setTimeout(function(){ t.classList.remove('on'); }, 3500);
    });
    return;
  }

  var conn = null, req = null, sentSrc = [], token = 0, viewQueued = false, CHUNK = 32 * 1024;
  function toast(m){ var t = document.getElementById('toast'); if(!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function(){ t.classList.remove('on'); }, 2200); }
  function paint(){ var on = !!conn && conn.state === 'connected'; btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'Casting' : 'Cast'; }
  function live(){ return conn && conn.state === 'connected'; }
  function sendJSON(o){ try{ conn.send(JSON.stringify(o)); }catch(e){} }
  function pause(){ return new Promise(function(r){ setTimeout(r, 8); }); }

  function sendImage(slot, src, my){
    return fetch(src).then(function(r){ return r.blob(); }).then(function(b){
      return b.arrayBuffer().then(function(buf){
        if(my !== token || !live()) return false;
        sendJSON({ t:'img', slot:slot, mime:b.type || 'image/jpeg', size:buf.byteLength });
        var i = 0;
        function next(){
          if(my !== token || !live()) return false;
          if(i >= buf.byteLength) return true;
          conn.send(buf.slice(i, i + CHUNK)); i += CHUNK;
          return ((i / CHUNK) % 16 === 0) ? pause().then(next) : next();
        }
        return Promise.resolve(next());
      });
    });
  }
  function pushPlate(){
    if(!live()) return;
    var sn = window.tpsCast.snapshot(); if(!sn) return;
    var my = ++token, srcs = [sn.a.src];
    if(sn.mode !== 'mono' && sn.b.src !== sn.a.src && sn.b.visible) srcs.push(sn.b.src);
    var slotB = sn.b.src === sn.a.src ? 0 : (srcs.length > 1 ? 1 : 0);
    var meta = { t:'plate', mode:sn.mode, halfW:sn.halfW, natH:sn.natH, a:sn.a, b:sn.b, ax:sn.ax, ay:sn.ay, slotA:0, slotB:slotB, slots:srcs.length };
    var same = srcs.length === sentSrc.length && srcs.every(function(u, i){ return u === sentSrc[i]; });
    function done(){ if(my !== token) return; meta.reuse = same; sendJSON(meta); pushView(); }
    if(same){ done(); return; }
    var chain = Promise.resolve(true);
    srcs.forEach(function(u, i){ chain = chain.then(function(ok){ return ok ? sendImage(i, u, my) : false; }); });
    chain.then(function(ok){ if(ok){ sentSrc = srcs; done(); } }).catch(function(){ toast('Could not send the picture to the screen'); });
  }
  function pushView(){
    if(!live()) return;
    var sn = window.tpsCast.snapshot(); if(!sn) return;
    sendJSON({ t:'view', z:sn.z, cx:sn.cx, cy:sn.cy });
  }
  window.addEventListener('tps:plate', pushPlate);
  window.addEventListener('tps:view', function(){
    if(!live() || viewQueued) return; viewQueued = true;
    requestAnimationFrame(function(){ viewQueued = false; pushView(); });
  });

  function attach(c){
    conn = c; sentSrc = []; paint();
    c.onconnect = function(){ paint(); pushPlate(); };
    c.onmessage = function(e){ if(typeof e.data === 'string' && e.data.indexOf('"hello"') > -1){ sentSrc = []; pushPlate(); } };
    function gone(){ if(conn === c){ conn = null; token++; paint(); toast('Cast ended'); } }
    c.onclose = c.onterminate = gone;
    if(c.state === 'connected') { paint(); pushPlate(); }
  }
  function receiverURL(){ return new URL('receiver.html', location.href).href; }
  btn.addEventListener('click', function(){
    if(conn){ try{ conn.terminate(); }catch(e){} return; }
    if(!window.isSecureContext && location.hostname !== 'localhost'){ toast('Casting needs the page to be served over https'); return; }
    req = new PresentationRequest([receiverURL()]);
    req.start().then(attach).catch(function(err){
      if(err && err.name === 'NotFoundError') toast('No Cast devices found. Check Wi-Fi and that this is Chrome.');
      else if(err && err.name !== 'AbortError') toast('Could not start casting');
    });
  });
  document.addEventListener('keydown', function(e){
    if(e.ctrlKey || e.metaKey || e.altKey || (e.key !== 'c' && e.key !== 'C')) return;
    var t = e.target && e.target.tagName; if(t === 'INPUT' || t === 'TEXTAREA') return;
    var hb = document.getElementById('helpBox'); if(hb && !hb.classList.contains('hid')) return;
    btn.click(); e.preventDefault();
  });
  paint();
})();
