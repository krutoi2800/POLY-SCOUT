(() => {
'use strict';
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d'), $=id=>document.getElementById(id);
const W=960,H=540,FLOOR=435,keys=new Set(),sound=new PlaygroundAudio('arcade');
let v9Arcade=null,comboHits=0,comboTimer=0,comboPulse=0,bestCombo=0,motionFx=true;
let stage='intro',now=0,prev=performance.now(),hero,boss,shots=[],enemy=[],fx=[],buntings=[],clouds=[],attackWait=60,shootWait=0,shake=0,superCharge=0,mousedown=false,superBurst=0,winStars=[];
const BOSSES=[
 {name:'МАЭСТРО ЛУНАР',max:260,theme:'#d0bb98',act:'THE MOONLIGHT SHOW'},
 {name:'КОРОЛЕВА БУТОНОВ',max:310,theme:'#d99ca4',act:'THE BLOOMING GARDEN'},
 {name:'ЧАСОВОЙ БАРОН',max:350,theme:'#b19db5',act:'THE TICKING TOWER'},
 {name:'ГРОЗОВОЙ ДЖАЗ',max:390,theme:'#8aaabc',act:'THE THUNDER ENCORE'},
 {name:'МАРМЕЛАДНЫЙ ГРАФ',max:410,theme:'#dc9d8d',act:'THE SUGAR PARADE'},
 {name:'СНЕЖНАЯ ПРИМА',max:450,theme:'#9bbbc9',act:'THE FROST WALTZ'},
 {name:'ТЕНЕВОЙ ФОКУСНИК',max:490,theme:'#9986ad',act:'THE PHANTOM MIRROR'},
 {name:'ГЕНЕРАЛ ПАРОВОЗ',max:540,theme:'#b7a180',act:'THE IRON EXPRESS'},
 {name:'МАРКИЗА МАСКАРАДА',max:710,theme:'#c6a3ad',act:'THE SILK BALLROOM'},
 {name:'КОРОЛЬ ЧЕРНИЛ',max:970,theme:'#80677f',act:'THE FINAL MIDNIGHT',phases:3}
];
const HEROES=[
 {name:'Люми',desc:'Сбалансированный · 5 ♥',hp:5,body:'#75aa98',head:'#f4d8a0',speed:1,bonus:1,ultra:'Сияющая комета'},
 {name:'Искра',desc:'Быстрая · 4 ♥',hp:4,body:'#d58d9d',head:'#f4e1c9',speed:1.25,bonus:1,ultra:'Фейерверк'},
 {name:'Росток',desc:'Выносливый · 6 ♥',hp:6,body:'#8eb689',head:'#e1efbc',speed:.87,bonus:.86,ultra:'Цветущая буря'},
 {name:'Механик',desc:'Мощный · 5 ♥',hp:5,body:'#a6a3cc',head:'#e1d4bd',speed:.96,bonus:1.25,ultra:'Механический залп'},
 {name:'Акварель',desc:'Щит · 5 ♥',hp:5,body:'#8fbeca',head:'#f0d9c4',speed:1.07,bonus:.95,ultra:'Радужное облако'},
 {name:'Блик',desc:'Ловкий · 4 ♥',hp:4,body:'#d4a9a0',head:'#f6dbb1',speed:1.32,bonus:1.04,ultra:'Каскад искр'}
];
let heroId=0,selectedBoss=0,weapon='star',costume='#75aa98',cleared=new Set(),tickets=0,ownedCharms=['none'],charm='none';
const CHARMS=[
 {id:'none',name:'Без талисмана',icon:'○',cost:0,desc:'Честный вызов без бонусов'},
 {id:'heart',name:'Сердце театра',icon:'♥',cost:2,desc:'+1 сердечко в бою'},
 {id:'quick',name:'Скоростная перчатка',icon:'✶',cost:3,desc:'На 25% чаще выстрелы'},
 {id:'feather',name:'Перо акробата',icon:'🪶',cost:5,desc:'Двойной прыжок в воздухе'},
 {id:'charge',name:'Звёздный магнит',icon:'✦',cost:6,desc:'Быстрее заряжается ульта'},
 {id:'parry',name:'Розовый зонтик',icon:'☂',cost:8,desc:'Отражение захватывает больше снарядов'}
];

try{const saved=JSON.parse(localStorage.getItem('poly-arcade-v5')||'null');if(saved){selectedBoss=Math.max(0,Math.min(BOSSES.length-1,Number(saved.selectedBoss)||0));heroId=Math.max(0,Math.min(HEROES.length-1,Number(saved.heroId)||0));costume=saved.costume||costume;cleared=new Set(saved.cleared||[]);tickets=Number.isFinite(saved.tickets)?saved.tickets:cleared.size*2;ownedCharms=Array.isArray(saved.ownedCharms)?saved.ownedCharms:['none'];charm=ownedCharms.includes(saved.charm)?saved.charm:'none';}}catch{}
function persist(){try{localStorage.setItem('poly-arcade-v5',JSON.stringify({selectedBoss,heroId,costume,cleared:[...cleared],tickets,ownedCharms,charm}));}catch{}}
function syncSelectors(){document.querySelectorAll('[data-boss]').forEach(el=>el.classList.toggle('active',+el.dataset.boss===selectedBoss));document.querySelectorAll('[data-weapon]').forEach(el=>el.classList.toggle('active',el.dataset.weapon===weapon));document.querySelectorAll('[data-costume]').forEach(el=>el.classList.toggle('active',el.dataset.costume===costume));document.querySelectorAll('[data-hero]').forEach(el=>el.classList.toggle('active',+el.dataset.hero===heroId));if($('heroSelected'))$('heroSelected').textContent=HEROES[heroId].name+' · '+HEROES[heroId].ultra+' · '+(CHARMS.find(q=>q.id===charm)?.name||'');if($('ticketsLabel'))$('ticketsLabel').textContent=tickets;const el=$('bossProgress');if(el)el.innerHTML=BOSSES.map((b,i)=>'<span class="'+(cleared.has(i)?'done':'')+'">'+(cleared.has(i)?'✓':'○')+' ACT '+(i+1)+'</span>').join('');}
function chooseWeapon(id){if(!['star','spread','heavy','needle'].includes(id))return;weapon=id;syncSelectors();}
const TAU=Math.PI*2, rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),held=(...code)=>code.some(s=>keys.has(s));
function reset(index=selectedBoss){if(v9Arcade?.isActive())v9Arcade.exit();comboHits=0;comboTimer=0;comboPulse=0;selectedBoss=clamp(index,0,BOSSES.length-1);const def=BOSSES[selectedBoss];hero={x:150,y:FLOOR-73,w:45,h:73,vx:0,vy:0,face:1,ground:true,duck:false,hp:HEROES[heroId].hp+(charm==='heart'?1:0),jumps:0,jumpLatch:false,inv:0,walk:0,flash:0,dash:0,dashCooldown:0,shield:0,shieldCooldown:0,parryCooldown:0};boss={x:784,y:219,hp:def.max,max:def.max,hit:0,phase:1};shots=[];enemy=[];fx=[];winStars=[];superCharge=0;superBurst=0;shootWait=0;attackWait=74;shake=0;stage='playing';$('playBtn').textContent='НАЧАТЬ ЗАНОВО ↻';persist();syncSelectors();hud();canvas.focus();}
function hud(){if(!hero||!boss)return;const combo=$('comboLabel');if(combo){combo.textContent=comboHits>=3?'✶ СЕРИЯ '+comboHits+' · ЛУЧШАЯ '+bestCombo:'✦ СЕРИЯ '+comboHits;combo.classList.toggle('hot',comboHits>=8);} $('livesLabel').textContent='♥ '.repeat(hero.hp).trim()||'♡';$('bossLabel').textContent=BOSSES[selectedBoss].name+': '+Math.ceil(boss.hp/boss.max*100)+'%';$('specialFill').style.width=superCharge+'%';$('specialLabel').textContent=Math.ceil(superCharge)+'%';$('actionStatus').textContent=stage==='win'?'BRAVO!':stage==='intermission'?'NEXT ACT READY':stage==='pause'?'PAUSE':superCharge>=100?'✦ СУПЕР ГОТОВ — ПРОБЕЛ':stage==='playing'?'ACT '+String(selectedBoss+1).padStart(2,'0')+' / '+BOSSES[selectedBoss].act+(selectedBoss===9?' · ФАЗА '+boss.phase+'/3':''):'READY FOR THE SHOW';}
function burst(x,y,color,count=14,power=5){if(fx.length>460)fx.splice(0,fx.length-360);for(let i=0;i<(motionFx?count:Math.ceil(count*.4));i++){const a=rnd(0,TAU),spd=rnd(.5,power);fx.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-rnd(0,2),r:rnd(2,6),life:rnd(14,36),color,spin:rnd(-.22,.22)});}}
function shoot(){
 if(stage!=='playing'||shootWait>0)return;
 const sourceX=hero.x+hero.face*28,sourceY=hero.y+(hero.duck?47:30),targetX=boss.x-20,targetY=boss.y+15;
 const dx=targetX-sourceX,dy=targetY-sourceY,angle=Math.atan2(dy,dx);
 hero.face=sourceX<boss.x?1:-1;
 const count=weapon==='spread'?3:1,spd=weapon==='heavy'?9.5:weapon==='needle'?21:14;
 for(let i=0;i<count;i++){
  const a=angle+(i-(count-1)/2)*(weapon==='spread'?.19:0);
  shots.push({x:sourceX,y:sourceY,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r:weapon==='heavy'?18:weapon==='spread'?8:10,damage:(weapon==='heavy'?13:weapon==='spread'?3:weapon==='needle'?3.4:5)*HEROES[heroId].bonus,rot:0,life:110,ultra:false,kind:weapon});
 }
 shootWait=(weapon==='heavy'?17:weapon==='spread'?13:weapon==='needle'?4:7)*(charm==='quick'?.75:1);
 hero.flash=5;burst(sourceX,sourceY,'#f5e6a3',4,2.4);sound.effect('shot');
}
function dash(){if(stage!=='playing'||hero.dashCooldown>0)return;hero.dash=heroId===5?19:13;hero.inv=Math.max(hero.inv,heroId===5?19:14);hero.dashCooldown=heroId===5?93:125;hero.vx=hero.face*17;burst(hero.x+20,hero.y+45,'#a5e3de',17,5);sound.effect('jump');hud();}
function shield(){if(stage!=='playing'||hero.shieldCooldown>0)return;hero.shield=heroId===4?180:110;hero.shieldCooldown=heroId===4?350:390;burst(hero.x+20,hero.y+31,'#a2d4e8',15,4);sound.effect('ult');hud();}
function parry(){if(stage!=='playing'||hero.parryCooldown>0)return;hero.parryCooldown=205;const hx=hero.x+25,hy=hero.y+31;let caught=0;for(let i=enemy.length-1;i>=0;i--){const b=enemy[i];if(Math.hypot(b.x-hx,b.y-hy)<(charm==='parry'?265:185)){burst(b.x,b.y,'#f4b5d0',10,4);enemy.splice(i,1);caught++;}}superCharge=Math.min(100,superCharge+caught*(charm==='charge'?20:12));if(caught){hero.inv=Math.max(hero.inv,14);boss.hp=Math.max(1,boss.hp-caught*2);sound.effect('ult');}else sound.effect('shot');burst(hx,hy,caught?'#ffccd9':'#bee8e5',28,5);hud();}
function ultimate(){if(stage!=='playing'||superCharge<100)return;superCharge=0;superBurst=55;shake=9;enemy=[];hero.inv=Math.max(58,hero.inv);
 const mode=heroId, count=[11,18,15,9,16,23][mode], spread=[.07,.105,.072,.05,.095,.085][mode];
 if(mode===2){hero.hp=Math.min(HEROES[heroId].hp,hero.hp+2);burst(hero.x+22,hero.y+20,'#c5ec9e',36,6);}
 for(let i=0;i<count;i++){const theta=(i-(count-1)/2)*spread,dx=boss.x-hero.x,dy=boss.y-(hero.y+35),a=Math.atan2(dy,dx)+theta;
 shots.push({x:hero.x+30,y:hero.y+35,vx:Math.cos(a)*(mode===3?21:18),vy:Math.sin(a)*(mode===3?21:18),r:mode===3?27:mode===1?16:20,rot:i,life:115,ultra:true,damage:[11,8.5,7,17,9.4,8.5][mode]});}
 burst(hero.x+20,hero.y+10,['#ffe3a0','#f6a9a5','#c3f2a9','#bdc4ee','#9de8ec','#ffbb91'][mode],55,10);sound.effect('ult');hud();}
