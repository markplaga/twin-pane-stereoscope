(function(){
  "use strict";
  var app = document.getElementById('app'), api = window.tpsApp, foot = document.querySelector('footer');
  var folderBtn = document.getElementById('openFolder');
  if(!app || !api || !foot || !folderBtn) return;
  var $ = function(id){ return document.getElementById(id); };

  var KEY = 'tps.prof.v2';
  var IMG_RE = /\.(jpe?g|png|webp|gif|bmp|avif|jfif)$/i;
  var AUD_RE = /\.(wav|wave|mp3|m4a|aac|ogg|oga|flac|opus|weba)$/i;
  var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  /* Browsers cannot read a file path. Chrome / Edge on a computer can keep a permission handle to a file or
     folder instead, which survives in IndexedDB. Everywhere else a profile keeps the names only. */
  var canFiles = !!(window.showOpenFilePicker && window.indexedDB);
  var canDir = !!(window.showDirectoryPicker && window.indexedDB);

  var cur = { pics:null, audio:null };        /* what is open right now */
  var pendingPics = null, pendingAudio = null;  /* handles that go with the next load */

  /* ── storage: profiles in localStorage, handles in IndexedDB ───────── */
  function readAll(){
    try{ var v = JSON.parse(localStorage.getItem(KEY) || '{}'); if(!v || !Array.isArray(v.list)) v = { list:[] }; return v; }
    catch(e){ return { list:[] }; }
  }
  function writeAll(v){ try{ localStorage.setItem(KEY, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function uid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2); }
  function idb(){
    return new Promise(function(res, rej){
      var r = indexedDB.open('tps-profiles', 1);
      r.onupgradeneeded = function(){ r.result.createObjectStore('h'); };
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    });
  }
  function tx(mode, fn){
    return idb().then(function(db){
      return new Promise(function(res, rej){
        var t = db.transaction('h', mode), out = fn(t.objectStore('h'));
        t.oncomplete = function(){ db.close(); res(out && out.result); };
        t.onerror = t.onabort = function(){ db.close(); rej(t.error); };
      });
    });
  }
  function hput(id, v){ return tx('readwrite', function(s){ return s.put(v, id); }); }
  function hget(id){ return tx('readonly', function(s){ return s.get(id); }); }
  function hdel(id){ return tx('readwrite', function(s){ return s.delete(id); }); }

  /* ── small helpers ─────────────────────────────────────────────────── */
  function say(msg, ms){
    var t = $('toast'); if(!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(say.t); say.t = setTimeout(function(){ t.classList.remove('on'); }, ms || 2200);
  }
  function modeLabel(s){ return s.pair ? 'Side by side' : s.mono ? 'Single image (2D)' : s.swap ? 'Stereo, cross-eyed' : 'Stereo, parallel'; }
  function modeShort(s){ return s.pair ? 'side by side' : s.mono ? '2D' : s.swap ? 'cross-eyed' : 'parallel'; }
  function kindWord(k){ return k === 'zip' ? 'Zip' : k === 'folder' ? 'Folder' : 'Pictures'; }

  /* ── controls ──────────────────────────────────────────────────────── */
  var st = document.createElement('style');
  st.textContent =
    '#grpProf select{ background:var(--panel-hi); color:var(--text); border:1px solid var(--line); border-radius:2px; min-height:32px; font:13px var(--f-ui); max-width:150px; padding:0 6px; cursor:pointer; }' +
    '#panelProf{ position:absolute; right:10px; bottom:calc(var(--rail) + 12px); width:min(330px, calc(100vw - 20px)); z-index:43; background:var(--panel); border:1px solid var(--line-hi); border-radius:4px; box-shadow:0 18px 44px rgba(0,0,0,.66); padding:14px; display:grid; gap:10px; }' +
    '#panelProf h2{ margin:0; font-family:var(--f-disp); font-size:13px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ochre); }' +
    '#panelProf ul{ margin:0; padding:0; list-style:none; display:grid; gap:4px; font-size:12px; color:var(--text); }' +
    '#panelProf li small{ display:block; color:var(--mute); font-size:11px; }' +
    '#panelProf input[type=text]{ background:#0e1013; color:var(--text); border:1px solid var(--line); border-radius:2px; padding:8px; font:13px var(--f-ui); min-width:0; }' +
    '#panelProf .btns{ display:flex; gap:6px; flex-wrap:wrap; }' +
    '#panelProf .btns button{ flex:1 1 auto; justify-content:center; }' +
    '#panelProf .go{ background:var(--ochre); color:#14100a; font-weight:600; }' +
    '#panelProf .warn{ background:#3a1d18; }';
  document.head.appendChild(st);

  var grp = document.createElement('div');
  grp.className = 'grp'; grp.id = 'grpProf';
  grp.innerHTML =
    '<select id="profSel" aria-label="Saved profiles" title="Load a saved profile"><option value="">Profiles…</option></select>' +
    '<button id="profOpen" aria-expanded="false" title="Save the current setup as a profile">Save…</button>';
  var ref = $('grpSnd') || folderBtn.parentNode;
  ref.parentNode.insertBefore(grp, ref);

  var pan = document.createElement('div');
  pan.id = 'panelProf'; pan.className = 'hid';
  pan.innerHTML =
    '<h2>Profiles</h2>' +
    '<ul id="profInfo"></ul>' +
    '<input type="text" id="profName" maxlength="60" placeholder="Profile name" aria-label="Profile name" autocomplete="off">' +
    '<div class="btns"><button id="profSave" class="go">Save profile</button><button id="profDel" class="hid">Delete</button></div>' +
    '<p class="note" id="profNote"></p>';
  foot.appendChild(pan);

  var sel = $('profSel'), btn = $('profOpen'), info = $('profInfo'), nameIn = $('profName'), bSave = $('profSave'), bDel = $('profDel'), note = $('profNote');
  note.textContent = (canFiles
    ? 'Files and folders you open with the buttons or by dropping them are remembered, so loading the profile reopens them. The browser may ask you to allow access again.'
    : 'This browser cannot remember where files are. A profile keeps the settings and the file names; choose the files again after loading it.');

  function fillSel(selectId){
    var all = readAll();
    sel.textContent = '';
    var o = document.createElement('option'); o.value = ''; o.textContent = 'Profiles…'; sel.appendChild(o);
    all.list.slice().sort(function(a, b){ return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; }).forEach(function(p){
      var op = document.createElement('option');
      op.value = p.id; op.textContent = p.name + ' · ' + modeShort(p.settings || {});
      sel.appendChild(op);
    });
    sel.value = selectId || '';
    if(sel.value !== (selectId || '')) sel.value = '';
  }
  function selected(){ var id = sel.value; if(!id) return null; var l = readAll().list.filter(function(p){ return p.id === id; }); return l[0] || null; }

  function li(text, sub){
    var el = document.createElement('li'); el.textContent = text;
    if(sub){ var s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
    return el;
  }
  function refreshInfo(){
    if(pan.classList.contains('hid')) return;
    info.textContent = '';
    info.appendChild(li('Viewing: ' + modeLabel(api.settings())));
    if(cur.pics) info.appendChild(li(kindWord(cur.pics.kind) + ': ' + cur.pics.label, cur.pics.handles ? 'location remembered' : 'name only'));
    else info.appendChild(li('Pictures: none opened', 'the test card is showing'));
    if(cur.audio) info.appendChild(li('♪ ' + cur.audio.name, cur.audio.handle ? 'location remembered' : 'name only'));
    var n = nameIn.value.trim().toLowerCase(), exists = readAll().list.some(function(p){ return p.name.toLowerCase() === n; });
    bSave.textContent = exists ? 'Update profile' : 'Save profile';
    var s = selected(); bDel.classList.toggle('hid', !s);
    if(s){ bDel.textContent = 'Delete “' + s.name + '”'; bDel.classList.remove('warn'); }
  }
  function openPan(){
    ['panelSet', 'panelOpen'].forEach(function(id){ var e = $(id); if(e) e.classList.add('hid'); });
    var sb = $('settings'); if(sb) sb.setAttribute('aria-pressed', 'false');
    pan.style.bottom = (foot.offsetHeight + 8) + 'px';
    pan.classList.remove('hid'); btn.setAttribute('aria-expanded', 'true');
    var s = selected(); nameIn.value = s ? s.name : '';
    refreshInfo();
    if(!coarse) nameIn.focus();
  }
  function closePan(){ pan.classList.add('hid'); btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', function(){ if(pan.classList.contains('hid')) openPan(); else closePan(); });
  nameIn.addEventListener('input', refreshInfo);
  nameIn.addEventListener('keydown', function(e){
    e.stopPropagation();
    if(e.key === 'Enter'){ e.preventDefault(); doSave(); }
    else if(e.key === 'Escape'){ closePan(); }
  });
  sel.addEventListener('keydown', function(e){ e.stopPropagation(); });
  document.addEventListener('pointerdown', function(e){
    if(pan.classList.contains('hid')) return;
    if(pan.contains(e.target) || btn.contains(e.target)) return;
    closePan();
  }, true);

  /* ── save ──────────────────────────────────────────────────────────── */
  function doSave(){
    var name = nameIn.value.trim();
    if(!name){ say('Give the profile a name'); nameIn.focus(); return; }
    var all = readAll();
    var p = all.list.filter(function(x){ return x.name.toLowerCase() === name.toLowerCase(); })[0];
    var isNew = !p;
    if(isNew){ p = { id:uid() }; all.list.push(p); }
    p.name = name; p.savedAt = Date.now();
    p.settings = api.settings();
    p.sound = window.tpsAudio ? window.tpsAudio.prefs() : null;
    p.pics = cur.pics ? { kind:cur.pics.kind, label:cur.pics.label, count:cur.pics.count, names:cur.pics.names.slice(0, 30), remembered:!!cur.pics.handles } : null;
    p.audio = cur.audio ? { name:cur.audio.name, remembered:!!cur.audio.handle } : null;
    var rec = {
      pics: (cur.pics && cur.pics.handles) ? { kind:cur.pics.kind, handles:cur.pics.handles } : null,
      audio: (cur.audio && cur.audio.handle) || null
    };
    var stored = (rec.pics || rec.audio) ? hput(p.id, rec).then(function(){ return true; }, function(){ return false; }) : hdel(p.id).then(function(){ return true; }, function(){ return true; });
    stored.then(function(ok){
      if(!ok){ if(p.pics) p.pics.remembered = false; if(p.audio) p.audio.remembered = false; }
      if(!writeAll(all)){ say('Could not save: browser storage is unavailable', 3500); return; }
      fillSel(p.id); closePan();
      say('Profile “' + name + '” ' + (isNew ? 'saved' : 'updated') + (ok || !(rec.pics || rec.audio) ? '' : ' (file locations could not be kept)'), 3000);
    });
  }
  bSave.addEventListener('click', doSave);

  /* ── delete (two taps) ─────────────────────────────────────────────── */
  var delTimer = 0;
  bDel.addEventListener('click', function(){
    var s = selected(); if(!s) return;
    if(!bDel.classList.contains('warn')){
      bDel.classList.add('warn'); bDel.textContent = 'Tap again to delete';
      clearTimeout(delTimer); delTimer = setTimeout(refreshInfo, 3000); return;
    }
    clearTimeout(delTimer);
    var all = readAll(); all.list = all.list.filter(function(p){ return p.id !== s.id; });
    writeAll(all); hdel(s.id).catch(function(){});
    fillSel(''); nameIn.value = ''; refreshInfo();
    say('Profile “' + s.name + '” deleted');
  });

  /* ── load ──────────────────────────────────────────────────────────── */
  function ensure(handles){
    return handles.reduce(function(chain, h){
      return chain.then(function(){
        if(!h.queryPermission) return;
        return h.queryPermission({ mode:'read' }).then(function(s){ return s === 'granted' ? s : h.requestPermission({ mode:'read' }); })
          .then(function(s){ if(s !== 'granted') throw new Error('denied'); });
      });
    }, Promise.resolve());
  }
  async function walk(dir, prefix, out){
    for await (var ent of dir.entries()){
      var nm = ent[0], h = ent[1];
      if(h.kind === 'directory') await walk(h, prefix + nm + '/', out);
      else if(IMG_RE.test(nm)){
        var f = await h.getFile();
        try{ Object.defineProperty(f, 'webkitRelativePath', { value:prefix + nm }); }catch(e){}
        out.push(f);
      }
    }
    return out;
  }
  function openPics(kind, handles){
    var work = (kind === 'folder') ? walk(handles[0], handles[0].name + '/', []) : Promise.all(handles.map(function(h){ return h.getFile(); }));
    return work.then(function(files){
      if(!files.length) throw new Error('empty');
      pendingPics = { handles:handles };
      try{ api.open(files); } finally { pendingPics = null; }
    });
  }

  function loadProfile(id){
    var p = readAll().list.filter(function(x){ return x.id === id; })[0];
    if(!p) return;
    api.apply(p.settings);
    if(p.sound && window.tpsAudio) window.tpsAudio.setPrefs(p.sound);
    var again = [];
    var rec = (p.pics || p.audio) ? hget(p.id).catch(function(){ return null; }) : Promise.resolve(null);
    rec.then(function(r){
      r = r || {};
      var jobs = [];
      if(p.pics){
        if(r.pics && r.pics.handles && r.pics.handles.length){
          jobs.push(ensure(r.pics.handles).then(function(){ return openPics(r.pics.kind, r.pics.handles); })
            .catch(function(){ again.push(p.pics.label); }));
        } else again.push(p.pics.label);
      }
      if(p.audio && window.tpsAudio){
        if(r.audio){
          jobs.push(ensure([r.audio]).then(function(){ return r.audio.getFile(); }).then(function(f){
            pendingAudio = r.audio;
            try{ window.tpsAudio.load(f); } finally { pendingAudio = null; }
          }).catch(function(){ again.push(p.audio.name); }));
        } else again.push(p.audio.name);
      }
      return Promise.all(jobs);
    }).then(function(){
      if(again.length) say('Profile “' + p.name + '” loaded. Choose these again: ' + again.join(', '), 5000);
      else say('Profile “' + p.name + '” loaded');
    });
  }
  sel.addEventListener('change', function(){
    var id = sel.value;
    if(!pan.classList.contains('hid')){ var s = selected(); nameIn.value = s ? s.name : ''; refreshInfo(); }
    if(id) loadProfile(id);
    sel.blur();
  });

  /* ── track what is open ────────────────────────────────────────────── */
  window.addEventListener('tps:source', function(e){
    var d = e.detail || {};
    cur.pics = { kind:d.kind, label:d.label, count:d.count, names:d.names || [], handles: pendingPics ? pendingPics.handles : null };
    pendingPics = null; refreshInfo();
  });
  window.addEventListener('tps:audio', function(e){
    var f = e.detail && e.detail.file;
    cur.audio = f ? { name:f.name, handle:pendingAudio } : null;
    pendingAudio = null; refreshInfo();
  });
  ['tps:plate'].forEach(function(t){ window.addEventListener(t, refreshInfo); });

  /* Files dropped on the page: pick up their handles once the browser hands them over. */
  window.addEventListener('drop', function(e){
    var dt = e.dataTransfer; if(!dt || !dt.items) return;
    var its = Array.prototype.slice.call(dt.items).filter(function(i){ return i.kind === 'file' && i.getAsFileSystemHandle; });
    if(!its.length) return;
    Promise.all(its.map(function(i){ try{ return i.getAsFileSystemHandle().catch(function(){ return null; }); }catch(err){ return Promise.resolve(null); } })).then(function(hs){
      hs = hs.filter(function(h){ return h && h.kind === 'file'; });
      if(!hs.length) return;
      var byName = {}; hs.forEach(function(h){ byName[h.name] = h; });
      if(cur.audio && !cur.audio.handle && byName[cur.audio.name]) cur.audio.handle = byName[cur.audio.name];
      if(cur.pics && !cur.pics.handles && cur.pics.kind !== 'folder'){
        var list = cur.pics.names.map(function(n){ return byName[n]; });
        if(list.length && list.every(Boolean)) cur.pics.handles = list;
      }
      refreshInfo();
    });
  }, true);

  /* ── use real file pickers where the browser has them, so a handle comes back ─ */
  var bypass = false;
  function over(id, fn){
    var b = $(id); if(!b) return;
    b.addEventListener('click', function(e){
      if(bypass) return;
      e.stopImmediatePropagation(); e.preventDefault();
      var p; try{ p = fn(); }catch(err){ p = Promise.reject(err); }
      p.catch(function(err){
        if(err && err.name === 'AbortError') return;
        bypass = true; try{ b.click(); } finally { bypass = false; }
      });
    }, true);
  }
  var PIC_TYPE = { description:'Pictures', accept:{ 'image/*':['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif', '.jfif'] } };
  var ZIP_TYPE = { description:'Zip files', accept:{ 'application/zip':['.zip'] } };
  function pickFiles(withZip){
    return window.showOpenFilePicker({ id:'tps-pics', multiple:true, types: withZip ? [PIC_TYPE, ZIP_TYPE] : [PIC_TYPE] }).then(function(hs){
      return Promise.all(hs.map(function(h){ return h.getFile(); })).then(function(files){
        pendingPics = { handles:hs };
        try{ api.open(files); } finally { pendingPics = null; }
      });
    });
  }
  function pickDir(){
    return window.showDirectoryPicker({ id:'tps-dir', mode:'read' }).then(function(dh){
      say('Reading ' + dh.name + '…');
      return openPics('folder', [dh]);
    });
  }
  if(canFiles){
    over('openFiles', function(){ return pickFiles(false); });
    over('openZip', function(){ return pickFiles(true); });
    over('openAny', function(){ return pickFiles(true); });
    if(window.tpsAudio) over('sndOpen', function(){
      return window.showOpenFilePicker({ id:'tps-snd', types:[{ description:'Audio', accept:{ 'audio/*':['.wav', '.wave', '.mp3', '.m4a', '.aac', '.ogg', '.oga', '.flac', '.opus', '.weba'] } }] }).then(function(hs){
        return hs[0].getFile().then(function(f){
          pendingAudio = hs[0];
          try{ window.tpsAudio.load(f); } finally { pendingAudio = null; }
        });
      });
    });
  }
  if(canDir){
    over('openDir', pickDir);
    if(!coarse) over('openFolder', pickDir);
  }

  /* ── manual section ────────────────────────────────────────────────── */
  var hb = $('helpBox');
  if(hb){
    var keysH = $('h-keys');
    if(keysH){
      var sec = document.createElement('div');
      sec.innerHTML =
        '<h2 id="h-profiles">Profiles</h2>' +
        '<p>A profile is a saved setup: how you are viewing (cross-eyed, parallel, side by side, or a single 2D image), the alignment and zoom options, the pictures you had open (a zip, several zips, a folder, or loose files) and the soundtrack.</p>' +
        '<ul>' +
        '<li><b>Save…</b> in the bar opens the save panel. Type a name and press <b>Save profile</b>. Using a name that already exists updates that profile.</li>' +
        '<li>The <b>Profiles…</b> drop-down lists every saved profile. Choosing one loads it straight away. To remove one, choose it, open <b>Save…</b> and press Delete.</li>' +
        '<li>A web page cannot read a file path, so what is remembered depends on the browser. In Chrome or Edge on a computer, files and folders you open with the buttons, or drop on the page, are remembered and reopened when you load the profile; the browser may ask you to allow access once. In other browsers (Safari, Firefox, phones and tablets) the profile keeps the settings and the file names, and the toast tells you which files to choose again.</li>' +
        '<li>Loading a profile replaces the pictures and the soundtrack it saved. If it saved no soundtrack, whatever is playing is left alone.</li>' +
        '<li>Profiles live in this browser on this device. They are not uploaded anywhere.</li>' +
        '</ul>';
      while(sec.firstChild) keysH.parentNode.insertBefore(sec.firstChild, keysH);
    }
    var toc = hb.querySelector('.toc');
    if(toc){
      var tb = document.createElement('button'); tb.setAttribute('data-go', 'h-profiles'); tb.textContent = 'Profiles';
      tb.addEventListener('click', function(){ var t = $('h-profiles'); if(t) t.scrollIntoView({ behavior:'smooth', block:'start' }); });
      var after = toc.querySelector('[data-go="h-sound"]') || toc.querySelector('[data-go="h-show"]');
      if(after && after.nextSibling) toc.insertBefore(tb, after.nextSibling); else toc.appendChild(tb);
    }
  }

  fillSel('');
})();
