/* v14: real in-game fullscreen for Clover Valley. Main POLY SCOUT is untouched. */
(()=>{'use strict';
 const play=document.querySelector('.farm-playfield');
 const sidebar=document.querySelector('.farm-sidebar');
 const screenTools=document.querySelector('.farm-playfield .screen-tools');
 const toolbar=document.querySelector('.farm-playfield .farm-toolbar');
 const topStats=document.querySelector('.farm-playfield .farm-status');
 const touch=document.querySelector('.farm-touch-pad');
 const screenButton=document.getElementById('fullscreenFarm');
 const snd=window.PolyFarmSound;
 if(!play||!sidebar||!toolbar||!screenTools||!screenButton)return;
 const el=(tag,cls,html)=>{const n=document.createElement(tag);n.className=cls;if(html!==undefined)n.innerHTML=html;return n;};
 const originals=[sidebar,screenTools,toolbar,topStats,touch].filter(Boolean).map(node=>({node,parent:node.parentNode,next:node.nextSibling}));
 const restore=node=>{const h=originals.find(x=>x.node===node);if(!h)return;if(h.next&&h.next.parentNode===h.parent)h.parent.insertBefore(node,h.next);else h.parent.appendChild(node);};
 const hud=el('div','farm-imm-hud','<div class="farm-imm-top"><div class="farm-imm-stats"></div><div class="farm-imm-buttons"></div></div><div class="farm-imm-bottom"><div class="farm-imm-tools"></div><div class="farm-imm-touch"></div></div>');
 const buttons=hud.querySelector('.farm-imm-buttons');
 const menuButton=el('button','farm-imm-button','☰ Меню фермы');menuButton.type='button';menuButton.setAttribute('aria-expanded','false');
 const actionButton=el('button','farm-imm-button','E Действие');actionButton.type='button';
 const fishButton=el('button','farm-imm-button','🎣 Рыбалка');fishButton.type='button';
 const tractorButton=el('button','farm-imm-button','🚜 Трактор');tractorButton.type='button';
 buttons.append(menuButton,actionButton,fishButton,tractorButton);
 const drawer=el('div','farm-imm-drawer');drawer.hidden=true;
 const head=el('div','farm-imm-drawerhead','<b>🌾 Клеверная долина · Меню</b>');
 const close=el('button','farm-imm-button','✕ Закрыть');close.type='button';head.append(close);
 const scroll=el('div','farm-imm-drawerscroll');drawer.append(head,scroll);
 play.append(hud,drawer);
 let fallback=false;
 const active=()=>document.fullscreenElement===play||fallback;
 const setMenu=open=>{drawer.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));};
 const notifyAction=code=>{const e=new KeyboardEvent('keydown',{key:code.toLowerCase(),code:'Key'+code.toUpperCase(),bubbles:true});window.dispatchEvent(e);window.dispatchEvent(new KeyboardEvent('keyup',{key:code.toLowerCase(),code:'Key'+code.toUpperCase(),bubbles:true}));};
 const update=()=>{
  const on=active();play.classList.toggle('farm-immersive',on);
  if(on){hud.querySelector('.farm-imm-stats').append(topStats);buttons.prepend(screenTools);hud.querySelector('.farm-imm-tools').append(toolbar);if(touch)hud.querySelector('.farm-imm-touch').append(touch);scroll.append(sidebar);screenButton.textContent='⤢ Выйти';}
  else{setMenu(false);for(const {node} of originals)restore(node);screenButton.textContent='⛶ На полный экран';}
 };
 async function fullscreen(){
  try{if(document.fullscreenElement===play){await document.exitFullscreen();fallback=false;}else if(play.requestFullscreen){await play.requestFullscreen();fallback=false;}else fallback=!fallback;}
  catch{fallback=!fallback;}
  update();
 }
 // Capture handler before the original handler which fullscreened the entire website.
 screenButton.addEventListener('click',e=>{e.stopImmediatePropagation();fullscreen();},true);
 menuButton.addEventListener('click',()=>{setMenu(drawer.hidden);snd?.effect('click');});
 close.addEventListener('click',()=>{setMenu(false);snd?.effect('click');});
 actionButton.addEventListener('click',()=>notifyAction('E'));
 fishButton.addEventListener('click',()=>notifyAction('F'));
 tractorButton.addEventListener('click',()=>notifyAction('T'));
 document.addEventListener('fullscreenchange',update);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)setMenu(false);if(e.altKey&&e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();fullscreen();}if(e.key==='F9'&&!e.repeat&&active()){e.preventDefault();setMenu(drawer.hidden);}});
 document.addEventListener('pointerdown',()=>{snd?.ensure().then(()=>{const weather=document.getElementById('weatherLabel')?.textContent||'';snd?.setRain?.(/дожд|гроз/i.test(weather));});},{once:true,capture:true});
 document.addEventListener('keydown',()=>{snd?.ensure().then(()=>{const weather=document.getElementById('weatherLabel')?.textContent||'';snd?.setRain?.(/дожд|гроз/i.test(weather));});},{once:true,capture:true});
 // Ambient sounds, region and weather are now handled by soundscape-v15.js.
 update();
})();