function addCombo(){comboHits++;comboTimer=150;bestCombo=Math.max(bestCombo,comboHits);if(comboHits>=8&&comboHits%8===0){comboPulse=42;superCharge=Math.min(100,superCharge+9);burst(boss.x-30,boss.y+35,'#fff0c3',16,7);}}
function damage(){if(hero.inv>0||stage!=='playing')return;comboHits=0;comboTimer=0;hero.hp--;hero.inv=86;hero.vy=-8.6;hero.vx=-4;shake=10;burst(hero.x+20,hero.y+30,'#ff8f81',23,6);sound.effect('lose');if(hero.hp<=0){stage='lose';mousedown=false;$('playBtn').textContent='ЕЩЁ ОДИН ДУБЛЬ ↻';}hud();}
function enemyAttack(){
 const type=selectedBoss,phase=boss.phase;
 if(type===0){
  const low=phase===2&&Math.random()<.55;
  if(low){for(let i=0;i<3;i++)enemy.push({x:boss.x-90,y:FLOOR-26-i*8,vx:-rnd(5,6.1),vy:0,r:13,type:'ground',life:220});}
  else{for(let i=0;i<(phase===2?3:2);i++){const targetY=i%2?FLOOR-28:FLOOR-59;const dy=(targetY-(boss.y+25))/(boss.x-hero.x),speed=rnd(4.5,6);enemy.push({x:boss.x-76,y:boss.y+26+i*12,vx:-speed,vy:dy*-speed,r:i%2?11:14,type:'orb',life:220});}}
 }else if(type===1){
  // Blossoms sweep in low arcs; late phase also sends falling petals.
  for(let i=0;i<(phase===2?6:4);i++)enemy.push({x:boss.x-45-i*15,y:boss.y+30+i*9,vx:-rnd(3.3,5.2),vy:(i%2?.8:-.9),r:11,type:'petal',life:240,wave:rnd(0,7)});
 }else if(type===2){
  // Three lanes of mechanical clockwork discs.
  for(let i=0;i<(phase===2?5:3);i++)enemy.push({x:boss.x-55+i*18,y:FLOOR-[24,72,121,40,95][i],vx:-rnd(4.8,7.3),vy:0,r:17,type:'gear',life:230,wave:i});
 }else if(type===3){
    // Thundercloud rains falling drops over the stage, telegraphed by the bright streaks.
  for(let i=0;i<(phase===2?9:6);i++){
    const x=75+Math.random()*700;
    enemy.push({x,y:-60-i*18,vx:rnd(-.35,.35),vy:rnd(4,6.3),r:i%4===0?18:9,type:i%4===0?'bolt':'rain',life:210});
  }
 }else if(type===4){
  // Marmalade lord: drifting candy drops which bounce along the floor.
  for(let i=0;i<(phase===2?8:5);i++)enemy.push({x:boss.x-48-i*22,y:boss.y+15+(i%3)*19,vx:-rnd(3.6,5.2),vy:-rnd(1.1,3),r:13,type:'candy',life:260,bounces:0});
 }else if(type===5){
  // Ice ballerina: mirrored low snowballs and falling snow crystals.
  for(let i=0;i<(phase===2?7:4);i++)enemy.push({x:boss.x-35-i*23,y:i%2?FLOOR-27:FLOOR-88,vx:-rnd(4.8,6.4),vy:i%2?0:rnd(-.8,.8),r:12,type:'snow',life:220});
 }else if(type===6){
  // Phantom magician: staggered card-like projectiles.
  for(let i=0;i<(phase===2?7:4);i++)enemy.push({x:boss.x-60+(i%2)*25,y:110+i*41,vx:-rnd(5,7.2),vy:Math.sin(i)*.55,r:14,type:'card',life:235,wave:i});
 }else if(type===7){
  // Locomotive general: bouncing brass bolts and steady steam puffs.
  for(let i=0;i<(phase===2?8:5);i++)enemy.push({x:boss.x-50-i*25,y:boss.y+45,vx:-rnd(4.1,6.2),vy:-rnd(1,4),r:i%2?11:17,type:i%2?'steam':'bolt',life:250,bounces:0});
 }else if(type===8){
  // Masquerade: silk ribbons arc from the ceiling and dancing masks sweep the lower lanes.
  for(let i=0;i<(phase>=2?9:6);i++){
   const y=100+(i%4)*70;
   enemy.push({x:boss.x-85+i*12,y,vx:-rnd(4.3+type*.12,6.6+type*.12),vy:Math.sin(i*1.7)*.8,r:12,type:i%3?'ribbon':'mask',wave:i*2.1,life:260});
  }
  if(phase>=2)for(let i=0;i<4;i++)enemy.push({x:120+i*170,y:-60-i*35,vx:.1,vy:4.4+i*.2,r:15,type:'spotlight',life:250});
 }else if(type===9){
  // Final, increasingly difficult three-phase attack with clear bullet silhouettes.
  const count=phase===3?13:phase===2?10:7;
  for(let i=0;i<count;i++){
    const a=(i-(count-1)/2)*(.092+(phase===3?.015:0));
    const dx=hero.x-(boss.x-74),dy=hero.y+20-(boss.y+12),base=Math.atan2(dy,dx);
    const speed=(phase===3?7.5:phase===2?6.5:5.5)+i*.09;
    enemy.push({x:boss.x-92,y:boss.y+20,vx:Math.cos(base+a)*speed,vy:Math.sin(base+a)*speed,r:i%4===0?17:12,type:i%2?'ink':'starfall',wave:i,life:225});
  }
  for(let i=0;i<(phase===3?6:phase===2?4:2);i++){
    const x=120+i*(phase===3?125:180);
    enemy.push({x,y:-60-i*24,vx:rnd(-.4,.4),vy:5.8+i*.25,r:12,type:'ink',life:210});
  }
  if(phase===3)for(let i=0;i<4;i++)enemy.push({x:boss.x-100-i*16,y:FLOOR-27,vx:-rnd(6.4,8.4),vy:0,r:13,type:'ground',life:180});
 }
 burst(boss.x-72,boss.y+38,BOSSES[selectedBoss].theme,12,3.5);
 attackWait=[92,95,88,84,98,93,89,83,81,76][type]*(phase===1?1:phase===2?.73:.57)*(1-type*.025);
}
function update(dt){now+=dt;if(comboTimer>0&&stage==='playing'){comboTimer-=dt;if(comboTimer<=0){comboHits=0;hud();}}comboPulse=Math.max(0,comboPulse-dt);for(const cloud of clouds){cloud.x-=cloud.s*dt*.33;if(cloud.x<-180)cloud.x=W+170;}
 for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.14*dt;p.life-=dt;if(p.life<=0)fx.splice(i,1);}
 if(stage!=='playing')return;
 hero.inv=Math.max(0,hero.inv-dt);hero.dash=Math.max(0,hero.dash-dt);hero.dashCooldown=Math.max(0,hero.dashCooldown-dt);hero.shield=Math.max(0,hero.shield-dt);hero.shieldCooldown=Math.max(0,hero.shieldCooldown-dt);hero.parryCooldown=Math.max(0,hero.parryCooldown-dt);hero.flash=Math.max(0,hero.flash-dt);boss.hit=Math.max(0,boss.hit-dt);shootWait=Math.max(0,shootWait-dt);superBurst=Math.max(0,superBurst-dt);shake=Math.max(0,shake-.8*dt);
 const left=held('KeyA','ArrowLeft'),right=held('KeyD','ArrowRight');hero.duck=held('KeyS','ArrowDown')&&hero.ground;
 if(left)hero.face=-1;if(right)hero.face=1;
 const desired=((right?1:0)-(left?1:0))*HEROES[heroId].speed;
 if(hero.dash>0){hero.vx=hero.face*17;}else hero.vx+=(desired*(hero.duck?2.25:5.8)-hero.vx)*Math.min(1,.19*dt);
 if(hero.duck)hero.vx*=.72;
 const wantJump=held('KeyW','ArrowUp');if(wantJump&&!hero.jumpLatch&&!hero.duck&&(hero.ground||(charm==='feather'&&hero.jumps<2))){hero.vy=hero.ground?-15.3:-13.8;hero.ground=false;hero.jumps++;burst(hero.x+20,FLOOR,'#f3d3a2',10,3.6);sound.effect('jump');}hero.jumpLatch=wantJump;
 hero.vy+=.76*dt;hero.x=clamp(hero.x+hero.vx*dt,30,690);hero.y+=hero.vy*dt;
 if(hero.y>=FLOOR-hero.h){hero.y=FLOOR-hero.h;hero.vy=0;hero.ground=true;hero.jumps=0;}
 hero.walk+=Math.abs(hero.vx)*dt*.16+.05*dt;
 if(mousedown||held('MouseFire'))shoot();
 boss.y=192+26*Math.sin(now*.025);boss.phase=(selectedBoss===9&&boss.hp<boss.max*.28)?3:boss.hp<boss.max*.53?2:1;
 attackWait-=dt;if(attackWait<=0)enemyAttack();
 for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.rot+=.15*dt;
  if(Math.hypot(s.x-(boss.x-1),s.y-(boss.y+25)) < (s.ultra?91:81)){
   boss.hp=Math.max(0,boss.hp-(s.ultra?(s.damage||11):(s.damage||5)));addCombo();boss.hit=7;shake=s.ultra?7:2.6;burst(s.x,s.y,s.ultra?'#fff3a3':'#f8d07d',s.ultra?12:5,4);if(motionFx&&s.ultra)burst(s.x,s.y,'#fffaf1',24,8);shots.splice(i,1);if(!s.ultra)superCharge=Math.min(100,superCharge+(charm==='charge'?6.2:3.5));
   if(boss.hp<=0){if(!cleared.has(selectedBoss)){tickets+=2+Math.floor(selectedBoss/3);}cleared.add(selectedBoss);persist();syncSelectors();drawCharms();stage=selectedBoss===BOSSES.length-1?'win':'intermission';mousedown=false;shake=18;burst(boss.x,boss.y,'#ffe59a',105,11);$('playBtn').textContent=stage==='intermission'?'СЛЕДУЮЩИЙ БОСС →':'СЫГРАТЬ ЕЩЁ ✦';}hud();continue;
  }if(s.life<0||s.x>W+40||s.y<0)shots.splice(i,1);
 }
 for(let i=enemy.length-1;i>=0;i--){const p=enemy[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.type==='ribbon'||p.type==='ink')p.y+=Math.sin(now*.06+(p.wave||0))*.66*dt;if(p.type==='petal')p.y+=Math.sin(now*.08+(p.wave||0))*.9*dt;if(p.type==='gear'||p.type==='card')p.y+=Math.cos(now*.045+(p.wave||0))*0.55*dt;if((p.type==='candy'||p.type==='bolt')&&p.y+p.r>=FLOOR&&p.vy>0){p.y=FLOOR-p.r;p.vy=-(p.bounces++<2?6:2.5);}if(p.type==='candy'||p.type==='bolt'){p.vy+=.22*dt;}p.life-=dt;
  const duckTop=hero.duck?hero.y+42:hero.y+3,heroTop=duckTop,heroBottom=hero.y+hero.h;
  if(hero.inv===0 && p.x+p.r>hero.x+1&&p.x-p.r<hero.x+hero.w-1&&p.y+p.r>heroTop&&p.y-p.r<heroBottom){enemy.splice(i,1);if(hero.shield>0){burst(p.x,p.y,'#97deea',12,4);sound.effect('shot');}else damage();continue;}
  if(p.life<0||p.x<-50||p.y>H+40||p.y<-190)enemy.splice(i,1);
 }
 if(Math.floor(now)%35===0&&Math.random()<.1)burst(rnd(0,W),rnd(90,280),'#fff8e7',2,1);
}
const outline='#373042';
function path(d,fill,stroke=outline,lw=4){ctx.beginPath();d(ctx);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}}
function ellipse(x,y,rx,ry,fill,stroke=null,lw=3){path(g=>g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,TAU),fill,stroke,lw);}
function circle(x,y,r,fill,stroke=null,lw=3){ellipse(x,y,r,r,fill,stroke,lw);}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function curve(points,stroke='#4d3a42',lw=4){path(g=>{g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i+=3){if(points[i+2])g.bezierCurveTo(...points[i],...points[i+1],...points[i+2]);}},null,stroke,lw);}
function star(x,y,r,col,ang=0,stroke=outline){path(g=>{for(let i=0;i<10;i++){const a=ang-Math.PI/2+i*Math.PI/5,R=i%2?r*.48:r;const px=x+Math.cos(a)*R,py=y+Math.sin(a)*R;i===0?g.moveTo(px,py):g.lineTo(px,py);}g.closePath();},col,stroke,2.5);}
function background(){const sky=ctx.createLinearGradient(0,0,0,H);const skies=[['#7f97a0','#b9c7b5','#f2dcb5','#ebbd93'],['#88a79a','#cfdbb1','#f6d6cc','#d5a3b4'],['#767b96','#b8acb7','#edd7bf','#c8b8b0'],['#526f8e','#859cae','#ced6ce','#acb9bb'],['#d39e93','#f3c9ad','#f8e6bc','#d4a48a'],['#64889e','#b3cdd1','#e6edef','#99c5cf'],['#63617c','#9584a7','#d6bdc3','#917b99'],['#897e80','#b7aca0','#dbceb3','#a98e71'],['#7f7791','#cfacc0','#f0d7ca','#b87f94'],['#332f50','#5b4a70','#b48a9f','#6d526b']][selectedBoss];sky.addColorStop(0,skies[0]);sky.addColorStop(.45,skies[1]);sky.addColorStop(.82,skies[2]);sky.addColorStop(1,skies[3]);rect(0,0,W,H,sky);
 // Each act paints a visibly different original theater set.
 if(selectedBoss===4){for(let i=0;i<14;i++){const x=i*82+Math.sin(i*4)*10,y=312+Math.sin(i*13)*16;ellipse(x,y,40,60,'#efb2a7','#b78688',2);ellipse(x-9,y-10,20,25,'#fbe5cd');}for(let i=0;i<8;i++)star(50+i*128,88+Math.sin(i*8)*27,9,'#fff4d1',now*.02);}
 if(selectedBoss===5){for(let i=0;i<18;i++){const x=i*59;path(g=>{g.moveTo(x,350);g.lineTo(x+24,205-(i%3)*28);g.lineTo(x+52,351);g.closePath();},i%2?'#dce9e9':'#b1d1d9','#82acb6',2);}for(let i=0;i<32;i++)star(i*32,50+(i%5)*35,3,'#ffffff',now*.004);}
 if(selectedBoss===6){for(let i=0;i<9;i++){const x=75+i*110;path(g=>{g.moveTo(x,345);g.lineTo(x+10,170);g.lineTo(x+65,168);g.lineTo(x+78,345);g.closePath();},'#796b86','#3e4359',3);ellipse(x+39,221,20,34,'#c6b1c9','#554f69',3);}for(let i=0;i<7;i++)star(110+i*137,90,15,'#e8c5cc',now*.008);}
 if(selectedBoss===7){for(let i=0;i<8;i++){const x=i*145-50;rect(x,250,112,100,'#8b766f');rect(x+8,264,95,12,'#c3ad8b');circle(x+18,345,27,'#4f5661','#c4af91',5);circle(x+95,345,27,'#4f5661','#c4af91',5);}for(let i=0;i<15;i++)ellipse((i*143+now*.35)%W,90+(i%4)*27,34,16,'#e2d2c3');}
 if(selectedBoss===8){for(let i=0;i<9;i++){const x=i*132-40;path(g=>{g.moveTo(x,340);g.lineTo(x+33,185);g.lineTo(x+88,185);g.lineTo(x+119,340);g.closePath();},i%2?'#ac8aa5':'#b9a7b7','#765b81',3);ellipse(x+70,238,23,34,'#efdae1','#765c7c',3);}}
 if(selectedBoss===9){for(let i=0;i<12;i++){const x=i*95-15;rect(x,240,78,120,i%2?'#5b476b':'#684c76');rect(x+12,252,51,6,'#a88194');star(x+42,199,12,'#e7beac',now*.018);}for(let i=0;i<14;i++){const x=i*80+Math.sin(now*.013+i)*6;ellipse(x,380,35,14,'#3b3654');}}
 // faded decorative poster rays
 ctx.save();ctx.globalAlpha=.10;for(let i=0;i<25;i++){const a=i*TAU/25+now*.00007;path(g=>{g.moveTo(755,183);g.lineTo(755+Math.cos(a)*1250,183+Math.sin(a)*1250);g.lineTo(755+Math.cos(a+.075)*1250,183+Math.sin(a+.075)*1250);g.closePath();},'#fff4d3',null);}ctx.restore();
 // Golden painted moon, in the scenery, distinct from the villain.
 circle(798,163,122,'#f8ecd3','#e6d3b8',4);circle(764,125,10,'#d9caa9');ellipse(843,182,16,9,'#ddd0ad');circle(823,105,8,'#d9caa9');
 for(let i=0;i<6;i++){const x=i*230-70-now*(.03+(i%3)*.016)%220;ellipse(x+20,205+(i%3)*33,96,25,'#f1e7d0');ellipse(x-11,194+(i%3)*33,42,34,'#f1e7d0');ellipse(x+40,186+(i%3)*33,58,33,'#f1e7d0');}
 // layered gouache landscape with ink border
 path(g=>{g.moveTo(0,360);g.bezierCurveTo(140,260,220,354,320,317);g.bezierCurveTo(500,236,604,329,785,280);g.lineTo(W,320);g.lineTo(W,H);g.lineTo(0,H);g.closePath();},'#74918b','#5c7975',3);
 path(g=>{g.moveTo(0,397);g.bezierCurveTo(220,301,305,402,480,358);g.bezierCurveTo(645,316,770,390,W,326);g.lineTo(W,H);g.lineTo(0,H);g.closePath();},'#9aab8d','#718e7d',3);
 for(let i=0;i<13;i++){const x=i*88+20,yy=376+Math.sin(i*8)*18;drawTree(x,yy,.7+(i%3)*.21);}
 // Stage: irregular wooden planks and scalloped apron
 rect(0,FLOOR-3,W,11,'#414f4d');rect(0,FLOOR+8,W,H-FLOOR,'#c4956e');rect(0,FLOOR+22,W,7,'#825e54');
 for(let i=0;i<22;i++){const y=FLOOR+36+i*15;ctx.globalAlpha=.27;curve([[0,y],[270,y-12],[520,y+15],[960,y-8]],'#6a4f46',2);ctx.globalAlpha=1;}
 for(let i=0;i<32;i++){const x=i*31+8;circle(x,FLOOR+18,3,'#e8c79f');}
 for(let i=0;i<11;i++){const x=40+i*92;drawFlower(x,FLOOR+3,.7+(i%3)*.14);}
 // decorative velvet stage border + string lights
 rect(0,0,W,14,'#4e3b51');for(let i=0;i<17;i++){const x=i*61+10;path(g=>{g.moveTo(x-15,14);g.quadraticCurveTo(x+12,54+(i%2)*9,x+43,14);},null,'#5a4253',7);circle(x+10,43+(i%2)*9,3,'#faedb4');}
 for(let i=0;i<13;i++){const x=i*84+5,y=38+Math.sin(i*1.9)*6;path(g=>{g.moveTo(x,y);g.lineTo(x+20,y+33);g.lineTo(x+43,y);g.closePath();},['#d58477','#e4be89','#87ad9c'][i%3],'#8f6c66',1);}
 // old film scratches/grain: deterministic, subtle
 ctx.save();ctx.globalAlpha=.1;for(let i=0;i<110;i++){const x=(i*313+Math.floor(now*.08)*13)%W,y=(i*179)%H;rect(x,y,i%4?1:2,i%4?2:4,'#58463e');}ctx.restore();
}
function drawTree(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);path(g=>{g.moveTo(-8,0);g.quadraticCurveTo(2,-45,-12,-95);g.lineTo(13,-98);g.quadraticCurveTo(9,-50,12,0);g.closePath();},'#785b55','#5a5652',3);for(const [a,b,r] of [[0,-115,38],[-30,-85,36],[27,-85,39],[-10,-140,33]])circle(a,b,r,'#77917f','#536e66',3);circle(20,-114,6,'#c8b68b');ctx.restore();}
function drawFlower(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);curve([[0,0],[-6,-16],[3,-25],[0,-37]],'#5d816b',3);for(let i=0;i<6;i++){const a=i*TAU/6;ellipse(Math.cos(a)*8,-37+Math.sin(a)*8,7,9,'#e2b4a6','#6f675b',1.5);}circle(0,-37,6,'#e4ce89','#6f675b',1.5);ctx.restore();}
function glove(x,y,rot=0,s=1){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);path(g=>{g.moveTo(-10,7);g.bezierCurveTo(-20,-9,-5,-18,0,-9);g.bezierCurveTo(12,-23,21,-8,9,-2);g.bezierCurveTo(23,4,10,20,-4,15);g.closePath();},'#fff8e5',outline,3.6);curve([[-7,3],[-3,0],[3,2],[7,4]],'#c9bba9',2);ctx.restore();}
function drawHero(){if(!hero)return;const h=hero;if(h.inv>0&&Math.floor(now/4)%2===0)return;
 const bounce=h.ground?Math.sin(h.walk*2.3)*Math.min(4,Math.abs(h.vx)):0,step=Math.sin(h.walk*2.1)*Math.min(10,Math.abs(h.vx)*1.8);
 ctx.save();ctx.translate(h.x+h.w/2,h.y+h.h);ctx.scale(h.face,1);const crouch=h.duck?.69:1;ctx.scale(1,crouch);ctx.translate(-h.w/2,-h.h);
 // Large squishy shoes with dark thick cartoon outlines
 ellipse(13,FLOOR-h.y-3,16,4,'#28304244');
 for(const [x,o] of [[8,step],[33,-step]]){path(g=>{g.moveTo(x-6,52);g.quadraticCurveTo(x+2,69,x-4,70+o);g.lineTo(x+8,70+o);g.lineTo(x+12,50);},'#352f48',outline,3);ellipse(x+2,69+o,15,7,'#e7a15a',outline,3.7);curve([[x-7,68+o],[x+2,66+o],[x+8,66+o],[x+12,69+o]],'#f5d5a0',1.6);}
 // jacket/teal body
 path(g=>{g.moveTo(4,27+bounce);g.bezierCurveTo(0,45,2,55,8,58);g.bezierCurveTo(18,65,41,60,44,48);g.lineTo(39,27+bounce);g.closePath();},costume,outline,5);path(g=>{g.moveTo(21,36);g.lineTo(25,55);},null,'#f9e9c4',3.5);circle(24,49,2.6,'#fff0bf');
 // arms rubber hose and mitten hands
 curve([[8,36],[1,42],[-12,47],[-13,35]],outline,7);glove(-15,34,-.2,.95);
 curve([[37,38],[50,32],[53,28],[59,25]],outline,7);glove(62,24,.25,1);
 // head: cream-colored living little lantern (not a cup)
 path(g=>{g.moveTo(9,6+bounce);g.bezierCurveTo(8,-18,19,-24,30,-15);g.bezierCurveTo(48,-15,51,10,39,26);g.bezierCurveTo(25,36,9,24,9,6+bounce);g.closePath();},HEROES[heroId].head,outline,5);
 // striped little hat + antenna crest
 path(g=>{g.moveTo(10,-8);g.quadraticCurveTo(21,-22,42,-9);g.lineTo(39,-20);g.quadraticCurveTo(23,-30,14,-22);g.closePath();},'#e38c78',outline,3);curve([[24,-23],[28,-42],[40,-40],[43,-52]],outline,4);star(43,-55,8,'#f5e4a1',now*.016,outline);
 // Hero silhouettes: original lantern, spark crown, foliage ears, and mechanical headband.
 if(heroId===1){star(12,-21,10,'#e8a4aa',now*.04);star(44,-24,10,'#f6e4b3',now*.06);}
 if(heroId===2){ellipse(4,-20,13,9,'#8fb778',outline,2);ellipse(46,-20,14,8,'#8bb36f',outline,2);}
 if(heroId===3){rect(11,-28,33,8,'#746889');circle(14,-22,7,'#f2dda8',outline,2);circle(42,-22,7,'#f2dda8',outline,2);}
 // face and cartoon expressive eyes, no cup face elements
 ellipse(20,3+bounce,4.6,9,'#38313d');ellipse(34,3+bounce,4.6,9,'#38313d');ellipse(21,-1+bounce,1.5,3.4,'#fff7e4');ellipse(35,-1+bounce,1.5,3.4,'#fff7e4');ellipse(13,17+bounce,7,4,'#d58f7f');
 path(g=>{g.moveTo(22,17);g.quadraticCurveTo(29,23,36,16);},null,'#6b4651',2.7);
 if(h.shield>0){ctx.globalAlpha=.4;ellipse(22,30,44,65,'#9ad7e9','#bdeef4',5);ctx.globalAlpha=1;}if(h.dash>0){ctx.globalAlpha=.4;ellipse(-21,36,26,14,'#9ad7e9');ctx.globalAlpha=1;}if(h.flash>0){star(65,21,13,'#fff2bc',now*.06);}
 ctx.restore();
}
function drawBoss(){if(!boss)return;if(selectedBoss!==0){drawOtherBoss();return;}const b=boss,hot=b.hit>0;
 ctx.save();ctx.translate(b.x,b.y+Math.sin(now*.055)*5);const sway=Math.sin(now*.037)*.065;ctx.rotate(sway);ctx.scale(1+Math.sin(now*.043)*.03,1-Math.sin(now*.043)*.035);
 // orchestra conductors top hat and floating cape
 path(g=>{g.moveTo(-52,24);g.bezierCurveTo(-93,47,-122,107,-40,122);g.lineTo(77,91);g.bezierCurveTo(116,54,69,28,40,29);g.closePath();},'#715d80',outline,5);
 path(g=>{g.moveTo(-73,-80);g.lineTo(-63,-141);g.quadraticCurveTo(2,-158,59,-142);g.lineTo(64,-80);g.closePath();},'#3b4157',outline,5);
 path(g=>{g.moveTo(-83,-81);g.quadraticCurveTo(-12,-58,77,-83);g.lineTo(70,-63);g.quadraticCurveTo(2,-50,-85,-65);g.closePath();},'#3b4157',outline,4);
 rect(-61,-102,120,16,'#c9938f');star(4,-96,10,'#f4d7a0',0);
 // hand painted crescent mask - own villain, no copied cuphead character
 path(g=>{g.moveTo(9,-65);g.bezierCurveTo(89,-89,96,0,67,46);g.bezierCurveTo(26,113,-79,81,-89,9);g.bezierCurveTo(-96,-58,-32,-86,9,-65);g.closePath();},hot?'#fff6d6':'#f7d99e',outline,7);
 path(g=>{g.moveTo(2,-57);g.bezierCurveTo(77,-20,58,54,6,67);g.bezierCurveTo(44,68,77,37,80,0);g.bezierCurveTo(74,-61,13,-73,2,-57);g.closePath();},'#d8a874',null);
 // conductor eyes, brows, nose
 ellipse(-36,-6,13,22,'#f7f1e7',outline,4);ellipse(2,-8,13,22,'#f7f1e7',outline,4);
 ellipse(-32,-1,5.5,11,'#363341');ellipse(7,-1,5.5,11,'#363341');curve([[-51,-37],[-42,-48],[-29,-48],[-22,-37]],outline,5);curve([[-7,-38],[1,-47],[13,-48],[20,-39]],outline,5);
 ellipse(-15,20,10,8,'#d5917b',outline,3);path(g=>{g.moveTo(-42,34);g.quadraticCurveTo(-12,68,21,33);},null,'#563f45',6);
 // very expressive raised eyebrows, gloved conductor arms
 curve([[-70,35],[-106,14],[-116,7],[-107,-25]],outline,11);glove(-104,-33,-.3,1.55);
 curve([[71,33],[110,43],[105,15],[116,-4]],outline,11);glove(115,-7,.6,1.5);
 curve([[115,-15],[143,-39],[144,-70],[151,-94]],'#523d45',5);star(154,-100,9,'#fff0b8',now*.08);
 // bowtie
 path(g=>{g.moveTo(-22,78);g.lineTo(-49,61);g.lineTo(-49,97);g.closePath();},'#d67778',outline,3);path(g=>{g.moveTo(-18,78);g.lineTo(8,62);g.lineTo(9,98);g.closePath();},'#d67778',outline,3);circle(-20,79,8,'#f8d4a0',outline,3);
 ctx.restore();
}
function drawOtherBoss(){
 const b=boss,hit=b.hit>0;ctx.save();ctx.translate(b.x,b.y+Math.sin(now*.055)*4);ctx.rotate(Math.sin(now*.025)*.065);ctx.scale(1+Math.sin(now*.038)*.022,1-Math.sin(now*.038)*.025);
 if(selectedBoss===1){
  // An original giant flower queen, with a ribbon crown and leafy arms.
  for(let i=0;i<12;i++){const a=i*TAU/12+now*.003,rx=Math.cos(a)*73,ry=Math.sin(a)*70;ellipse(rx,ry,28,42,i%2?'#e2a0a9':'#f0c5a3',outline,3.5);}
  ellipse(0,0,68,67,hit?'#fff5df':'#f1d987',outline,7);
  for(const a of [-1,1]){curve([[a*52,18],[a*94,36],[a*104,64],[a*116,84]],'#497967',12);glove(a*123,88,a*.3,1.1);}
  ellipse(-24,-14,9,20,'#fff5df',outline);ellipse(24,-14,9,20,'#fff5df',outline);
  ellipse(-20,-10,4,11,outline);ellipse(27,-10,4,11,outline);
  path(g=>{g.moveTo(-25,21);g.quadraticCurveTo(0,45,28,21);},null,'#a7656f',6);
  star(0,-76,15,'#f7e7aa',now*.01);ellipse(-23,34,12,5,'#e49d9e');ellipse(28,34,12,5,'#e49d9e');
  for(let j=0;j<8;j++)ellipse(Math.cos(j*TAU/8)*80,Math.sin(j*TAU/8)*85,5,7,'#f7e7b1');
 }else if(selectedBoss===2){
  // A swinging grandfather clock with clock face and pendulum.
  path(g=>{g.roundRect(-93,-106,188,231,32);},hit?'#f9e9d2':'#996e60',outline,7);
  path(g=>{g.roundRect(-82,-90,165,179,24);},'#d2a880','#70565c',5);
  circle(0,-13,74,'#f9e9c9',outline,8);circle(0,-13,61,'#ead8ad','#a78a73',4);
  for(let j=0;j<12;j++){const a=j*TAU/12-Math.PI/2;ellipse(Math.cos(a)*50,-13+Math.sin(a)*50,3,3,'#63505b');}
  curve([[0,-13],[0,-26],[20,-44],[15,-52]],outline,7);curve([[0,-13],[18,-7],[32,5],[36,8]],'#c3756c',5);circle(0,-13,9,'#cb8374');
  ellipse(-23,-10,8,13,'#394350');ellipse(24,-10,8,13,'#394350');
  path(g=>{g.moveTo(-22,30);g.quadraticCurveTo(2,43,29,29);},null,outline,4);
  curve([[-82,49],[-127,29],[-124,8],[-133,-9]],outline,10);glove(-137,-13,0,1.25);
  curve([[83,49],[119,23],[122,7],[134,-9]],outline,10);glove(140,-11,0,1.25);
  curve([[0,91],[7,121],[4,129],[0,148]],'#705052',7);ellipse(0,145,20,30,'#d6b27e',outline,4);
 }else if(selectedBoss===3){
  // A smiling electric storm front with thunder-horns and conductor hands.
  for(let j=0;j<10;j++){const a=j*TAU/10;ellipse(Math.cos(a)*65,Math.sin(a)*40-8,53,46,j%2?'#8297b0':'#a5b3c5',outline,3);}
  ellipse(0,0,95,70,hit?'#e9eef1':'#b8c7cf',outline,7);
  for(let i=0;i<2;i++){const x=i?27:-28;ellipse(x,-11,11,18,'#fff6e4',outline,3);ellipse(x+2,-9,5,10,'#4c5667');}
  path(g=>{g.moveTo(-32,25);g.quadraticCurveTo(4,59,35,23);},null,'#536075',6);
  for(const m of [-1,1]){curve([[m*70,22],[m*100,42],[m*105,67],[m*123,84]],outline,10);glove(m*125,84,m*.4,1.1);}
  path(g=>{g.moveTo(-50,68);g.lineTo(-64,113);g.lineTo(-36,105);g.lineTo(-53,146);g.lineTo(5,86);g.lineTo(-18,88);g.closePath();},'#f5d174','#846b67',3);
  star(15,-70,14,'#ffdf8d',now*.06);
 }else if(selectedBoss===4){
  // Giggling sugar count in a swirled toffee cloak.
  for(let j=0;j<9;j++){const a=j*TAU/9;ellipse(Math.cos(a)*83,Math.sin(a)*59,30,24,j%2?'#f8d8ac':'#edaea5',outline,3);}
  ellipse(0,0,91,81,hit?'#fff9e8':'#f1b6a5',outline,7);for(let j=0;j<5;j++)ellipse(-52+j*25,-59,19,25,'#fff1ce',outline,2);
  ellipse(-26,-14,12,19,'#fff6e6',outline);ellipse(25,-14,12,19,'#fff6e6',outline);circle(-22,-10,5,'#493a4a');circle(27,-10,5,'#493a4a');
  path(g=>{g.moveTo(-30,23);g.quadraticCurveTo(2,66,32,19);},null,'#8d5a64',7);
  for(const a of [-1,1]){curve([[a*70,22],[a*101,38],[a*117,57],[a*127,79]],outline,11);glove(a*130,80,a*.2,1.1);}
  star(0,-98,20,'#fff0bd',now*.02);
 }else if(selectedBoss===5){
  // Snow ballerina with a frosted crown and silk scarf.
  for(let j=0;j<8;j++)ellipse(Math.cos(j*TAU/8)*67,Math.sin(j*TAU/8)*70,26,40,j%2?'#d2eaf0':'#a9cddf',outline,3);
  ellipse(0,0,79,77,hit?'#fffdf5':'#dce8eb',outline,7);
  for(let i=-2;i<=2;i++)star(i*23,-82-((i+2)%2)*13,13,'#e6f7f8',now*.02);
  ellipse(-21,-9,11,23,'#fff9e8',outline,3);ellipse(24,-9,11,23,'#fff9e8',outline,3);ellipse(-19,-6,5,13,'#486777');ellipse(25,-6,5,13,'#486777');
  ellipse(0,28,21,9,'#de9da2',outline,3);curve([[-72,31],[-104,8],[-125,-22],[-119,-37]],outline,10);glove(-122,-40);curve([[72,31],[102,5],[116,-11],[125,-30]],outline,10);glove(128,-35);
 }else if(selectedBoss===6){
  // Masked floating illusionist, eight-point inked cape.
  for(let i=0;i<9;i++){const a=i*TAU/9;path(g=>{g.moveTo(0,0);g.lineTo(Math.cos(a)*118,Math.sin(a)*100);g.lineTo(Math.cos(a+.29)*80,Math.sin(a+.29)*73);g.closePath();},i%2?'#6d6388':'#ab8a9e',outline,2);}
  ellipse(0,0,79,80,hit?'#ffffff':'#d9c6d9',outline,7);path(g=>{g.moveTo(-70,-65);g.lineTo(-40,-142);g.lineTo(56,-139);g.lineTo(73,-65);g.closePath();},'#494663',outline,5);
  ellipse(-22,-10,13,23,'#fff5df',outline);ellipse(25,-10,13,23,'#fff5df',outline);ellipse(-19,-9,7,13,'#6b4a7e');ellipse(26,-9,7,13,'#6b4a7e');path(g=>{g.moveTo(-28,31);g.quadraticCurveTo(7,54,32,20);},null,'#754e67',6);
  star(0,-138,20,'#f1dfad',now*.03);for(const a of [-1,1]){curve([[a*60,33],[a*94,45],[a*121,17],[a*129,-5]],outline,9);glove(a*132,-10);}
 }else if(selectedBoss===8){
  // Original theatrical porcelain-faced marquise, lace fans and dramatic masks.
  for(let j=0;j<10;j++){const a=j*TAU/10+now*.007;ellipse(Math.cos(a)*82,Math.sin(a)*75,27,44,j%2?'#d9aac0':'#ebd0c8',outline,3);}
  path(g=>{g.moveTo(-94,45);g.quadraticCurveTo(-64,134,0,131);g.quadraticCurveTo(86,139,96,45);g.closePath();},'#976c8e',outline,7);
  ellipse(0,-7,76,89,hit?'#fff9e9':'#f7e6d5',outline,8);
  for(let j=-1;j<=1;j++)star(j*37,-97-Math.cos(j)*13,13,'#e9c88d',now*.015);
  path(g=>{g.moveTo(-43,-12);g.quadraticCurveTo(-21,-40,-5,-16);},null,outline,7);
  path(g=>{g.moveTo(6,-16);g.quadraticCurveTo(24,-41,46,-12);},null,outline,7);
  ellipse(-24,-7,7,17,'#55455b');ellipse(27,-7,7,17,'#55455b');
  ellipse(-25,-14,3,5,'#fff6eb');ellipse(27,-14,3,5,'#fff6eb');
  ellipse(1,20,13,6,'#da969b');path(g=>{g.moveTo(-31,37);g.quadraticCurveTo(0,55,34,37);},null,'#955d76',6);
  for(const a of [-1,1]){curve([[a*72,27],[a*106,60],[a*119,54],[a*137,83]],outline,10);glove(a*137,83,a*.4,1.3);}
  for(const a of [-1,1]){path(g=>{g.moveTo(a*128,81);g.lineTo(a*176,49);g.lineTo(a*181,122);g.closePath();},'#e8c1c4',outline,3);}
 }else if(selectedBoss===9){
  // Final boss: giant crowned ink monarch, cracked crown and two ominous hands.
  ctx.scale(b.phase===3?1.17:1, b.phase===3?1.13:1);
  for(let j=0;j<12;j++){const a=j*TAU/12+now*.004;ellipse(Math.cos(a)*79,Math.sin(a)*81,41,35,j%2?'#514366':'#8b6589',outline,4);}
  ellipse(0,3,99,93,hit?'#f3e6eb':'#c6a5b5',outline,8);
  path(g=>{g.moveTo(-81,-64);g.lineTo(-102,-140);g.lineTo(-42,-104);g.lineTo(0,-159);g.lineTo(44,-106);g.lineTo(103,-143);g.lineTo(83,-60);g.closePath();},'#776083',outline,6);
  for(let j=0;j<5;j++)star(-75+j*38,-91-Math.abs(2-j)*11,9,'#f4d89f',now*.026);
  ellipse(-35,-19,19,29,'#fff0e5',outline,4);ellipse(35,-19,19,29,'#fff0e5',outline,4);
  ellipse(-29,-15,7,18,'#3a2e4f');ellipse(42,-15,7,18,'#3a2e4f');
  curve([[-55,-66],[-40,-78],[-23,-61],[-17,-54]],outline,6);curve([[14,-54],[29,-81],[46,-76],[56,-62]],outline,6);
  path(g=>{g.moveTo(-41,33);g.quadraticCurveTo(0,84,40,30);g.quadraticCurveTo(0,53,-41,33);},'#6a3f60',outline,5);
  for(const a of [-1,1]){curve([[a*79,39],[a*123,61],[a*134,19],[a*147,-3]],outline,13);glove(a*146,-10,a*.4,1.5);}
  if(b.phase>=2){for(let j=0;j<7;j++)star(Math.cos(j*TAU/7+now*.02)*123,Math.sin(j*TAU/7+now*.02)*126,8,'#ecd69a',now*.06);}
  if(b.phase===3){ctx.globalAlpha=.48;star(0,0,135,'#f0bdc0',now*.014,'#d67e9e');ctx.globalAlpha=1;}
 }else if(selectedBoss===7){
  // Brass locomotive commander, expressive furnace and smokestack.
  path(g=>{g.roundRect(-95,-92,191,208,26);},hit?'#fff2e3':'#a47e69',outline,7);path(g=>{g.roundRect(-79,-76,157,154,21);},'#c9ae83',outline,5);
  rect(-22,-151,45,73,'#544c56');rect(-31,-152,64,13,'#857584');for(let i=0;i<5;i++)ellipse(-11+Math.sin(now*.02+i)*28,-152-i*23,23+i*3,13+i*2,'#d8d3cd');
  circle(0,-8,66,'#e9d19f',outline,6);ellipse(-25,-20,11,22,'#fff5de',outline);ellipse(25,-20,11,22,'#fff5de',outline);ellipse(-22,-20,6,11,'#4a4754');ellipse(27,-20,6,11,'#4a4754');
  path(g=>{g.moveTo(-29,25);g.quadraticCurveTo(0,47,30,25);},null,'#9a695f',7);for(const a of [-1,1]){curve([[a*80,32],[a*119,47],[a*131,24],[a*142,-6]],outline,12);glove(a*146,-12);}
  circle(-50,104,21,'#53525a',outline);circle(50,104,21,'#53525a',outline);star(0,-94,15,'#f5d890',now*.02);
 }
 ctx.restore();
}
function drawShot(s){if(s.ultra){ctx.save();ctx.globalAlpha=.25;circle(s.x,s.y,35+Math.sin(now*.28)*6,'#f9da81');ctx.restore();star(s.x,s.y,24,'#ffdfa7',s.rot,'#ae6b6c');circle(s.x,s.y,8,'#fffbed');}else {ctx.save();ctx.globalAlpha=.4;ellipse(s.x-10,s.y,23,7,'#fbdf95');ctx.restore();star(s.x,s.y,11,'#fff1b5',s.rot,'#c78283');}}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);const colors={ground:'#e39b84',orb:'#b7a0c3',petal:'#e8a5b1',gear:'#ad9a8d',rain:'#84bdd0',bolt:'#f7da7c',candy:'#f0c3a4',snow:'#b5ddea',card:'#bb93b6',steam:'#e8d9ce',ribbon:'#e0a3c4',mask:'#f0d9cd',spotlight:'#f4d89d',ink:'#675374',starfall:'#eac59f'};const color=colors[e.type]||'#b7a0c3';if(e.type==='mask'){ellipse(0,0,e.r*1.3,e.r*1.1,color,'#684962',2);ellipse(-5,-3,3,5,'#583c54');ellipse(6,-3,3,5,'#583c54');}else if(e.type==='ribbon'){ctx.rotate(now*.04+(e.wave||0));ellipse(0,0,e.r*1.8,e.r*.6,color,'#885773',2);}else if(e.type==='ink'){circle(0,0,e.r,color,'#392b48',2.5);circle(-3,-4,3,'#e8c7d3');}else if(e.type==='rain'){ellipse(0,0,e.r*.6,e.r*1.7,color,'#557d92',1.5);}else if(e.type==='bolt'){star(0,0,e.r*1.1,color,now*.14,'#846b56');}else if(e.type==='gear'){circle(0,0,e.r,color,'#5c4b67',3);circle(0,0,e.r*.5,'#f2e0c4',outline,2);}else if(e.type==='snow'){star(0,0,e.r*1.3,color,now*.07,'#7da5b6');}else if(e.type==='card'){rect(-e.r,-e.r*.7,e.r*2,e.r*1.4,'#ecdbc6');star(0,0,e.r*.65,color,now*.07,'#735a8b');}else if(e.type==='candy'){circle(0,0,e.r,color,'#c5858c',3);star(0,0,7,'#fff4d3',now*.05);}else if(e.type==='steam'){ellipse(0,0,e.r*1.8,e.r*1.2,color,'#ad9b9d',2);}else if(e.type==='petal'){ellipse(0,0,e.r*1.4,e.r*.8,color,outline,2);}else{circle(0,0,e.r,color,'#5c4b67',3);star(-2,0,e.r*.52,'#fff4de',now*.09,'#64516b');}ctx.restore();}
function drawFront(){// curtain frame vignette and HUD can be visually separate
 const edge=ctx.createLinearGradient(0,0,W,0);edge.addColorStop(0,'#493b4f55');edge.addColorStop(.08,'#00000000');edge.addColorStop(.9,'#00000000');edge.addColorStop(1,'#493b4f55');rect(0,0,W,H,edge);
 if(superBurst>0){ctx.save();ctx.globalAlpha=Math.min(.42,superBurst/50);rect(0,0,W,H,'#ffedb1');ctx.restore();}
 if(selectedBoss===9&&stage==='playing'){ctx.save();ctx.globalAlpha=.09+.04*Math.sin(now*.03);const aura=ctx.createRadialGradient(boss.x,boss.y,40,boss.x,boss.y,250);aura.addColorStop(0,'#edb7d3');aura.addColorStop(1,'#edb7d300');rect(boss.x-260,boss.y-260,520,520,aura);ctx.restore();}
 for(const p of fx){ctx.save();ctx.globalAlpha=Math.min(1,p.life/16);star(p.x,p.y,p.r,p.color,now*.02,p.color);ctx.restore();}
}
function overlay(){if(stage==='playing')return;
 ctx.save();rect(0,0,W,H,'#2c2c38a6');
 // hand-lettered theater placard
 path(g=>{g.moveTo(218,102);g.quadraticCurveTo(480,79,745,102);g.quadraticCurveTo(774,262,737,400);g.quadraticCurveTo(470,429,217,396);g.quadraticCurveTo(184,246,218,102);g.closePath();},'#ffedc9','#57414c',8);
 path(g=>{g.moveTo(234,117);g.quadraticCurveTo(480,103,724,117);g.quadraticCurveTo(737,259,720,380);g.quadraticCurveTo(468,404,239,382);g.quadraticCurveTo(211,255,234,117);g.closePath();},null,'#ba806b',2.5);
 star(250,135,18,'#d78379');star(714,142,18,'#d78379');star(254,352,13,'#d2a66c');star(712,352,13,'#d2a66c');
 ctx.textAlign='center';ctx.fillStyle='#66474c';ctx.font='bold 15px Georgia,serif';ctx.fillText('POLY PICTURES PRESENTS',480,155);
 const headline=stage==='win'?'БРАВО!':stage==='intermission'?'БОСС ПОБЕЖДЁН!':stage==='lose'?'НЕ СДАВАЙСЯ!':stage==='pause'?'АНТРАКТ':'ЧЕРНИЛЬНЫЙ';const sub=stage==='intro'?'КАРНАВАЛ!':stage==='win'?'ВСЕ ДЕСЯТЬ АКТОВ ПРОЙДЕНЫ!':stage==='intermission'?'СЛЕДУЮЩИЙ АКТ ЖДЁТ':stage==='pause'?'НАЖМИ P, ЧТОБЫ ПРОДОЛЖИТЬ':'ЕЩЁ ОДИН ВЫХОД НА СЦЕНУ';
 ctx.fillStyle='#493a44';ctx.font='900 '+(stage==='intermission'?43:53)+'px Georgia,serif';ctx.fillText(headline,480,224);ctx.fillStyle='#ca786d';ctx.font='900 37px Georgia,serif';ctx.fillText(sub,480,272);
 path(g=>{g.roundRect(345,313,270,60,8);},'#c4786e','#59414a',4);
 ctx.fillStyle='#fff5dd';ctx.font='900 19px Georgia,serif';ctx.fillText(stage==='pause'?'НАЖМИ P':stage==='intermission'?'СЛЕДУЮЩИЙ БОСС':'НАЖМИ НА ЭКРАН',480,351);
 ctx.fillStyle='#8a6c5b';ctx.font='14px Georgia,serif';ctx.fillText('A / D · S · W · ЛКМ · ПРОБЕЛ · Q · E',480,392);ctx.restore();}
