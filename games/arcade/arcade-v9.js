/* POLY SCOUT v9 — original run-and-gun stages, physics and stage editor data. */
(() => {
'use strict';
window.createPolyArcadeV9 = function(opts){
 const {ctx,W,H,heroes,getHero,getBoss,reset,bonusTicket,keys,canvas}=opts;
 const FLOOR=435,TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const LEVELS=[
  ['Лунный парк','🌙','#627d9a','#d9bf9d','#7d9b85','Лес фонарей'],
  ['Сад бумажных роз','🌸','#86a39a','#edc6ba','#b88b90','Цветочная тропа'],
  ['Часовая площадь','⏰','#7f80a3','#decaad','#8a818d','Башни и шестерни'],
  ['Грозовые крыши','⛈','#5c7990','#a2bed0','#7b9baf','Крыши театра'],
  ['Сахарный город','🍬','#c69299','#f7d6bd','#d8a3a4','Мармеладный мост'],
  ['Ледяные кулисы','❄','#6c98b1','#e8eff1','#a6c6d6','Хрустальное озеро'],
  ['Зеркальный лабиринт','🎩','#68617f','#c9a9c5','#9885a8','Фантомные зеркала'],
  ['Паровозное депо','🚂','#826f72','#d5b48c','#a28a7f','Железные вагоны'],
  ['Театр масок','🎭','#967b96','#e3b2bc','#c2a3b5','Коридор бального зала'],
  ['Чернильный дворец','👑','#554b6c','#a383a0','#806e90','Финальный коридор']
 ];
 const store='poly-arcade-levels-v9';let db={cleared:[],secrets:[],best:{}};try{const v=JSON.parse(localStorage.getItem(store)||'null');if(v){db={...db,...v};}}catch{}
 function persist(){try{localStorage.setItem(store,JSON.stringify(db));}catch{}}
 let level=-1,scene='off',runner=null,coins=[],creatures=[],platforms=[],hazards=[],particles=[],checkpoints=[],goalX=0,cam=0,frames=0,projectiles=[],shots=[],stars=0,levelStarted=0,stageLength=0,secret=null;
 let jumpLatch=false,dashWait=0,shootWait=0,inv=0,paused=false,anim=0;
 let endText='';
 const isActive=()=>level>=0;
 function unlocked(i){return i===0||db.cleared.includes(i-1);}
 function stageData(i){return LEVELS[i];}
 function setup(idx){level=clamp(idx,0,9);scene='play';paused=false;frames=0;anim=0;cam=0;stars=0;endText='';dashWait=0;shootWait=0;inv=0;stageLength=2850+level*180;goalX=stageLength-120;levelStarted=Date.now();
  runner={x:55,y:FLOOR-70,w:36,h:67,vx:0,vy:0,ground:true,jumps:0,face:1,hp:Math.min(7,3+Math.floor(level/4)+(getHero()?.hp>5?1:0)),maxHp:Math.min(7,3+Math.floor(level/4)+(getHero()?.hp>5?1:0)),walk:0,checkpoint:0};
  coins=[];creatures=[];platforms=[];hazards=[];particles=[];projectiles=[];shots=[];checkpoints=[];
  const n=14+level*2;for(let i=0;i<n;i++){const x=225+i*155+((i*37)%70);if(x>stageLength-210)break;
   if(i%3===0){const y=FLOOR-100-((i%4)*24);platforms.push({x:x-30,y,w:128,h:17,move:i%8===0?24:0,period:(i%5+2)*.012});}
   if(i%5===2)hazards.push({x,y:FLOOR-18,w:55,h:18,kind:i%2?'spikes':'puddle'});
   if(i%2===0)creatures.push({x:x+65,y:FLOOR-44,base:x+65,r:21,hp:1+Math.floor(level/5),speed:.7+level*.07,phase:i*1.6,hit:0,live:true});
   coins.push({x,y:(i%3===0?FLOOR-153-((i%4)*24):FLOOR-75),taken:false});
   if(i%4===1)coins.push({x:x+36,y:FLOOR-115,taken:false});
  }
  for(let i=1;i<4;i++)checkpoints.push(i*stageLength/4);
  secret={x:Math.round(stageLength*.61),y:FLOOR-180,taken:db.secrets.includes(level)};
  renderMap();canvas.focus();
 }
 function addParticle(x,y,col,count=10){for(let i=0;i<count;i++){const a=Math.random()*TAU,r=1+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*r,vy:Math.sin(a)*r-1,life:25+Math.random()*22,col,size:2+Math.random()*4});}}
 function hit(){if(inv>0||scene!=='play')return;runner.hp--;inv=75;addParticle(runner.x,runner.y+20,'#e58d90',18);runner.vy=-6;if(runner.hp<=0){scene='fail';endText='ПОПРОБУЙ ЕЩЁ!';}else{runner.x=Math.max(55,runner.checkpoint+10);runner.y=FLOOR-150;runner.vx=0;}}
 function fire(){if(scene!=='play'||shootWait>0)return;shootWait=10;shots.push({x:runner.x+(runner.face>0?35:-5),y:runner.y+32,vx:runner.face*14,life:70});addParticle(runner.x+20,runner.y+30,'#f4dfb0',3);}
 function physics(dt){if(paused||scene!=='play')return;frames+=dt;anim+=dt;inv=Math.max(0,inv-dt);shootWait=Math.max(0,shootWait-dt);dashWait=Math.max(0,dashWait-dt);
  const left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight'),wish=right?1:left?-1:0;
  runner.vx+=(wish*(5.0+(getHero()?.speed||1)*.6)-runner.vx)*Math.min(1,dt*.18);if(wish)runner.face=wish;
  const jump=keys.has('KeyW')||keys.has('ArrowUp');if(jump&&!jumpLatch&&(runner.ground||runner.jumps<(opts.getCharm?.()==='feather'?2:1))){runner.vy=-14.9;runner.ground=false;runner.jumps++;addParticle(runner.x+22,runner.y+runner.h,'#f3e1bc',8);}jumpLatch=jump;
  if(keys.has('KeyQ')&&dashWait<=0){runner.vx=runner.face*14;dashWait=65;inv=Math.max(inv,12);addParticle(runner.x,runner.y+38,'#bbe3ea',18);keys.delete('KeyQ');}
  if(keys.has('MouseFire'))fire();
  let prevY=runner.y;runner.vy+=.75*dt;runner.x=clamp(runner.x+runner.vx*dt,25,stageLength-60);runner.y+=runner.vy*dt;runner.ground=false;
  if(runner.y+runner.h>=FLOOR){if(prevY+runner.h<FLOOR-7&&runner.vy>5)addParticle(runner.x+19,FLOOR-4,'#f3d2af',14);runner.y=FLOOR-runner.h;runner.vy=0;runner.ground=true;runner.jumps=0;}
  for(const p of platforms){const yy=p.y+Math.sin(frames*p.period)*p.move;if(runner.vy>=0 && runner.x+runner.w>p.x&&runner.x<p.x+p.w && prevY+runner.h<=yy+10&&runner.y+runner.h>=yy){if(runner.vy>5)addParticle(runner.x+18,yy,'#f3ddad',7);runner.y=yy-runner.h;runner.vy=0;runner.ground=true;runner.jumps=0;}}
  if(runner.y>H+40){hit();runner.y=FLOOR-100;}
  runner.walk+=Math.abs(runner.vx)*dt*.09;
  for(let i=0;i<checkpoints.length;i++)if(runner.x>=checkpoints[i]&&runner.checkpoint<checkpoints[i]){runner.checkpoint=checkpoints[i];addParticle(runner.x,FLOOR-30,'#d7e9ac',23);}
  for(const c of coins){if(!c.taken&&Math.hypot(c.x-runner.x,c.y-(runner.y+24))<42){c.taken=true;stars++;addParticle(c.x,c.y,'#f4db86',9);}}
  if(!secret.taken&&Math.hypot(secret.x-runner.x,secret.y-(runner.y+24))<54){secret.taken=true;stars+=5;if(!db.secrets.includes(level)){db.secrets.push(level);bonusTicket(1);persist();}addParticle(secret.x,secret.y,'#e7e1ac',36);}
  for(const h of hazards)if(runner.x+runner.w>h.x+6&&runner.x<h.x+h.w-6&&runner.y+runner.h>h.y+4&&runner.y<h.y+h.h)hit();
  for(const e of creatures){if(!e.live)continue;e.x=e.base+Math.sin(frames*.016+e.phase)*55;
   if(Math.abs(e.x-runner.x)<37&&Math.abs(e.y-runner.y-18)<55)hit();
   if(level>3&&frames%Math.max(95,180-level*9)<dt&&Math.abs(e.x-runner.x)<530)projectiles.push({x:e.x,y:e.y+15,vx:Math.sign(runner.x-e.x)*3.6,life:145});
  }
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx*dt;s.life-=dt;
   for(const e of creatures){if(e.live&&Math.abs(e.x-s.x)<27&&Math.abs(e.y+18-s.y)<28){e.hp--;if(e.hp<=0){e.live=false;stars++;addParticle(e.x,e.y+10,'#edd4ab',16);}shots.splice(i,1);break;}}
   if(s.life<=0&&shots.includes(s))shots.splice(shots.indexOf(s),1);
  }
  for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx*dt;p.life-=dt;if(Math.hypot(p.x-runner.x,p.y-(runner.y+15))<29){hit();projectiles.splice(i,1);continue;}if(p.life<0)projectiles.splice(i,1);}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.13*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
  cam+=(clamp(runner.x-270,0,stageLength-W)-(cam))*.15*dt;
  if(runner.x>=goalX){scene='win';const first=!db.cleared.includes(level);if(first){db.cleared.push(level);bonusTicket(1);}const duration=Math.round((Date.now()-levelStarted)/1000),key=String(level);if(!db.best[key]||duration<db.best[key].seconds)db.best[key]={seconds:duration,stars};persist();renderMap();endText=first?'ОТЛИЧНЫЙ ДЕБЮТ!':'УРОВЕНЬ ПРОЙДЕН!';}
 }
 function rounded(x,y,w,h,r,fill,stroke='#564a57',line=3){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
 function paint(){if(level<0)return;
  const d=stageData(level),art=window.PolyCinemaArt;
  if(art)art.stage(ctx,{level,cam,frames,W,H,FLOOR});
  else {const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,d[2]);bg.addColorStop(1,d[3]);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#a8886e';ctx.fillRect(0,FLOOR,W,H-FLOOR);}
  for(const h of hazards){const x=h.x-cam;if(x<-100||x>W+50)continue;ctx.fillStyle=h.kind==='spikes'?'#99626b':'#87a9af';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x+i*h.w/4,FLOOR);ctx.lineTo(x+i*h.w/4+h.w/8,FLOOR-22);ctx.lineTo(x+(i+1)*h.w/4,FLOOR);ctx.fill();}}
  for(const p of platforms){const x=p.x-cam,y=p.y+Math.sin(frames*p.period)*p.move;if(x<-150||x>W+50)continue;if(art)art.platform(ctx,x,y,p.w,p.h,frames);else {rounded(x,y,p.w,p.h,7,'#cba779');ctx.fillStyle='#f2d1a0';ctx.fillRect(x+9,y+3,p.w-18,4);}}
  for(const x of checkpoints){const X=x-cam;if(X<-40||X>W+40)continue;ctx.fillStyle='#86665f';ctx.fillRect(X,FLOOR-115,6,115);ctx.fillStyle='#eec99d';ctx.beginPath();ctx.moveTo(X+5,FLOOR-115);ctx.lineTo(X+53,FLOOR-97);ctx.lineTo(X+5,FLOOR-77);ctx.fill();}
  for(const c of coins){if(c.taken)continue;const x=c.x-cam;if(x<-20||x>W+20)continue;ctx.fillStyle='#ead092';ctx.beginPath();ctx.ellipse(x,c.y,11,13,Math.sin(frames*.03)*.4,0,TAU);ctx.fill();ctx.strokeStyle='#8d735c';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#9d7d55';ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.fillText('✦',x,c.y+5);}
  if(!secret.taken){const x=secret.x-cam;if(x>-40&&x<W+40){ctx.fillStyle='#f3e4a2';ctx.font='38px Georgia';ctx.fillText('✶',x,secret.y+Math.sin(frames*.065)*8);}}
  for(const e of creatures){if(!e.live)continue;const x=e.x-cam;if(x<-40||x>W+40)continue;ctx.fillStyle='#4d4655';ctx.beginPath();ctx.ellipse(x,FLOOR+1,22,6,0,0,TAU);ctx.fill();if(art){art.mob(ctx,{x,y:e.y,frames,color:level%2?'#ca9eae':'#cba58b',kind:level});continue;}rounded(x-21,e.y-3,42,43,19,level%2?'#ca9eae':'#cba58b');ctx.fillStyle='#fff5e3';ctx.beginPath();ctx.ellipse(x-8,e.y+8,6,10,0,0,TAU);ctx.ellipse(x+8,e.y+8,6,10,0,0,TAU);ctx.fill();ctx.fillStyle='#53434c';ctx.beginPath();ctx.arc(x-7,e.y+9,2.7,0,TAU);ctx.arc(x+8,e.y+9,2.7,0,TAU);ctx.fill();}
  for(const s of shots){const x=s.x-cam;if(art)art.projectile(ctx,x,s.y,9,frames);else {ctx.fillStyle='#f8e4a7';ctx.beginPath();ctx.arc(x,s.y,8,0,TAU);ctx.fill();ctx.strokeStyle='#8a6b71';ctx.lineWidth=2;ctx.stroke();}}
  for(const p of projectiles){const x=p.x-cam;ctx.fillStyle='#bfa0b4';ctx.beginPath();ctx.arc(x,p.y,10,0,TAU);ctx.fill();}
  const gateX=goalX-cam;if(gateX>-130&&gateX<W+100){rounded(gateX,FLOOR-145,86,147,30,'#544760');rounded(gateX+12,FLOOR-127,64,128,24,'#af8ba4');ctx.fillStyle='#fff0ca';ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.fillText('БОСС',gateX+44,FLOOR-82);ctx.font='32px Georgia';ctx.fillText('✦',gateX+44,FLOOR-44);}
  if(runner && (inv<=0||Math.floor(frames/6)%2===0)){
   const X=runner.x-cam,Y=runner.y,b=Math.sin(runner.walk)*4;
   if(art)art.hero(ctx,{x:X,y:Y,w:runner.w||42,h:runner.h,walk:runner.walk,face:runner.face,heroId:opts.getHeroId?.()||0,body:getHero()?.body||'#79ad9d',head:getHero()?.head||'#f3d8b3',ground:runner.ground,frames,vx:runner.vx,vy:runner.vy,inv,shield:0});
   else {   const X=runner.x-cam,Y=runner.y,b=Math.sin(runner.walk)*4;
   ctx.save();ctx.translate(X+18,Y+runner.h);ctx.scale(runner.face,1);ctx.translate(-18,-runner.h);
   rounded(2,22+b,34,39,14,getHero()?.body||'#79ad9d');ctx.fillStyle='#f4ddbd';ctx.beginPath();ctx.ellipse(20,16+b,24,26,0,0,TAU);ctx.fill();ctx.strokeStyle='#57434f';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#514456';ctx.beginPath();ctx.ellipse(12,13+b,3.6,7,0,0,TAU);ctx.ellipse(28,13+b,3.6,7,0,0,TAU);ctx.fill();ctx.strokeStyle='#ae7e79';ctx.lineWidth=3;ctx.beginPath();ctx.arc(20,24+b,7,0,Math.PI);ctx.stroke();ctx.fillStyle='#3e4454';ctx.beginPath();ctx.ellipse(7,64+Math.sin(runner.walk)*5,13,8,0,0,TAU);ctx.ellipse(33,64-Math.sin(runner.walk)*5,13,8,0,0,TAU);ctx.fill();ctx.restore();}
  }
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/45);ctx.fillStyle=p.col;ctx.fillRect(p.x-cam,p.y,p.size,p.size);}ctx.globalAlpha=1;
  ctx.fillStyle='#312d43ab';ctx.fillRect(0,0,W,65);ctx.fillStyle='#fff4db';ctx.textAlign='left';ctx.font='bold 15px Georgia';ctx.fillText(d[1]+' УРОВЕНЬ '+(level+1)+'/10 · '+d[0],22,25);ctx.font='bold 19px Georgia';ctx.fillText('♥ '.repeat(runner.hp),22,52);ctx.font='bold 13px Georgia';ctx.fillText('✦ '+stars+'   ·   ЧЕКПОИНТ '+Math.floor(runner.checkpoint/(stageLength/4))+'/3',245,51);
  ctx.fillStyle='#68516a';ctx.fillRect(550,29,386,9);ctx.fillStyle='#e6c497';ctx.fillRect(550,29,386*Math.min(1,runner.x/goalX),9);
  ctx.font='12px Georgia';ctx.fillStyle='#fff6de';ctx.fillText('A/D — двигаться · W — прыгать · Q — рывок · ЛКМ — стрелять',550,57);
  if(art)art.film(ctx,{W,H,frames});
  ctx.save();ctx.globalAlpha=.04;for(let i=0;i<120;i++){ctx.fillStyle=i%2?'#fff':'#333';ctx.fillRect((i*149+Math.floor(frames)*7)%W,(i*71)%H,1,3);}ctx.restore();
  if(scene!=='play'){ctx.fillStyle='#232333b3';ctx.fillRect(0,0,W,H);rounded(180,121,600,293,35,'#ffedcb','#675065',7);ctx.fillStyle='#58404e';ctx.textAlign='center';ctx.font='bold 17px Georgia';ctx.fillText('POLY PICTURES · '+d[0],480,176);ctx.font='bold 41px Georgia';ctx.fillText(scene==='fail'?'ЗАНАВЕС!':scene==='pause'?'АНТРАКТ':endText,480,243);ctx.font='20px Georgia';ctx.fillText(scene==='win'?'✦ '+stars+' собранных звёзд · Босс ждёт':scene==='fail'?'Попробуй ещё раз, ты сможешь.':'Нажми P, чтобы продолжить',480,291);ctx.font='bold 15px Georgia';ctx.fillText(scene==='win'?'ENTER / НАЖМИ — ПЕРЕЙТИ К БОССУ':scene==='fail'?'ENTER / НАЖМИ — ПОВТОРИТЬ':'P — ПРОДОЛЖИТЬ',480,352);}
 }
 function draw(){ctx.save();paint();ctx.restore();}
 function exit(){level=-1;scene='off';keys.clear();}
 function endRun(){const finished=level;level=-1;scene='off';renderMap();reset(finished);}
 function enter(){if(scene==='win')endRun();else if(scene==='fail')setup(level);else if(scene==='pause'){paused=false;scene='play';}}
 function pauseForHidden(){keys.clear();if(level>=0&&scene==='play'){paused=true;scene='pause';}}
 function keydown(e){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyP'){if(scene==='play'||scene==='pause'){paused=!paused;scene=paused?'pause':'play';}return;}if(e.code==='Enter'){enter();return;}if(e.code==='Space'&&!e.repeat&&scene==='play'&&opts.getCharm?.()==='feather'&&!runner.ground){runner.vy=Math.min(runner.vy,-7);}if(e.code==='KeyR'&&!e.repeat&&scene==='play'){// secret focus burst: clears near bullets
  for(const p of [...projectiles])if(Math.abs(p.x-runner.x)<120){projectiles.splice(projectiles.indexOf(p),1);addParticle(p.x,p.y,'#e9bfcc',6);}
 }keys.add(e.code);}
 function pointerdown(){if(scene==='win'||scene==='fail'){enter();return;}if(scene==='play'){keys.add('MouseFire');fire();}}
 function pointerup(){keys.delete('MouseFire');}
 function touch(code,down){if(down){if(code==='MouseFire')fire();if(code==='Space')keys.add('KeyW');else keys.add(code);}else{keys.delete(code);if(code==='Space')keys.delete('KeyW');}}
 function renderMap(){const board=document.getElementById('v9LevelMap');if(!board)return;board.innerHTML=LEVELS.map((q,i)=>`<button type="button" class="v9-stage ${db.cleared.includes(i)?'cleared':''}" data-v9-stage="${i}" ${unlocked(i)?'':'disabled'}><span class="v10-stage-art v10-scene-${i}"><i>${q[1]}</i><b>${String(i+1).padStart(2,'0')}</b></span><strong>${q[0]}</strong><small>${db.cleared.includes(i)?'✓ ПРОЙДЕН':unlocked(i)?'ОТКРЫТ':'🔒 ЗАКРЫТ'}${db.best[i]?' · '+db.best[i].seconds+' сек':''}</small></button>`).join('');}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-v9-stage]');if(!b)return;const i=Number(b.dataset.v9Stage);if(!unlocked(i))return;setup(i);});
 renderMap();
 return {start:setup,exit,isActive,update:physics,draw,keydown,pointerdown,pointerup,touch,renderMap,enter,unlocked,pauseForHidden};
};
})();
