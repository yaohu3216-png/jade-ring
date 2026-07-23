'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const canvas = $('#c');
  const ctx = canvas.getContext('2d');
  const pages = [...document.querySelectorAll('.page')];
  const bgm = $('#bgm');
  const STORAGE = 'yuhuan_disassembly_v31';

  const state = {
    unlocked: 1,
    completed: {},
    chapter: 0,
    levelIndex: 0,
    level: null,
    rings: [],
    locks: [],
    selected: -1,
    mode: 'drag',
    pointer: null,
    moves: 0,
    startedAt: 0,
    elapsed: 0,
    timer: null,
    sound: true,
    hintRing: -1,
    dragging: false,
    dragStart: null,
    ringStart: null,
    audioCtx: null,
  };

  function loadSave() {
    try {
      const x = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      state.unlocked = Math.max(1, Number(x.unlocked || 1));
      state.completed = x.completed || {};
    } catch (_) {}
  }
  function save() {
    localStorage.setItem(STORAGE, JSON.stringify({unlocked: state.unlocked, completed: state.completed}));
  }
  function show(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    if (id === 'levels') renderLevelGrid();
    if (id === 'game') requestAnimationFrame(resize);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }

  function chapterForLevel(i) { return Math.floor(i / 11); }
  function localLevel(i) { return i % 11; }

  function renderTabs() {
    const tabs = $('#tabs'); tabs.innerHTML = '';
    YH.chapters.forEach((c, i) => {
      const b = document.createElement('button');
      b.textContent = c.name;
      b.className = i === state.chapter ? 'active' : '';
      b.onclick = () => { state.chapter = i; renderTabs(); renderLevelGrid(); };
      tabs.appendChild(b);
    });
  }
  function renderLevelGrid() {
    renderTabs();
    const grid = $('#grid'); grid.innerHTML = '';
    const start = state.chapter * 11;
    for (let j=0;j<11;j++) {
      const global = start+j;
      const lv = YH.levels[global];
      const card = document.createElement('button');
      const locked = global+1 > state.unlocked;
      const done = !!state.completed[global];
      card.className = 'card' + (locked?' locked':'') + (done?' done':'');
      card.innerHTML = `<b>${j+1}</b><small>${locked?'锁':'第 '+(global+1)+' 结'}</small>`;
      card.disabled = locked;
      card.onclick = () => startLevel(global);
      grid.appendChild(card);
    }
  }

  function buildLocks(rings, links) {
    return links.map((pair, idx) => {
      const a = rings[pair[0]], b = rings[pair[1]];
      return {a:pair[0], b:pair[1], x:(a.x+b.x)/2, y:(a.y+b.y)/2, released:false, pulse:0, idx};
    });
  }

  function startLevel(global) {
    clearInterval(state.timer);
    state.levelIndex = global;
    state.chapter = chapterForLevel(global);
    state.level = YH.levels[global];
    state.moves = 0; state.elapsed = 0; state.selected = -1; state.hintRing=-1;
    state.mode='drag'; $('#mode').textContent='拖环'; $('#mode').classList.remove('active');
    const ch = YH.chapters[state.chapter];
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(320, rect.width || 700), H = Math.max(480, rect.height || 760);
    state.rings = state.level.rings.map((r,i) => ({
      id:i, x:r[0]*W, y:r[1]*H, r:r[2]*Math.min(W,H), angle:r[3]*Math.PI/180,
      removed:false, scale:1, alpha:1, homeX:r[0]*W, homeY:r[1]*H,
      targetOrder: state.level.order.indexOf(i),
    }));
    state.locks = buildLocks(state.rings, state.level.links);
    $('#chapter').textContent = ch.name;
    $('#title').textContent = state.level.name;
    $('#verse').textContent = ch.verse;
    $('#no').textContent = `${global+1}/88`;
    $('#moves').textContent = '0'; $('#time').textContent='00:00';
    $('#done').classList.add('hidden');
    applyTheme(ch);
    show('game');
    state.startedAt = Date.now();
    state.timer = setInterval(() => { state.elapsed=Math.floor((Date.now()-state.startedAt)/1000); $('#time').textContent=formatTime(state.elapsed); }, 1000);
    setTimeout(resize, 50);
  }

  function applyTheme(ch) {
    document.documentElement.style.setProperty('--bg1', ch.bg[0]);
    document.documentElement.style.setProperty('--bg2', ch.bg[1]);
  }
  function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

  function activeOrder() {
    return state.rings.filter(r=>r.removed).length;
  }
  function nextRingId() {
    const ord = activeOrder();
    const r = state.rings.find(x=>x.targetOrder===ord);
    return r ? r.id : -1;
  }

  function ringGapPoint(r) {
    return {x:r.x+Math.cos(r.angle)*r.r, y:r.y+Math.sin(r.angle)*r.r};
  }
  function normalize(a) { while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; }
  function ringReady(r) {
    if (r.id !== nextRingId()) return false;
    const board = canvas.getBoundingClientRect();
    const center = {x:board.width/2,y:board.height/2};
    const escapeAngle = Math.atan2(r.y-center.y, r.x-center.x);
    return Math.abs(normalize(r.angle-escapeAngle)) < (state.level.tolerance||20)*Math.PI/180;
  }

  function hitRing(x,y) {
    let best=-1,bestD=1e9;
    state.rings.forEach((r,i)=>{
      if(r.removed)return;
      const d=Math.hypot(x-r.x,y-r.y);
      const ringDist=Math.abs(d-r.r);
      if(ringDist<28 && ringDist<bestD){best=i;bestD=ringDist;}
    });
    return best;
  }

  function pointerPos(e) {
    const rect=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:p.clientX-rect.left,y:p.clientY-rect.top};
  }

  function onDown(e) {
    e.preventDefault();
    ensureAudio();
    const p=pointerPos(e), i=hitRing(p.x,p.y);
    if(i<0)return;
    state.selected=i; state.pointer=p; state.dragStart=p; state.dragging=true;
    const r=state.rings[i]; state.ringStart={x:r.x,y:r.y,angle:r.angle};
    draw();
  }
  function onMove(e) {
    if(!state.dragging || state.selected<0)return;
    e.preventDefault();
    const p=pointerPos(e), r=state.rings[state.selected];
    if(state.mode==='rotate') {
      const a0=Math.atan2(state.dragStart.y-r.y,state.dragStart.x-r.x);
      const a1=Math.atan2(p.y-r.y,p.x-r.x);
      r.angle=state.ringStart.angle+(a1-a0);
    } else {
      const dx=p.x-state.dragStart.x,dy=p.y-state.dragStart.y;
      const ready=ringReady(r);
      if(ready) { r.x=state.ringStart.x+dx; r.y=state.ringStart.y+dy; }
      else { r.x=state.ringStart.x+dx*.12; r.y=state.ringStart.y+dy*.12; }
    }
    state.pointer=p; draw();
  }
  function onUp(e) {
    if(!state.dragging || state.selected<0)return;
    e.preventDefault();
    const r=state.rings[state.selected];
    state.dragging=false; state.moves++; $('#moves').textContent=state.moves;
    if(state.mode==='drag') {
      if(ringReady(r) && isOutside(r)) {
        removeRing(r);
      } else {
        const moved=Math.hypot(r.x-r.homeX,r.y-r.homeY);
        if(moved>8) {
          if(!ringReady(r)) { toast(r.id===nextRingId()?'先旋转开口，对准外侧通道':'此环尚被下层玉扣牵制'); dullClink(); }
          animateSnap(r);
        } else if (r.id===nextRingId()) {
          brightTick();
        }
      }
    } else {
      if(ringReady(r)) { toast('通道已显，可切换“拖环”向外抽离'); brightTick(); }
      else dullClink();
    }
    state.selected=-1; draw();
  }

  function isOutside(r) {
    const rect=canvas.getBoundingClientRect();
    return r.x+r.r<35 || r.x-r.r>rect.width-35 || r.y+r.r<35 || r.y-r.r>rect.height-35 || Math.hypot(r.x-r.homeX,r.y-r.homeY)>r.r*1.05;
  }
  function animateSnap(r) {
    const sx=r.x,sy=r.y,start=performance.now();
    function f(t){const q=Math.min(1,(t-start)/190),e=1-Math.pow(1-q,3);r.x=sx+(r.homeX-sx)*e;r.y=sy+(r.homeY-sy)*e;draw();if(q<1)requestAnimationFrame(f);}requestAnimationFrame(f);
  }
  function removeRing(r) {
    r.removed=true; r.alpha=0; state.locks.forEach(l=>{if(l.a===r.id||l.b===r.id){l.released=true;l.pulse=1;}});
    jadeChime();
    toast('玉环已抽离，下一重显现');
    if(state.rings.every(x=>x.removed)) finishLevel();
  }

  function finishLevel() {
    clearInterval(state.timer);
    state.completed[state.levelIndex]=true;
    state.unlocked=Math.max(state.unlocked,Math.min(88,state.levelIndex+2)); save();
    $('#result').textContent=`${state.moves} 次动作 · ${formatTime(state.elapsed)}`;
    $('#done').classList.remove('hidden'); jadeChime(true);
  }

  function resetLevel() { startLevel(state.levelIndex); }
  function hint() {
    const id=nextRingId(); state.hintRing=id;
    const r=state.rings[id];
    if(!r)return;
    if(!ringReady(r)) toast(`先转动高亮玉环，让开口朝向棋盘外侧`);
    else toast('开口已就位，切换“拖环”并向外抽离');
    setTimeout(()=>{state.hintRing=-1;draw();},1800); draw();
  }

  function ensureAudio() {
    if(!state.audioCtx) state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(state.audioCtx.state==='suspended')state.audioCtx.resume();
  }
  function tone(freq,start,dur,gain,type='sine') {
    if(!state.sound)return; ensureAudio(); const ac=state.audioCtx;
    const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime+start);
    g.gain.setValueAtTime(0.0001,ac.currentTime+start);g.gain.exponentialRampToValueAtTime(gain,ac.currentTime+start+.008);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+start+dur);
    o.connect(g).connect(ac.destination);o.start(ac.currentTime+start);o.stop(ac.currentTime+start+dur+.02);
  }
  function brightTick(){ tone(1550,0,.09,.035,'sine');tone(2320,.012,.12,.025,'triangle'); }
  function dullClink(){ tone(420,0,.07,.025,'triangle');tone(760,.018,.08,.012,'sine'); }
  function jadeChime(big=false){
    const notes=big?[1175,1568,2093,2637]:[1397,1865,2349];
    notes.forEach((n,i)=>{tone(n,i*.045,.34-i*.03,.045-i*.007,'sine');tone(n*2.01,i*.045+.008,.18,.012,'triangle');});
    tone(big?880:1047,.01,.5,.018,'sine');
  }

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawBackground(W,H,ch) {
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,ch.bg[0]);g.addColorStop(1,ch.bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=.16;ctx.fillStyle='#e9d393';ctx.beginPath();ctx.arc(W*.79,H*.15,Math.min(W,H)*.055,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.18;ctx.fillStyle='#061d1b';
    for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(0,H*(.34+k*.07));for(let x=0;x<=W;x+=20)ctx.lineTo(x,H*(.34+k*.07)-Math.sin(x/W*Math.PI*(2+k))*22-k*6);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();}
    ctx.globalAlpha=.1;ctx.strokeStyle='#d5c99d';ctx.lineWidth=1;for(let y=H*.58;y<H;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(W*.5,y-8,W,y);ctx.stroke();}
    ctx.globalAlpha=1;
  }

  function drawRing(r,ch,selected) {
    if(r.removed)return;
    const tube=Math.max(24,r.r*.145), gap=.48;
    ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle);
    if(selected||state.hintRing===r.id){ctx.shadowColor='#f6db79';ctx.shadowBlur=18;}
    ctx.lineCap='round';
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=tube+9;ctx.beginPath();ctx.arc(4,7,r.r,-Math.PI+gap/2,Math.PI-gap/2);ctx.stroke();
    const grad=ctx.createLinearGradient(-r.r,-r.r,r.r,r.r);grad.addColorStop(0,ch.jade[0]);grad.addColorStop(.28,ch.jade[1]);grad.addColorStop(.58,ch.jade[0]);grad.addColorStop(1,ch.jade[2]);
    ctx.strokeStyle=grad;ctx.lineWidth=tube;ctx.beginPath();ctx.arc(0,0,r.r,-Math.PI+gap/2,Math.PI-gap/2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=Math.max(4,tube*.18);ctx.beginPath();ctx.arc(-2,-3,r.r,-2.65,-.15);ctx.stroke();
    ctx.strokeStyle='rgba(20,80,60,.18)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r.r+(i-1)*tube*.18,-2.2+i*.9,-1.75+i*.9);ctx.stroke();}
    // jade end faces at the two C tips
    for(const a of [-Math.PI+gap/2,Math.PI-gap/2]){const x=Math.cos(a)*r.r,y=Math.sin(a)*r.r;ctx.fillStyle=ch.jade[0];ctx.beginPath();ctx.ellipse(x,y,tube*.43,tube*.32,a,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(35,75,58,.35)';ctx.lineWidth=2;ctx.stroke();}
    ctx.restore();
  }

  function drawLock(l,ch) {
    if(l.released)return;
    const a=state.rings[l.a],b=state.rings[l.b]; if(a.removed||b.removed)return;
    l.x=(a.x+b.x)/2;l.y=(a.y+b.y)/2;
    const angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;
    const w=Math.max(48,Math.min(a.r,b.r)*.34),h=Math.max(34,w*.68);
    ctx.save();ctx.translate(l.x,l.y);ctx.rotate(angle);ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=10;ctx.shadowOffsetY=5;
    const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#7e410b');g.addColorStop(.2,'#f7d57b');g.addColorStop(.5,'#c77b1f');g.addColorStop(.72,'#ffe39a');g.addColorStop(1,'#8b4b10');
    roundedRect(-w/2,-h/2,w,h,10);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#6e390d';ctx.lineWidth=2;ctx.stroke();
    roundedRect(-w*.39,-h*.34,w*.78,h*.68,8);ctx.strokeStyle='rgba(255,245,188,.65)';ctx.lineWidth=2;ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#7b4819';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-w*.27,0);ctx.bezierCurveTo(-w*.18,-h*.23,-w*.04,-h*.23,0,0);ctx.bezierCurveTo(w*.04,h*.23,w*.18,h*.23,w*.27,0);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,h*.14,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f6d47c';ctx.fill();
    ctx.restore();
  }

  function draw() {
    const rect=canvas.getBoundingClientRect(),W=rect.width,H=rect.height;if(!W||!H)return;
    const ch=YH.chapters[state.chapter]||YH.chapters[0];ctx.clearRect(0,0,W,H);drawBackground(W,H,ch);
    // subtle ordering lines for depth
    state.rings.forEach((r,i)=>drawRing(r,ch,state.selected===i));
    state.locks.forEach(l=>drawLock(l,ch));
    const id=nextRingId(),r=state.rings[id];if(r&&!r.removed){const gp=ringGapPoint(r);ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#f3d77e';ctx.beginPath();ctx.arc(gp.x,gp.y,5+Math.sin(performance.now()/180)*2,0,Math.PI*2);ctx.fill();ctx.restore();}
  }

  $('#enter').onclick=()=>show('levels'); $('#backHome').onclick=()=>show('home'); $('#backLevels').onclick=()=>{clearInterval(state.timer);show('levels');};
  $('#reset').onclick=resetLevel; $('#hint').onclick=hint;
  $('#mode').onclick=()=>{state.mode=state.mode==='drag'?'rotate':'drag';$('#mode').textContent=state.mode==='drag'?'拖环':'转环';$('#mode').classList.toggle('active',state.mode==='rotate');toast(state.mode==='drag'?'拖住玉环向外抽离':'沿玉环圆周拖动以旋转开口');};
  $('#sound').onclick=()=>{state.sound=!state.sound;$('#sound').textContent=state.sound?'音':'静';if(state.sound){ensureAudio();bgm.volume=.28;bgm.play().catch(()=>{});}else bgm.pause();};
  $('#next').onclick=()=>startLevel(Math.min(87,state.levelIndex+1)); $('#again').onclick=resetLevel;
  canvas.addEventListener('pointerdown',onDown,{passive:false});window.addEventListener('pointermove',onMove,{passive:false});window.addEventListener('pointerup',onUp,{passive:false});
  window.addEventListener('resize',resize);
  function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),1700);}

  loadSave(); show('home');
})();