function draw(){ctx.save();if(shake>0)ctx.translate(rnd(-shake,shake),rnd(-shake*.5,shake*.5));
const art=window.PolyCinemaArt;
if(art)art.stage(ctx,{level:selectedBoss,cam:0,frames:now,W,H,FLOOR});else background();
if(art&&boss)art.bossAura(ctx,{x:boss.x,y:boss.y,phase:boss.phase,level:selectedBoss,frames:now,W,H,attackWait});
for(const e of enemy)drawEnemy(e);drawBoss();
if(art&&hero)art.hero(ctx,{...hero,heroId,body:costume,head:HEROES[heroId].head,frames:now});else drawHero();
for(const s of shots)drawShot(s);drawFront();
 if(stage==='playing'&&comboHits>=3){ctx.save();ctx.translate(480,81);const scale=1+Math.min(.24,comboPulse/160);ctx.scale(scale,scale);ctx.globalAlpha=Math.min(1,.4+comboTimer/90);ctx.fillStyle='#3c3046c8';ctx.beginPath();ctx.roundRect(-125,-25,250,52,11);ctx.fill();ctx.strokeStyle=comboHits>=8?'#ffe39a':'#e5b9a6';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff0ca';ctx.textAlign='center';ctx.font='bold 23px Georgia,serif';ctx.fillText('✦ '+comboHits+' ПОПАДАНИЙ ПОДРЯД',0,8);ctx.restore();}
 if(art&&motionFx)art.film(ctx,{W,H,frames:now});overlay();ctx.restore();}
function loop(ts){const dt=clamp((ts-prev)/16.6667,0,2.4);prev=ts;if(v9Arcade?.isActive()){v9Arcade.update(dt);v9Arcade.draw();}else{update(dt);draw();}requestAnimationFrame(loop);}
function keydown(e){if(v9Arcade?.isActive()){v9Arcade.keydown(e);return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code) && (document.activeElement===canvas||document.activeElement===document.body||!document.activeElement))e.preventDefault();
 if(e.code==='KeyP'&&!e.repeat){if(stage==='playing')stage='pause';else if(stage==='pause')stage='playing';hud();return;}
 if(stage==='intro'||stage==='win'||stage==='lose'||stage==='intermission'){if(e.code==='Enter')reset(stage==='intermission'?selectedBoss+1:selectedBoss);return;}
 if(e.code==='Space'&&!e.repeat)ultimate();if(e.code==='KeyR'&&!e.repeat)parry();if(e.code==='KeyQ'&&!e.repeat)dash();if(e.code==='KeyE'&&!e.repeat)shield();if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code))chooseWeapon({Digit1:'star',Digit2:'spread',Digit3:'heavy',Digit4:'needle'}[e.code]);keys.add(e.code);
}
window.addEventListener('keydown',keydown);
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();mousedown=false;if(stage==='playing'){stage='pause';hud();}});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();mousedown=false;if(stage==='playing'){stage='pause';hud();}v9Arcade?.pauseForHidden?.();}prev=performance.now();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.focus();if(v9Arcade?.isActive()){v9Arcade.pointerdown();return;}if(stage==='intro'||stage==='win'||stage==='lose'||stage==='intermission'){reset(stage==='intermission'?selectedBoss+1:selectedBoss);return;}if(stage==='pause')return;mousedown=true;shoot();});
window.addEventListener('pointerup',()=>{mousedown=false;if(v9Arcade?.isActive())v9Arcade.pointerup();});
canvas.addEventListener('pointerleave',()=>mousedown=false);
$('playBtn').addEventListener('click',()=>{if(v9Arcade?.isActive())v9Arcade.exit();reset(stage==='intermission'?selectedBoss+1:selectedBoss);});
const screenButton=$('fullscreenArcade');screenButton?.addEventListener('click',async()=>{const shell=document.querySelector('.game-shell');try{if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();}catch{screenButton.textContent='Полный экран недоступен';}});
document.addEventListener('fullscreenchange',()=>{if(screenButton)screenButton.textContent=document.fullscreenElement?'⤢ Выйти из полного экрана':'⛶ На полный экран';});
$('arcadeMotion')?.addEventListener('click',()=>{motionFx=!motionFx;$('arcadeMotion').textContent=motionFx?'✧ Эффекты: вкл.':'✧ Эффекты: экономно';$('arcadeMotion').setAttribute('aria-pressed',String(motionFx));});
$('musicArcade').addEventListener('click',async()=>{const on=await sound.toggleMusic();$('musicArcade').textContent=on?'♫ Музыка: играет':'♫ Музыка: выключена';$('musicArcade').setAttribute('aria-pressed',on);});
for(const btn of document.querySelectorAll('[data-key]')){const code=btn.dataset.key;btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);if(v9Arcade?.isActive()){v9Arcade.touch(code,true);return;}if(stage!=='playing'&&stage!=='pause')reset();if(code==='Space')ultimate();else if(code==='KeyQ')dash();else if(code==='KeyE')shield();else if(code==='KeyR')parry();else if(code==='MouseFire'){mousedown=true;shoot();}else keys.add(code);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>{keys.delete(code);if(v9Arcade?.isActive())v9Arcade.touch(code,false);if(code==='MouseFire')mousedown=false;});}
document.querySelectorAll('[data-boss]').forEach(btn=>btn.addEventListener('click',()=>{selectedBoss=+btn.dataset.boss;reset(selectedBoss);}));
document.querySelectorAll('[data-weapon]').forEach(btn=>btn.addEventListener('click',()=>chooseWeapon(btn.dataset.weapon)));
document.querySelectorAll('[data-hero]').forEach(btn=>btn.addEventListener('click',()=>{heroId=+btn.dataset.hero;costume=HEROES[heroId].body;reset(selectedBoss);}));
document.querySelectorAll('[data-costume]').forEach(btn=>btn.addEventListener('click',()=>{costume=btn.dataset.costume;persist();syncSelectors();}));
function drawCharms(){const box=$('charmShop');if(!box)return;box.replaceChildren();$('ticketsLabel').textContent=tickets;
 for(const q of CHARMS){const own=ownedCharms.includes(q.id);const card=document.createElement('div');card.className='charm-option'+(charm===q.id?' selected':'');const desc=document.createElement('div');desc.innerHTML='<b>'+q.icon+' '+q.name+'</b><small>'+q.desc+'</small>';const btn=document.createElement('button');btn.type='button';btn.textContent=charm===q.id?'✓ Надето':own?'Надеть':'✦ '+q.cost;btn.disabled=charm===q.id||(!own&&tickets<q.cost);btn.addEventListener('click',()=>{if(!own){if(tickets<q.cost)return;tickets-=q.cost;ownedCharms.push(q.id);}charm=q.id;persist();drawCharms();reset(selectedBoss);});card.append(desc,btn);box.append(card);}
}
v9Arcade=window.createPolyArcadeV9?.({ctx,W,H,heroes:HEROES,getHero:()=>HEROES[heroId],getHeroId:()=>heroId,getBoss:()=>selectedBoss,getCharm:()=>charm,reset,bonusTicket:n=>{tickets+=n;persist();syncSelectors();drawCharms();},keys,canvas})||null;
hero={x:160,y:FLOOR-73,w:45,h:73,face:1,vx:0,vy:0,hp:HEROES[heroId].hp+(charm==='heart'?1:0),jumps:0,jumpLatch:false,ground:true,duck:false,inv:0,walk:0,flash:0,dash:0,dashCooldown:0,shield:0,shieldCooldown:0,parryCooldown:0};boss={x:785,y:200,hp:BOSSES[selectedBoss].max,max:BOSSES[selectedBoss].max,phase:1,hit:0};syncSelectors();drawCharms();
clouds=Array.from({length:6},(_,i)=>({x:i*202,y:100+i*20,s:.1}));hud();requestAnimationFrame(loop);
})();
