(()=>{'use strict';
const layout=document.querySelector('.farm-layout'),main=document.querySelector('.farm-playfield'),sidebar=document.querySelector('.farm-sidebar');
if(!layout||!main||!sidebar)return;
const hud=document.createElement('div');hud.className='immersive-hud';hud.innerHTML='<div class="immersive-top"><button id="immersiveFullscreen" type="button">⛶ Экран</button><button id="immersiveMenu" type="button">☰ Меню</button></div><div class="immersive-tools"></div><div class="immersive-bottom"></div>';
const drawer=document.createElement('div');drawer.className='immersive-drawer';drawer.hidden=true;drawer.innerHTML='<div class="immersive-drawer-head"><b>✳ Меню фермы</b><button id="immersiveClose" type="button">✕ Закрыть</button></div><div class="immersive-drawer-body"></div>';
main.append(hud,drawer);
const $=id=>document.getElementById(id),toolbar=document.querySelector('.farm-toolbar'),screenTools=document.querySelector('.screen-tools'),touch=document.querySelector('.farm-touch-pad');
const items=[toolbar,screenTools,touch,sidebar].filter(Boolean),homes=items.map(el=>({el,parent:el.parentNode,next:el.nextSibling}));
const isFull=()=>document.fullscreenElement===layout||layout.classList.contains('immersive-fallback');
function restore(el){const h=homes.find(x=>x.el===el);if(h.next?.parentNode===h.parent)h.parent.insertBefore(el,h.next);else h.parent.appendChild(el);}
function menu(open){drawer.hidden=!open;$('immersiveMenu').setAttribute('aria-expanded',String(open));}
function update(){const active=isFull();layout.classList.toggle('immersive-active',active);$('immersiveFullscreen').textContent=active?'⤢ Выйти':'⛶ Экран';if(active){if(toolbar)hud.querySelector('.immersive-tools').append(toolbar);if(screenTools)hud.querySelector('.immersive-top').append(screenTools);if(touch)hud.querySelector('.immersive-bottom').append(touch);drawer.querySelector('.immersive-drawer-body').append(sidebar);}else{menu(false);items.forEach(restore);}}
async function toggle(){try{if(document.fullscreenElement===layout)await document.exitFullscreen();else if(layout.requestFullscreen)await layout.requestFullscreen();else layout.classList.toggle('immersive-fallback');}catch{layout.classList.toggle('immersive-fallback');}update();}
$('immersiveFullscreen').addEventListener('click',toggle);
const original=$('fullscreenFarm');if(original)original.addEventListener('click',e=>{e.stopImmediatePropagation();toggle();},true);
$('immersiveMenu').addEventListener('click',()=>menu(drawer.hidden));$('immersiveClose').addEventListener('click',()=>menu(false));
document.addEventListener('fullscreenchange',update);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)menu(false);if(e.altKey&&e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();toggle();}});
update();
})();
