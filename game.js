(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg', TAU=Math.PI*2;
  const $=s=>document.querySelector(s);
  const els={
    chapterScreen:$('#chapterScreen'),levelScreen:$('#levelScreen'),gameScreen:$('#gameScreen'),
    chapterGrid:$('#chapterGrid'),totalProgress:$('#totalProgress'),levelGrid:$('#levelGrid'),
    levelBg:$('#levelBg'),levelChapterNo:$('#levelChapterNo'),levelChapterTitle:$('#levelChapterTitle'),levelRingMini:$('#levelRingMini'),
    levelBack:$('#levelBack'),gameBg:$('#gameBg'),gameChapterLabel:$('#gameChapterLabel'),gameLevelTitle:$('#gameLevelTitle'),
    board:$('#boardSvg'),moves:$('#movesText'),timer:$('#timerText'),toast:$('#toast'),gameTip:$('#gameTip'),
    hint:$('#hintBtn'),reset:$('#resetBtn'),sound:$('#soundBtn'),exit:$('#exitBtn'),
    modal:$('#completeModal'),result:$('#resultText'),replay:$('#replayBtn'),next:$('#nextBtn'),bgm:$('#bgm'),chime:$('#chime'),tap:$('#tapSound')
  };
  const themes=window.YH_DATA.THEMES;
  const progressKey='yuhuan-qiaojie-progress-v4';
  let progress=loadProgress();
  let chapterIndex=0,levelIndex=0,state=null,timerHandle=null,soundOn=true;

  function loadProgress(){
    try{return JSON.parse(localStorage.getItem(progressKey))||{completed:{}}}catch(_){return{completed:{}}}
  }
  function saveProgress(){localStorage.setItem(progressKey,JSON.stringify(progress))}
  function completedKey(c,l){return `${c}-${l}`}
  function isCompleted(c,l){return !!progress.completed[completedKey(c,l)]}
  function isUnlocked(c,l){return l===0 || isCompleted(c,l-1) || isCompleted(c,l)}
  function totalCompleted(){return Object.keys(progress.completed).filter(k=>progress.completed[k]).length}
  function showScreen(el){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');window.scrollTo({top:0,behavior:'instant'})}

  function ringPreview(theme,index,size=125){
    const gid=`miniGrad${index}${size}`;
    return `<svg viewBox="0 0 140 140" width="100%" height="100%" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.colors[0]}"/><stop offset=".35" stop-color="${theme.colors[1]}"/><stop offset=".68" stop-color="${theme.colors[2]}"/><stop offset="1" stop-color="${theme.colors[3]}"/></linearGradient><filter id="ms${index}"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-opacity=".25"/></filter></defs>
      <circle cx="70" cy="70" r="45" fill="none" stroke="#6c4a3b" stroke-opacity=".20" stroke-width="23" stroke-linecap="round" stroke-dasharray="244 39" transform="rotate(-38 70 70)" filter="url(#ms${index})"/>
      <circle cx="70" cy="70" r="45" fill="none" stroke="url(#${gid})" stroke-width="19" stroke-linecap="round" stroke-dasharray="244 39" transform="rotate(-38 70 70)"/>
      <path d="M38 43 Q59 18 91 30" fill="none" stroke="white" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
      <circle cx="103" cy="39" r="4.5" fill="${theme.gem}" opacity=".78"/><circle cx="111" cy="74" r="4.5" fill="${theme.gem}" opacity=".78"/>
    </svg>`;
  }

  function renderChapters(){
    els.totalProgress.textContent=`${totalCompleted()} / 88`;
    els.chapterGrid.innerHTML=themes.map((t,i)=>{
      const done=Array.from({length:11},(_,l)=>isCompleted(i,l)).filter(Boolean).length;
      return `<button class="chapter-card" data-chapter="${i}" style="--card-accent:${t.colors[2]}">
        <span class="chapter-progress">${done}/11</span><span class="chapter-no">${t.no}</span><h3>${t.title}</h3>
        <div class="chapter-ring-preview">${ringPreview(t,i)}</div><div class="chapter-meta">11 关</div><div class="try-badge">首关免费试玩</div>
      </button>`;
    }).join('');
    els.chapterGrid.querySelectorAll('.chapter-card').forEach(btn=>btn.addEventListener('click',()=>openChapter(+btn.dataset.chapter)));
  }

  function openChapter(i){
    chapterIndex=i; const t=themes[i];
    els.levelBg.style.backgroundImage=`url('${t.bg}')`;
    els.levelChapterNo.textContent=t.no; els.levelChapterTitle.textContent=t.title;
    els.levelRingMini.innerHTML=ringPreview(t,100+i,64);
    els.levelGrid.innerHTML=Array.from({length:11},(_,l)=>{
      const unlocked=isUnlocked(i,l),done=isCompleted(i,l),name=window.YH_DATA.TEMPLATES[l].name;
      return `<button class="level-tile ${unlocked?'':'locked'}" data-level="${l}" ${unlocked?'':'disabled'}>
        <span>${done?'✓':l+1}</span>${unlocked?`<small class="best">${name}</small>`:`<span class="lock">🔒</span>`}
      </button>`;
    }).join('');
    els.levelGrid.querySelectorAll('.level-tile:not(.locked)').forEach(b=>b.addEventListener('click',()=>startLevel(+b.dataset.level)));
    showScreen(els.levelScreen);
  }

  function startLevel(l){
    levelIndex=l; const t=themes[chapterIndex];
    state=createState(window.YH_DATA.buildLevel(chapterIndex,l));
    els.gameBg.style.backgroundImage=`url('${t.bg}')`;
    els.gameChapterLabel.textContent=`${t.no} · ${t.title}`;
    els.gameLevelTitle.textContent=state.level.name;
    els.moves.textContent='0';els.timer.textContent='00:00';
    els.modal.classList.remove('show');els.modal.setAttribute('aria-hidden','true');
    renderBoard();refreshStates();startTimer();showScreen(els.gameScreen);
    els.gameTip.textContent=`${t.poem} 所有金扣已显示，先观察外层可转玉环。`;
  }

  function createState(level){
    const rings=new Map(level.rings.map(r=>[r.id,{...r,removed:false,removing:false}]));
    const links=level.links.map(l=>({...l,released:false}));
    return {level,rings,links,moves:0,start:Date.now(),selected:null,pointerId:null,lastPointerAngle:0,totalGesture:0,gestureReleased:false,moved:false};
  }

  function startTimer(){clearInterval(timerHandle);timerHandle=setInterval(()=>{if(!state)return;const s=Math.floor((Date.now()-state.start)/1000);els.timer.textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},500)}
  function stopTimer(){clearInterval(timerHandle)}

  function svgEl(name,attrs={}){const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e}
  function normalize(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a}
  function nearestAngle(a,ref){return a+Math.round((ref-a)/TAU)*TAU}
  function arcPath(cx,cy,r,startDeg=28,endDeg=332){
    const p=(deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}};
    const s=p(endDeg),e=p(startDeg),large=(endDeg-startDeg)<=180?0:1;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }
  function themeDefs(t){
    return `<defs>
      <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffef6" stop-opacity=".97"/><stop offset=".55" stop-color="#edf2df" stop-opacity=".94"/><stop offset="1" stop-color="#d8dec9" stop-opacity=".96"/></linearGradient>
      <radialGradient id="plateGlow"><stop stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#d7ddc9" stop-opacity=".2"/></radialGradient>
      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.colors[0]}"/><stop offset=".26" stop-color="${t.colors[1]}"/><stop offset=".58" stop-color="${t.colors[2]}"/><stop offset=".82" stop-color="${t.colors[1]}"/><stop offset="1" stop-color="${t.colors[3]}"/></linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#7d4512"/><stop offset=".18" stop-color="#c77b25"/><stop offset=".42" stop-color="#fff0a5"/><stop offset=".62" stop-color="#e5a648"/><stop offset=".83" stop-color="#a85e18"/><stop offset="1" stop-color="#6d390d"/></linearGradient>
      <radialGradient id="gemGrad"><stop stop-color="#fff"/><stop offset=".28" stop-color="${t.gem}"/><stop offset="1" stop-color="#a66b7e"/></radialGradient>
      <filter id="boardShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#3f2e28" flood-opacity=".32"/></filter>
      <filter id="ringShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#3a2831" flood-opacity=".34"/></filter>
      <filter id="crystal" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".018 .035" numOctaves="2" seed="8" result="n"/><feColorMatrix in="n" values="1 0 0 0 .2  0 1 0 0 .05  0 0 1 0 .12  0 0 0 .22 0" result="c"/><feBlend in="SourceGraphic" in2="c" mode="screen"/></filter>
      <filter id="goldShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#3a210d" flood-opacity=".4"/></filter>
      <pattern id="platePattern" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 40 Q20 20 40 40 T80 40 M40 0 Q20 20 40 40 T40 80" fill="none" stroke="#a8875e" stroke-opacity=".08" stroke-width="2"/></pattern>
    </defs>`;
  }

  function renderBoard(){
    const t=themes[chapterIndex],svg=els.board;svg.innerHTML=themeDefs(t);
    const board=svgEl('g',{filter:'url(#boardShadow)'});
    board.innerHTML=`
      <path d="M155 38 Q450 -2 745 38 Q855 62 864 178 L864 838 Q855 958 745 986 Q450 1030 155 986 Q45 958 36 838 L36 178 Q45 62 155 38 Z" fill="url(#plateGrad)" stroke="#cfa46d" stroke-width="8"/>
      <path d="M168 65 Q450 28 732 65 Q824 85 832 186 L832 827 Q824 925 732 951 Q450 990 168 951 Q76 925 68 827 L68 186 Q76 85 168 65 Z" fill="url(#plateGlow)" stroke="#fff" stroke-opacity=".65" stroke-width="3"/>
      <path d="M168 65 Q450 28 732 65 Q824 85 832 186 L832 827 Q824 925 732 951 Q450 990 168 951 Q76 925 68 827 L68 186 Q76 85 168 65 Z" fill="url(#platePattern)" opacity=".8"/>
      <g fill="none" stroke="#c3a075" stroke-opacity=".38" stroke-width="3"><path d="M360 86 Q450 30 540 86 Q510 98 450 80 Q390 98 360 86Z"/><path d="M360 934 Q450 990 540 934 Q510 922 450 940 Q390 922 360 934Z"/><path d="M93 470 Q38 520 93 570 Q105 540 88 520 Q105 500 93 470Z"/><path d="M807 470 Q862 520 807 570 Q795 540 812 520 Q795 500 807 470Z"/></g>`;
    svg.appendChild(board);
    const back=svgEl('g',{id:'claspBackLayer'}),ringLayer=svgEl('g',{id:'ringLayer'}),front=svgEl('g',{id:'claspFrontLayer'}),particles=svgEl('g',{id:'particleLayer'});
    svg.append(back,ringLayer,front,particles);
    state.links.forEach(link=>{back.appendChild(makeClasp(link,false));});
    state.rings.forEach(r=>ringLayer.appendChild(makeRing(r,t)));
    state.links.forEach(link=>{front.appendChild(makeClasp(link,true));});
    bindRingEvents();
  }

  function makeRing(r,t){
    const g=svgEl('g',{id:`ring-${r.id}`,class:'ring-group',transform:`translate(${r.x} ${r.y}) rotate(${r.rotation*180/Math.PI})`});
    g.style.transformBox='fill-box';g.style.transformOrigin='center';
    const d=arcPath(0,0,r.r,30,330),w=Math.max(42,r.r*.46);
    g.innerHTML=`
      <path class="ring-aura" d="${d}" fill="none" stroke="${t.gem}" stroke-opacity=".35" stroke-width="${w+26}" stroke-linecap="round" opacity="0"/>
      <path d="${d}" fill="none" stroke="#47333c" stroke-opacity=".28" stroke-width="${w+13}" stroke-linecap="round" filter="url(#ringShadow)"/>
      <path d="${d}" fill="none" stroke="url(#ringGrad)" stroke-width="${w}" stroke-linecap="round" filter="url(#crystal)"/>
      <path d="${d}" fill="none" stroke="${t.colors[0]}" stroke-opacity=".30" stroke-width="${w*.66}" stroke-linecap="round"/>
      <path d="${arcPath(-3,-5,r.r,42,205)}" fill="none" stroke="#fff" stroke-opacity=".82" stroke-width="${Math.max(5,w*.105)}" stroke-linecap="round"/>
      <path d="${arcPath(4,5,r.r,210,312)}" fill="none" stroke="${t.colors[3]}" stroke-opacity=".16" stroke-width="${Math.max(4,w*.07)}" stroke-linecap="round"/>
      ${ringTexture(r,t,w)}
      <path class="ring-hit" data-ring-id="${r.id}" d="${d}" fill="none" stroke="transparent" stroke-width="${w+38}" stroke-linecap="round"/>
    `;
    return g;
  }
  function ringTexture(r,t,w){
    const angles=[55,88,125,166,215,255,295];
    return angles.map((a,i)=>{const rad=(a-90)*Math.PI/180,x=r.r*Math.cos(rad),y=r.r*Math.sin(rad),rr=(i%3===0?5:3.5);return `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity="${i%2?.18:.32}"/><ellipse cx="${x+5}" cy="${y-2}" rx="${rr*2.2}" ry="${rr*.55}" fill="${t.colors[0]}" opacity=".18" transform="rotate(${a} ${x+5} ${y-2})"/>`}).join('');
  }

  function claspGeometry(link){
    const target=state.rings.get(link.target);if(!target)return null;
    if(link.host==='board'){
      const angle=link.angle,rr=target.r;return{x:target.x+Math.cos(angle)*rr,y:target.y+Math.sin(angle)*rr,angle:angle+Math.PI/2,w:66,h:45};
    }
    const host=state.rings.get(link.host);if(!host)return null;
    const dx=target.x-host.x,dy=target.y-host.y,angle=Math.atan2(dy,dx);
    const x=(host.x+target.x)/2,y=(host.y+target.y)/2;
    return{x,y,angle,w:Math.max(64,Math.min(host.r,target.r)*.88),h:46};
  }
  function makeClasp(link,front){
    const geo=claspGeometry(link),g=svgEl('g',{id:`clasp-${front?'f':'b'}-${link.id}`,class:'clasp-group'});if(!geo)return g;
    const deg=geo.angle*180/Math.PI;g.setAttribute('transform',`translate(${geo.x} ${geo.y}) rotate(${deg})`);g.dataset.linkId=link.id;
    if(!front){
      g.innerHTML=`<rect x="${-geo.w/2}" y="${-geo.h/2}" width="${geo.w}" height="${geo.h}" rx="12" fill="#724015" opacity=".88" filter="url(#goldShadow)"/><rect x="${-geo.w/2+5}" y="${-geo.h/2+5}" width="${geo.w-10}" height="${geo.h-10}" rx="9" fill="#b96e23" opacity=".72"/>`;
    }else{
      const gems=Array.from({length:link.gems||1},(_,i)=>{const gap=14,start=-(link.gems-1)*gap/2;return `<circle cx="${start+i*gap}" cy="0" r="5.4" fill="url(#gemGrad)" stroke="#fff1c2" stroke-width="1.4"/><circle cx="${start+i*gap-1.5}" cy="-1.5" r="1.4" fill="#fff"/>`}).join('');
      g.innerHTML=`<rect x="${-geo.w/2}" y="${-geo.h/2}" width="${geo.w}" height="${geo.h}" rx="13" fill="url(#goldGrad)" stroke="#6f3a0e" stroke-width="2" filter="url(#goldShadow)"/><rect x="${-geo.w/2+5}" y="${-geo.h/2+5}" width="${geo.w-10}" height="${geo.h-10}" rx="9" fill="none" stroke="#fff1b5" stroke-opacity=".72" stroke-width="2"/><path d="M${-geo.w/2+9} ${-geo.h/2+8} Q0 ${-geo.h/2-2} ${geo.w/2-9} ${-geo.h/2+8}" fill="none" stroke="#fff5c8" stroke-width="3" stroke-linecap="round" opacity=".72"/>${gems}`;
    }
    return g;
  }

  function bindRingEvents(){
    els.board.querySelectorAll('.ring-hit').forEach(hit=>hit.addEventListener('pointerdown',onPointerDown));
    els.board.addEventListener('pointermove',onPointerMove,{passive:false});
    els.board.addEventListener('pointerup',onPointerUp,{passive:false});
    els.board.addEventListener('pointercancel',onPointerUp,{passive:false});
  }
  function svgPoint(ev){const pt=els.board.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(els.board.getScreenCTM().inverse())}
  function ringOutgoing(rid){return state.links.filter(l=>l.host===rid&&!l.released)}
  function ringIncoming(rid){return state.links.filter(l=>l.target===rid&&!l.released&&(l.host==='board'||!state.rings.get(l.host)?.removed))}
  function ringActive(rid){return ringOutgoing(rid).every(l=>state.rings.get(l.target)?.removed||l.released)}
  function edgeAngle(link){const target=state.rings.get(link.target);if(link.host==='board')return link.angle;const host=state.rings.get(link.host);return Math.atan2(host.y-target.y,host.x-target.x)}

  function onPointerDown(ev){
    if(!state||state.selected)return;const rid=ev.currentTarget.dataset.ringId,ring=state.rings.get(rid);if(!ring||ring.removed||ring.removing)return;
    if(!ringActive(rid)){showToast('此环仍被外层玉环牵制');pulseBlockers(rid);return}
    const p=svgPoint(ev);state.selected=ring;state.pointerId=ev.pointerId;state.lastPointerAngle=Math.atan2(p.y-ring.y,p.x-ring.x);state.totalGesture=0;state.gestureReleased=false;state.moved=false;
    try{els.board.setPointerCapture(ev.pointerId)}catch(_){}
    $('#ring-'+rid)?.classList.add('active');
  }
  function onPointerMove(ev){
    if(!state?.selected||ev.pointerId!==state.pointerId)return;ev.preventDefault();const ring=state.selected,p=svgPoint(ev),a=Math.atan2(p.y-ring.y,p.x-ring.x),delta=normalize(a-state.lastPointerAngle);if(Math.abs(delta)>.7)return;
    const prev=ring.rotation;ring.rotation+=delta;state.totalGesture+=delta;state.lastPointerAngle=a;if(Math.abs(state.totalGesture)>.04)state.moved=true;updateRingTransform(ring);
    if(!state.gestureReleased&&Math.abs(state.totalGesture)>.18){
      const candidates=ringIncoming(ring.id);
      for(const link of candidates){
        const t=nearestAngle(edgeAngle(link),prev),cross=(delta>0&&prev<t&&ring.rotation>=t)||(delta<0&&prev>t&&ring.rotation<=t);
        if(cross){ring.rotation=t;updateRingTransform(ring);releaseLink(link,ring);state.gestureReleased=true;break}
      }
    }
    if(Math.abs(state.totalGesture)>.5&&Math.floor(Math.abs(state.totalGesture)/.5)!==Math.floor(Math.abs(state.totalGesture-delta)/.5))playTap(.22);
  }
  function onPointerUp(ev){
    if(!state?.selected)return;const ring=state.selected;$('#ring-'+ring.id)?.classList.remove('active');if(state.moved){state.moves++;els.moves.textContent=state.moves}state.selected=null;state.pointerId=null;try{if(els.board.hasPointerCapture(ev.pointerId))els.board.releasePointerCapture(ev.pointerId)}catch(_){}
  }
  function updateRingTransform(ring){const g=$(`#ring-${ring.id}`);if(g)g.setAttribute('transform',`translate(${ring.x} ${ring.y}) rotate(${ring.rotation*180/Math.PI})`)}

  function releaseLink(link,ring){
    link.released=true;playChime();['b','f'].forEach(layer=>$(`#clasp-${layer}-${link.id}`)?.classList.add('released'));showToast('金扣已解');setTimeout(()=>{checkRingRemoval(ring.id);refreshStates()},260);
  }
  function checkRingRemoval(rid){
    const ring=state.rings.get(rid);if(!ring||ring.removed||ring.removing)return;
    if(ringIncoming(rid).length===0&&ringActive(rid))removeRing(ring);
  }
  function removeRing(ring){
    ring.removing=true;const g=$(`#ring-${ring.id}`);if(g)g.classList.add('removing');playChime(true);
    setTimeout(()=>{
      ring.removed=true;ring.removing=false;if(g)g.style.display='none';
      // 安全处理其余与该环相关的金扣
      state.links.filter(l=>!l.released&&(l.host===ring.id||l.target===ring.id)).forEach(l=>{l.released=true;['b','f'].forEach(layer=>$(`#clasp-${layer}-${l.id}`)?.classList.add('released'))});
      refreshStates();checkAutoRemovals();checkComplete();
    },620);
  }
  function checkAutoRemovals(){
    let changed=false;state.rings.forEach(r=>{if(!r.removed&&!r.removing&&ringActive(r.id)&&ringIncoming(r.id).length===0){removeRing(r);changed=true}});return changed;
  }
  function checkComplete(){
    if([...state.rings.values()].every(r=>r.removed)){
      stopTimer();const s=Math.floor((Date.now()-state.start)/1000);progress.completed[completedKey(chapterIndex,levelIndex)]=true;saveProgress();els.result.textContent=`${state.level.name} · ${state.moves} 步 · ${s} 秒。玉环轻转，万事圆满。`;els.modal.classList.add('show');els.modal.setAttribute('aria-hidden','false');renderChapters();
    }
  }
  function refreshStates(){
    if(!state)return;state.rings.forEach(r=>{const g=$(`#ring-${r.id}`);if(!g)return;g.classList.toggle('active',ringActive(r.id)&&!r.removed);g.classList.toggle('inactive',!ringActive(r.id)&&!r.removed)});
    state.links.forEach(l=>{const active=!l.released&&ringActive(l.target);['b','f'].forEach(layer=>{const g=$(`#clasp-${layer}-${l.id}`);if(!g)return;g.classList.toggle('active',active);g.classList.toggle('inactive',!active&&!l.released)})});
  }
  function pulseBlockers(rid){ringOutgoing(rid).filter(l=>!l.released).forEach(l=>{const target=$(`#ring-${l.target}`);target?.classList.add('hinting');setTimeout(()=>target?.classList.remove('hinting'),1200)})}

  function hint(){
    if(!state)return;const ring=[...state.rings.values()].find(r=>!r.removed&&!r.removing&&ringActive(r.id)&&ringIncoming(r.id).length);if(!ring){showToast('正在整理玉结…');return}const link=ringIncoming(ring.id)[0],rg=$(`#ring-${ring.id}`);rg?.classList.add('hinting');['b','f'].forEach(layer=>$(`#clasp-${layer}-${link.id}`)?.classList.add('hinting'));showToast(`先转动「${ring.id}」环，让缺口越过发光金扣`);setTimeout(()=>{rg?.classList.remove('hinting');['b','f'].forEach(layer=>$(`#clasp-${layer}-${link.id}`)?.classList.remove('hinting'))},2200)
  }
  let toastTimer;function showToast(msg){clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.add('show');toastTimer=setTimeout(()=>els.toast.classList.remove('show'),1500)}
  function playChime(full=false){if(!soundOn)return;const a=els.chime.cloneNode();a.volume=full?.9:.65;a.playbackRate=full?.9:1+Math.random()*.08;a.play().catch(()=>{})}
  function playTap(volume=.25){if(!soundOn)return;const a=els.tap.cloneNode();a.volume=volume;a.playbackRate=.95+Math.random()*.1;a.play().catch(()=>{})}
  function toggleSound(){soundOn=!soundOn;els.sound.classList.toggle('muted',!soundOn);if(soundOn){els.bgm.volume=.26;els.bgm.play().catch(()=>{});playTap(.2)}else els.bgm.pause();showToast(soundOn?'声音已开启':'声音已关闭')}

  els.levelBack.addEventListener('click',()=>{showScreen(els.chapterScreen);renderChapters()});
  els.exit.addEventListener('click',()=>{stopTimer();openChapter(chapterIndex)});
  els.reset.addEventListener('click',()=>startLevel(levelIndex));
  els.hint.addEventListener('click',hint);els.sound.addEventListener('click',toggleSound);
  els.replay.addEventListener('click',()=>startLevel(levelIndex));
  els.next.addEventListener('click',()=>{if(levelIndex<10)startLevel(levelIndex+1);else openChapter(chapterIndex)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)els.bgm.pause();else if(soundOn&&els.gameScreen.classList.contains('active'))els.bgm.play().catch(()=>{})});

  renderChapters();
})();
