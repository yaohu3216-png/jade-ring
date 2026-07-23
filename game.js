(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const $=(s,p=document)=>p.querySelector(s);
  const $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const {THEMES,buildLevel}=window.YH_DATA;
  const TAU=Math.PI*2;
  const state={
    chapter:0,level:0,levelData:null,rings:new Map(),clasps:new Map(),drag:null,
    moves:0,startTime:0,timerId:0,sound:true,
    completed:new Set(JSON.parse(localStorage.getItem('yh-completed-v2')||'[]'))
  };
  const screen={chapters:$('#chapterScreen'),levels:$('#levelScreen'),game:$('#gameScreen')};
  const svg=$('#boardSvg');
  const toast=$('#toast');
  const audio={bgm:$('#bgm'),touch:$('#touchSound'),release:$('#releaseSound'),complete:$('#completeSound')};

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=a=>{while(a>Math.PI)a-=TAU;while(a<=-Math.PI)a+=TAU;return a};
  const angle=(x,y,cx,cy)=>Math.atan2(y-cy,x-cx);
  const deg=r=>r*180/Math.PI;
  function svgEl(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n}
  function setScreen(name){Object.values(screen).forEach(s=>s.classList.remove('active'));screen[name].classList.add('active')}
  function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1150)}
  function play(name,vol=1){if(!state.sound)return;const a=audio[name];if(!a)return;try{a.currentTime=0;a.volume=vol;a.play().catch(()=>{})}catch{}}
  function save(){localStorage.setItem('yh-completed-v2',JSON.stringify([...state.completed]))}
  function levelKey(c,l){return c*11+l}
  function unlocked(c,l){return l===0 || state.completed.has(levelKey(c,l-1)) || state.completed.has(levelKey(c,l))}

  function crystalPreview(theme,size=110){
    const wrap=document.createElement('div');wrap.className='crystal-preview';wrap.style.width=size+'px';wrap.style.height=size+'px';
    wrap.style.setProperty('--c0',theme.colors[0]);wrap.style.setProperty('--c1',theme.colors[1]);wrap.style.setProperty('--c2',theme.colors[2]);wrap.style.setProperty('--c3',theme.colors[3]);
    wrap.innerHTML='<i></i><i></i><i></i>';
    return wrap;
  }

  function buildChapters(){
    const grid=$('#chapterGrid');grid.innerHTML='';
    THEMES.forEach((theme,i)=>{
      const done=[...state.completed].filter(k=>Math.floor(k/11)===i).length;
      const card=document.createElement('button');card.type='button';card.className='chapter-card';
      card.innerHTML=`<span class="chapter-progress">${done}/11</span><small>${theme.no}</small><h3>${theme.title}</h3><div class="chapter-preview"></div><div class="chapter-meta">11关</div><span class="free-badge">第1关免费试玩</span>`;
      card.querySelector('.chapter-preview').appendChild(crystalPreview(theme,105));
      card.addEventListener('click',()=>openLevels(i));grid.appendChild(card);
    });
    $('#totalProgress').textContent=`${state.completed.size} / 88`;
  }

  function openLevels(chapter){
    state.chapter=chapter;const t=THEMES[chapter];
    $('#levelChapterNo').textContent=t.no;$('#levelChapterTitle').textContent=t.title;$('#chapterNote').textContent=t.note;
    $('#levelScene').style.backgroundImage=`url('${t.bg}')`;
    const gem=$('#levelGem');gem.innerHTML='';gem.appendChild(crystalPreview(t,48));
    const grid=$('#levelGrid');grid.innerHTML='';
    for(let i=0;i<11;i++){
      const data=buildLevel(chapter,i);const isUnlocked=unlocked(chapter,i);const done=state.completed.has(levelKey(chapter,i));
      const b=document.createElement('button');b.type='button';b.className=`level-tile ${isUnlocked?'':'locked'} ${done?'done':''}`;
      b.innerHTML=`<span>${done?'✓':isUnlocked?String(i+1).padStart(2,'0'):'锁'}</span><b>${data.name}</b><small>${i===0?'免费试玩':done?'已通关':isUnlocked?'可挑战':'未解锁'}</small>`;
      if(isUnlocked)b.addEventListener('click',()=>openGame(chapter,i));grid.appendChild(b);
    }
    setScreen('levels');
  }

  function openGame(chapter,level){
    state.chapter=chapter;state.level=level;const t=THEMES[chapter];
    $('#gameScene').style.backgroundImage=`url('${t.bg}')`;
    $('#gameChapterLabel').textContent=`${t.no} · ${t.title}`;
    state.levelData=buildLevel(chapter,level);$('#gameLevelTitle').textContent=state.levelData.name;
    $('#completeModal').classList.remove('show');$('#completeModal').setAttribute('aria-hidden','true');
    setScreen('game');initBoard();startTimer();
    audio.bgm.volume=.18;audio.bgm.play().catch(()=>{});
  }

  function startTimer(){clearInterval(state.timerId);state.startTime=Date.now();$('#timerText').textContent='00:00';state.timerId=setInterval(()=>{const s=Math.floor((Date.now()-state.startTime)/1000);$('#timerText').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},1000)}

  function buildDefs(theme){
    const defs=svgEl('defs');
    defs.innerHTML=`
      <linearGradient id="plateFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.plate[0]}"/><stop offset=".55" stop-color="#fffdf3"/><stop offset="1" stop-color="${theme.plate[1]}"/></linearGradient>
      <radialGradient id="plateGlow"><stop offset="0" stop-color="#fff" stop-opacity=".97"/><stop offset=".72" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#c9ab86" stop-opacity=".12"/></radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4b7"/><stop offset=".16" stop-color="#c98628"/><stop offset=".38" stop-color="#fff1a6"/><stop offset=".62" stop-color="#d8942f"/><stop offset=".82" stop-color="#8d5019"/><stop offset="1" stop-color="#f5c962"/></linearGradient>
      <linearGradient id="goldDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#754317"/><stop offset=".5" stop-color="#c88a31"/><stop offset="1" stop-color="#6f3c14"/></linearGradient>
      <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">${theme.colors.map((c,i)=>`<stop offset="${i/(theme.colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>
      <filter id="plateShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#2d1420" flood-opacity=".48"/></filter>
      <filter id="ringShadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#351b2c" flood-opacity=".42"/></filter>
      <filter id="goldShadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#3f240e" flood-opacity=".55"/></filter>
      <filter id="crystalTexture" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency=".022 .085" numOctaves="3" seed="${state.chapter*17+state.level*7+4}" result="noise"/>
        <feColorMatrix in="noise" values="1 0 0 0 .1  0 1 0 0 .1  0 0 1 0 .1  0 0 0 .33 0" result="softNoise"/>
        <feBlend in="SourceGraphic" in2="softNoise" mode="screen"/>
      </filter>
      <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    `;
    svg.appendChild(defs);
  }

  function drawPlate(){
    const g=svgEl('g',{class:'plate-art'});
    const outer=svgEl('path',{d:'M450 36 C620 36 790 110 835 255 C888 425 870 770 760 930 C670 1060 230 1060 140 930 C30 770 12 425 65 255 C110 110 280 36 450 36 Z',fill:'url(#plateFill)',stroke:'#d4b16f','stroke-width':9,filter:'url(#plateShadow)'});
    const inner=svgEl('path',{d:'M450 65 C606 65 756 128 802 268 C848 420 830 747 730 900 C646 1016 254 1016 170 900 C70 747 52 420 98 268 C144 128 294 65 450 65 Z',fill:'url(#plateGlow)',stroke:'#fffbe7','stroke-opacity':.82,'stroke-width':5});
    const ornament=svgEl('g',{opacity:.18,stroke:'#a57d4d',fill:'none','stroke-width':3});
    for(let i=0;i<8;i++){const a=i*TAU/8;const x=450+330*Math.cos(a),y=525+430*Math.sin(a);ornament.appendChild(svgEl('path',{d:`M${x-20} ${y} q20 -26 40 0 q-20 26 -40 0`}))}
    g.append(outer,inner,ornament);svg.appendChild(g);
  }

  function arcPath(r){
    const half=r.gapSize/2;const start=half,end=TAU-half;const x1=r.x+r.r*Math.cos(start),y1=r.y+r.r*Math.sin(start);const x2=r.x+r.r*Math.cos(end),y2=r.y+r.r*Math.sin(end);
    return `M ${x1} ${y1} A ${r.r} ${r.r} 0 1 1 ${x2} ${y2}`;
  }

  function drawRing(r,theme){
    const g=svgEl('g',{class:'ring-group','data-ring':r.id});g.style.transformOrigin=`${r.x}px ${r.y}px`;g.style.transform=`rotate(${deg(r.rotation)}deg)`;
    const path=arcPath(r);
    const shadow=svgEl('path',{d:path,fill:'none',stroke:'#5b354e','stroke-opacity':.22,'stroke-width':43,'stroke-linecap':'round',filter:'url(#ringShadow)'});
    const body=svgEl('path',{d:path,fill:'none',stroke:'url(#crystal)','stroke-width':37,'stroke-linecap':'round',filter:'url(#crystalTexture)'});
    const depth=svgEl('path',{d:path,fill:'none',stroke:theme.colors[3],'stroke-opacity':.28,'stroke-width':27,'stroke-linecap':'round','stroke-dasharray':'52 29 18 44'});
    const cloud=svgEl('path',{d:path,fill:'none',stroke:'#fff','stroke-opacity':.24,'stroke-width':17,'stroke-linecap':'round','stroke-dasharray':'18 48 9 32'});
    const shine=svgEl('path',{d:path,fill:'none',stroke:'#fff','stroke-opacity':.72,'stroke-width':6,'stroke-linecap':'round','stroke-dasharray':'96 30 20 60','stroke-dashoffset':String(-(r.seed%120))});
    const edge=svgEl('path',{d:path,fill:'none',stroke:'#fff','stroke-opacity':.38,'stroke-width':2.5,'stroke-linecap':'round'});
    const hit=svgEl('path',{d:path,fill:'none',stroke:'transparent','stroke-width':72,'stroke-linecap':'round','pointer-events':'stroke'});
    g.append(shadow,body,depth,cloud,shine,edge,hit);
    // small suspended inclusions
    for(let i=0;i<10;i++){
      const a=.42+i*(TAU-r.gapSize-.84)/9;const rr=r.r+(i%2?4:-5);const dot=svgEl('circle',{cx:r.x+rr*Math.cos(a),cy:r.y+rr*Math.sin(a),r:i%3===0?3.1:1.9,fill:i%2?'#fff':theme.vein,opacity:i%2?.7:.42});g.appendChild(dot);
    }
    svg.appendChild(g);r.el=g;
  }

  function claspAngleFor(c,ring){return angle(c.x,c.y,ring.x,ring.y)}
  function claspTransform(c){return `translate(${c.x} ${c.y}) rotate(${c.angle})`}
  function drawClaspBack(c){
    const g=svgEl('g',{class:'clasp-back','data-clasp':c.id,transform:claspTransform(c)});
    g.append(svgEl('rect',{x:-31,y:-21,width:62,height:42,rx:13,fill:'url(#goldDark)',stroke:'#6b3a12','stroke-width':2,filter:'url(#goldShadow)'}));svg.appendChild(g);c.backEl=g;
  }
  function drawClaspFront(c,theme){
    const g=svgEl('g',{class:'clasp-front','data-clasp':c.id,transform:claspTransform(c)});
    const body=svgEl('rect',{x:-32,y:-18,width:64,height:36,rx:12,fill:'url(#gold)',stroke:'#fff0a8','stroke-width':2.5,filter:'url(#goldShadow)'});
    const ridge=svgEl('path',{d:'M-22 -11 Q0 -18 22 -11 M-22 11 Q0 18 22 11',fill:'none',stroke:'#7f4a18','stroke-opacity':.42,'stroke-width':2});
    g.append(body,ridge);
    const gems=clamp(c.gems||1,1,3);for(let i=0;i<gems;i++){const x=(i-(gems-1)/2)*16;g.append(svgEl('circle',{cx:x,cy:0,r:6.3,fill:theme.gem,stroke:'#fff9dd','stroke-width':2}),svgEl('circle',{cx:x-1.7,cy:-1.8,r:1.8,fill:'#fff'}))}
    svg.appendChild(g);c.frontEl=g;
  }

  function initBoard(){
    const theme=THEMES[state.chapter];svg.innerHTML='';buildDefs(theme);drawPlate();state.rings.clear();state.clasps.clear();state.moves=0;$('#movesText').textContent='0';
    state.levelData.rings.forEach(r=>state.rings.set(r.id,{...r,removed:false,touched:false,el:null}));
    state.levelData.clasps.forEach(c=>state.clasps.set(c.id,{...c,released:false,backEl:null,frontEl:null}));
    [...state.clasps.values()].forEach(drawClaspBack);
    [...state.rings.values()].sort((a,b)=>a.z-b.z).forEach(r=>drawRing(r,theme));
    [...state.clasps.values()].forEach(c=>drawClaspFront(c,theme));
    bindBoard();refreshEligibility();
  }

  function incident(rid){return [...state.clasps.values()].filter(c=>!c.released&&(c.host===rid||c.guest===rid))}
  function exposed(c){return c.blockers.every(id=>state.rings.get(id)?.removed)}
  function endpointRings(c){return [c.host,c.guest].filter(id=>id!=='board'&&state.rings.has(id)&&!state.rings.get(id).removed)}
  function eligibleForRing(c,rid){return !c.released&&exposed(c)&&endpointRings(c).includes(rid)}

  function refreshEligibility(){
    for(const c of state.clasps.values()){
      if(c.released)continue;const active=exposed(c);c.frontEl.classList.toggle('eligible',active);c.frontEl.classList.toggle('blocked',!active);c.frontEl.style.opacity=active?'1':'.72';c.backEl.style.opacity=active?'1':'.72';
    }
    for(const r of state.rings.values()){
      if(r.removed)continue;const has=incident(r.id).some(c=>eligibleForRing(c,r.id));r.el.style.opacity=incident(r.id).length&&!has?'.82':'1';
    }
  }

  function svgPoint(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=svg.getScreenCTM();return m?p.matrixTransform(m.inverse()):{x:0,y:0}}
  function beginDrag(e){
    const target=e.target.closest?.('[data-ring]');if(!target)return;const r=state.rings.get(target.dataset.ring);if(!r||r.removed)return;
    const p=svgPoint(e),a=angle(p.x,p.y,r.x,r.y);
    const trackers=new Map();
    incident(r.id).filter(c=>eligibleForRing(c,r.id)).forEach(c=>{
      const rel=norm(claspAngleFor(c,r)-r.rotation);const half=r.gapSize/2;
      trackers.set(c.id,{phase:Math.abs(rel)<half*.82?1:0,entrySide:Math.sign(rel)||1,lastRel:rel,complete:false});
    });
    state.drag={ringId:r.id,lastPointer:a,total:0,signedTotal:0,trackers,pending:null};r.el.classList.add('dragging');svg.setPointerCapture?.(e.pointerId);play('touch',.35);e.preventDefault();
  }
  function moveDrag(e){
    if(!state.drag)return;const r=state.rings.get(state.drag.ringId);const p=svgPoint(e),a=angle(p.x,p.y,r.x,r.y);let d=norm(a-state.drag.lastPointer);d=clamp(d,-.32,.32);state.drag.lastPointer=a;state.drag.total+=Math.abs(d);state.drag.signedTotal+=d;r.rotation+=d;r.el.style.transform=`rotate(${deg(r.rotation)}deg)`;
    if(!state.drag.pending){
      for(const [cid,t] of state.drag.trackers){
        const c=state.clasps.get(cid);if(!eligibleForRing(c,r.id))continue;
        const rel=norm(claspAngleFor(c,r)-r.rotation);const half=r.gapSize/2;const inside=Math.abs(rel)<=half*.72;const outside=Math.abs(rel)>=half*1.08;
        if(t.phase===0&&inside){t.phase=1;t.entrySide=Math.sign(t.lastRel)||Math.sign(rel)||1}
        else if(t.phase===1&&outside&&Math.sign(rel)!==t.entrySide&&state.drag.total>r.gapSize*.72){t.complete=true;state.drag.pending=cid;c.frontEl.classList.add('eligible');break}
        t.lastRel=rel;
      }
    }
    e.preventDefault();
  }
  function endDrag(){
    if(!state.drag)return;const drag=state.drag;state.drag=null;const r=state.rings.get(drag.ringId);r.el.classList.remove('dragging');if(drag.total<.08)return;
    state.moves++;r.touched=true;$('#movesText').textContent=String(state.moves);
    if(drag.pending)releaseClasp(state.clasps.get(drag.pending),r);else{
      const eligible=incident(r.id).filter(c=>eligibleForRing(c,r.id));
      if(!eligible.length&&incident(r.id).length)showToast('这枚金扣仍被上层玉环压住');
      else if(eligible.length)showToast('缺口要从金扣一侧完整穿到另一侧');
      else showToast('这只玉环已无金扣连接');
    }
  }
  function bindBoard(){svg.onpointerdown=beginDrag;svg.onpointermove=moveDrag;svg.onpointerup=endDrag;svg.onpointercancel=endDrag;svg.onlostpointercapture=endDrag}

  function releaseClasp(c,byRing){
    if(!c||c.released)return;c.released=true;c.frontEl.classList.add('released');c.backEl.classList.add('released');
    const ripple=svgEl('circle',{cx:c.x,cy:c.y,r:16,fill:'none',stroke:'#fff3b0','stroke-width':5,class:'unlock-ripple'});svg.appendChild(ripple);setTimeout(()=>ripple.remove(),600);play('release',.75);
    setTimeout(()=>{c.frontEl.style.display='none';c.backEl.style.display='none'},380);
    // A valid crossing may free either or both connected rings.
    setTimeout(()=>{endpointRings(c).forEach(id=>removeIfFree(state.rings.get(id)));refreshEligibility();checkComplete()},220);
  }
  function removeIfFree(r){
    if(!r||r.removed||incident(r.id).length)return;r.removed=true;r.el.classList.add('removing');play('release',.5);setTimeout(()=>{r.el.style.display='none';refreshEligibility();checkComplete()},680)
  }
  function checkComplete(){
    if([...state.rings.values()].every(r=>r.removed)){
      clearInterval(state.timerId);state.completed.add(levelKey(state.chapter,state.level));save();play('complete',.9);
      $('#resultText').textContent=`${state.moves}步完成 · 玉环轻转，万事圆满。`;
      setTimeout(()=>{$('#completeModal').classList.add('show');$('#completeModal').setAttribute('aria-hidden','false')},420)
    }
  }

  function hint(){const c=[...state.clasps.values()].find(c=>!c.released&&exposed(c));if(!c)return showToast('先解开外层结构');c.frontEl.classList.add('eligible');c.frontEl.animate([{filter:'brightness(1)'},{filter:'brightness(2.4) drop-shadow(0 0 13px #fff3aa)'},{filter:'brightness(1)'}],{duration:850,iterations:2});const rid=endpointRings(c)[0];state.rings.get(rid)?.el.classList.add('hinting');setTimeout(()=>state.rings.get(rid)?.el.classList.remove('hinting'),1900);showToast('让高亮玉环的缺口完整穿过这枚金扣')}

  $('#levelBack').addEventListener('click',()=>{buildChapters();setScreen('chapters')});
  $('#exitBtn').addEventListener('click',()=>{clearInterval(state.timerId);openLevels(state.chapter)});
  $('#resetBtn').addEventListener('click',()=>{initBoard();startTimer()});
  $('#hintBtn').addEventListener('click',hint);
  $('#soundBtn').addEventListener('click',e=>{state.sound=!state.sound;e.currentTarget.classList.toggle('muted',!state.sound);if(state.sound)audio.bgm.play().catch(()=>{});else audio.bgm.pause()});
  $('#replayBtn').addEventListener('click',()=>{$('#completeModal').classList.remove('show');initBoard();startTimer()});
  $('#nextBtn').addEventListener('click',()=>{$('#completeModal').classList.remove('show');if(state.level<10)openGame(state.chapter,state.level+1);else openLevels(state.chapter)});

  buildChapters();
})();
