import { Game } from './engine/Game.js';
import { LEVELS, CHAPTER } from './config/levels.js';

const $=selector=>document.querySelector(selector);
const ui={
  chapter:$('#chapterName'),level:$('#levelName'),progress:$('#progress'),toast:$('#toast'),
  levelDialog:$('#levelDialog'),completeDialog:$('#completeDialog'),completeText:$('#completeText'),levelGrid:$('#levelGrid'),bgm:$('#bgm')
};
ui.chapter.textContent=CHAPTER.name;

function toast(message){
  ui.toast.textContent=message;
  ui.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>ui.toast.classList.remove('show'),1400);
}

const game=new Game({
  canvas:$('#scene'),
  levels:LEVELS,
  onProgress:(done,total)=>ui.progress.textContent=`${done} / ${total}`,
  onComplete:level=>{ui.completeText.textContent=level.name;ui.completeDialog.showModal();},
  onToast:toast
});

function load(index){
  const level=game.load(index);
  ui.level.textContent=level.name;
  history.replaceState(null,'',`#level-${game.levelIndex+1}`);
}

function buildLevelGrid(){
  ui.levelGrid.innerHTML='';
  LEVELS.forEach((level,index)=>{
    const button=document.createElement('button');
    button.className='level-card';
    button.innerHTML=`<b>第 ${index+1} 关</b><span>${level.name}</span>`;
    button.onclick=()=>{ui.levelDialog.close();load(index);};
    ui.levelGrid.append(button);
  });
}
buildLevelGrid();

$('#resetBtn').onclick=()=>{const level=game.reset();ui.level.textContent=level.name;};
$('#hintBtn').onclick=()=>game.hint();
$('#selectBtn').onclick=()=>ui.levelDialog.showModal();
$('#backBtn').onclick=()=>{const level=game.previous();ui.level.textContent=level.name;};
$('#replayBtn').onclick=()=>{ui.completeDialog.close();load(game.levelIndex);};
$('#nextBtn').onclick=()=>{ui.completeDialog.close();load(game.levelIndex+1);};
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());

let sound=true;
$('#soundBtn').onclick=async()=>{
  sound=!sound;
  game.setSound(sound);
  $('#soundBtn').textContent=sound?'音':'静';
  if(sound){try{ui.bgm.volume=.22;await ui.bgm.play();}catch{}}
  else ui.bgm.pause();
};

const initial=Math.max(0,Math.min(LEVELS.length-1,(Number(location.hash.match(/\d+/)?.[0])||1)-1));
load(initial);
