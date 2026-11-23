/* POLY FARM v15 — original procedural game soundscape. No external audio/CDNs. */
(()=>{'use strict';
const sound=window.PolyFarmSound;
if(!sound||!document.querySelector('.farm-playfield'))return;
const STORE='poly-farm-audio-v15';
const defaults={enabled:true,fx:.80,amb:.58};
let prefs={...defaults};
try{const v=JSON.parse(localStorage.getItem(STORE)||'null');if(v&&typeof v==='object')prefs={enabled:v.enabled!==false,fx:Math.min(1,Math.max(0,Number(v.fx??defaults.fx))),amb:Math.min(1,Math.max(0,Number(v.amb??defaults.amb)))};}catch{}
const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(prefs));}catch{}};
let unlocked=false,lastWeather='',lastDay='',lastThunder=0,lastNature=0,lastRegion='',lastTick=0;
let toggleBtn=null,options=null;
let ambBus=null,windGain=null,waterGain=null,soundBuffer=null;
const last=Object.create(null);
const now=()=>sound.ctx?.currentTime||0;
const minGap={step:.24,tractorStep:.29,click:.07,select:.07,animal:.37,bird:1.8,cricket:1.5,water:.16,hoe:.10,harvest:.13,seed:.12,fishCast:2.5,fishSplash:.24,fishBite:1.1,fishReel:1.0,fishCatch:1.2,wind:2.8,thunder:11};
const throttle=(type)=>{const t=performance.now()/1000;if(t-(last[type]??-1e3)<(minGap[type]??.09))return false;last[type]=t;return true;};
function noiseBuffer(){const c=sound.ctx;if(!soundBuffer){soundBuffer=c.createBuffer(1,Math.ceil(c.sampleRate*3),c.sampleRate);const d=soundBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.72;}return soundBuffer;}
function tone(hz,dur=.15,vol=.13,wave='sine',offset=0,endHz){
 const c=sound.ctx;if(!c||!sound.fxBus)return;
 const t=c.currentTime+.004+offset,osc=c.createOscillator(),gain=c.createGain();
 osc.type=wave;osc.frequency.setValueAtTime(Math.max(40,hz),t);if(endHz)osc.frequency.exponentialRampToValueAtTime(Math.max(40,endHz),t+dur);
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+Math.min(.02,dur*.20));gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
 osc.connect(gain);gain.connect(sound.fxBus);osc.start(t);osc.stop(t+dur+.04);
}
function scratch(dur=.12,vol=.075,cutoff=2400,offset=0,highpass=false){
 const c=sound.ctx;if(!c||!sound.fxBus)return;
 const t=c.currentTime+.005+offset,src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
 src.buffer=noiseBuffer();filter.type=highpass?'highpass':'lowpass';filter.frequency.value=cutoff;filter.Q.value=.65;
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.013);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
 src.connect(filter);filter.connect(gain);gain.connect(sound.fxBus);src.start(t,Math.random()*.15);src.stop(t+dur+.05);
}
function sparkle(base=660){tone(base,.12,.09,'sine');tone(base*1.26,.15,.09,'sine',.08);tone(base*1.5,.27,.08,'triangle',.17);}
function breed(name){if(/cow|ox|buffalo|yak/.test(name))return 'cow';if(/sheep|goat|alpaca/.test(name))return 'sheep';if(/pig|boar/.test(name))return 'pig';if(/hen|chicken|rooster|turkey/.test(name))return 'hen';if(/duck|goose|swan/.test(name))return 'duck';if(/horse|donkey|deer/.test(name))return 'horse';if(/dog|wolf/.test(name))return 'dog';if(/cat/.test(name))return 'cat';if(/bee|butterfly/.test(name))return 'bee';return 'animal';}
function play(type){
 if(!prefs.enabled||!sound.effectsOn||!sound.ctx||sound.ctx.state!=='running'||!throttle(type))return;
 if(type.startsWith('animal-'))type=breed(type.slice(7));
 switch(type){
 case 'hoe':scratch(.15,.17,650);tone(125,.16,.16,'triangle',.03,68);scratch(.055,.05,1800,.09);break;
 case 'seed':scratch(.065,.07,1700);for(let i=0;i<3;i++)tone(415+i*75,.065,.055,'sine',i*.07,310+i*40);break;
 case 'water':scratch(.38,.11,2100);for(let i=0;i<4;i++)tone(340+i*90,.15,.035,'sine',i*.08,170+i*65);break;
 case 'harvest':scratch(.22,.07,4400);tone(565,.15,.12,'triangle',0,710);tone(845,.19,.10,'sine',.07);break;
 case 'fertilize':scratch(.28,.11,1300);tone(260,.12,.085,'triangle',.08,180);break;
 case 'step':scratch(.065,.065,600);tone(125,.055,.052,'triangle',.01,75);break;
 case 'tractorStep':tone(86,.13,.14,'sawtooth',0,68);scratch(.11,.07,300,.02);break;
 case 'tractor':tone(96,.48,.21,'sawtooth',0,132);tone(69,.5,.14,'triangle',.06,84);scratch(.3,.06,600,.06);break;
 case 'fishCast':scratch(.35,.14,3500);tone(460,.3,.095,'triangle',0,920);break;
 case 'fishSplash':scratch(.44,.21,3100);tone(220,.29,.10,'sine',.045,95);tone(400,.17,.05,'sine',.13,180);break;
 case 'fishBite':tone(530,.13,.105,'sine');tone(760,.16,.105,'triangle',.13);break;
 case 'fishReel':for(let i=0;i<6;i++){tone(160+(i%2)*60,.065,.067,'triangle',i*.095,120);scratch(.075,.045,1900,i*.095);}break;
 case 'fish':case 'fishCatch':sparkle(590);scratch(.18,.07,2900,.035);break;
 case 'fishMiss':tone(420,.22,.12,'sine',0,260);tone(270,.25,.09,'triangle',.19,150);break;
 case 'buy':tone(660,.12,.11,'sine');tone(880,.14,.10,'sine',.095);break;
 case 'sell':tone(590,.11,.09,'triangle');tone(740,.17,.11,'sine',.13);break;
 case 'reward':case 'festival':sparkle(690);tone(1070,.24,.07,'sine',.22);break;
 case 'build':scratch(.22,.14,1200);tone(175,.25,.13,'triangle',.04,110);scratch(.12,.07,1600,.25);break;
 case 'upgrade':sparkle(540);scratch(.10,.07,2600,.05);break;
 case 'mine':scratch(.18,.17,2600);tone(400,.2,.12,'triangle',0,190);scratch(.09,.11,3300,.19);break;
 case 'forage':scratch(.19,.12,3800);tone(820,.16,.09,'sine',.08);break;
 case 'feed':scratch(.27,.095,850);for(let i=0;i<3;i++)tone(290+i*80,.075,.045,'sine',i*.11);break;
 case 'animalCollect':scratch(.17,.09,1800);tone(680,.11,.08,'triangle',.07);tone(940,.20,.08,'sine',.16);break;
 case 'cow':tone(132,.46,.16,'sawtooth',0,97);tone(155,.42,.08,'triangle',.10,86);break;
 case 'sheep':tone(330,.31,.12,'sawtooth',0,210);tone(390,.29,.07,'triangle',.11,240);break;
 case 'pig':tone(160,.17,.12,'sawtooth',0,240);tone(185,.20,.09,'sawtooth',.18,110);break;
 case 'hen':for(let i=0;i<3;i++)tone(620+i*48,.12,.08,'triangle',i*.12,440+i*30);break;
 case 'duck':for(let i=0;i<2;i++)tone(350,.19,.13,'sawtooth',i*.22,210);break;
 case 'horse':tone(420,.30,.14,'triangle',0,740);tone(700,.32,.11,'sawtooth',.20,320);break;
 case 'dog':for(let i=0;i<2;i++)tone(200,.12,.14,'sawtooth',i*.21,95);break;
 case 'cat':tone(480,.45,.10,'sawtooth',0,260);break;
 case 'bee':tone(190,.48,.10,'sawtooth',0,220);break;
 case 'animal':tone(275,.22,.095,'triangle',0,215);tone(330,.20,.08,'sine',.11);break;
 case 'dialog':tone(620,.11,.075,'sine');tone(810,.13,.07,'sine',.12);break;
 case 'select':tone(730,.07,.06,'sine');break;
 case 'click':tone(580,.055,.043,'sine');break;
 case 'door':scratch(.28,.085,700);tone(210,.28,.08,'triangle',0,120);break;
 case 'travel':scratch(.35,.07,2200);tone(450,.26,.07,'sine',.05,700);break;
 case 'bird':for(let i=0;i<4;i++)tone(960+(i%2)*230,.075,.045,'sine',i*.125,1500+(i%2)*230);break;
 case 'cricket':for(let i=0;i<7;i++)tone(2350,.045,.018,'sine',i*.09,2100);break;
 case 'wind':scratch(.75,.05,530);break;
 case 'thunder':scratch(1.9,.24,190);tone(72,1.6,.14,'sawtooth',0,43);scratch(.7,.07,410,.39);break;
 case 'sleep':tone(450,.37,.09,'sine',0,360);tone(315,.55,.10,'sine',.22,250);break;
 case 'storm':scratch(1.1,.11,240);break;
 default: // New farm actions get a friendly click rather than total silence.
   tone(540,.09,.05,'sine');
 }
}
const originalEffect=sound.effect.bind(sound);
sound.effect=function(type='click'){
 if(!prefs.enabled)return;
 if(!sound.ctx||sound.ctx.state!=='running'){
   sound.ensure().then(ok=>{if(ok)play(type);}).catch(()=>{});
   return;
 }
 play(type);
};
// Preserve unrelated features by never changing PlaygroundAudio.prototype or the arcade.
const rawSetEffects=sound.setEffects.bind(sound);
sound.setEffects=on=>{rawSetEffects(on);refreshUI();};
sound.setFxVolume=p=>{sound.effectsVolume=Math.min(1,Math.max(0,Number(p)||0));if(sound.fxBus)sound.fxBus.gain.value=sound.effectsOn?sound.effectsVolume:0;prefs.fx=sound.effectsVolume;persist();refreshUI();};
sound.setFxVolume(prefs.fx);
function ambientLoop(cutoff,volume){
 const c=sound.ctx,src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
 src.buffer=noiseBuffer();src.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.value=0;
 src.connect(filter);filter.connect(gain);gain.connect(ambBus);src.start();return gain;
}
function createAmbience(){
 if(ambBus||!sound.ctx)return;
 const c=sound.ctx;ambBus=c.createGain();ambBus.gain.value=prefs.amb*.60;ambBus.connect(sound.master);
 // Keep the rain loop on the ambience channel, so its slider controls ALL weather.
 if(sound.rainBus){sound.rainBus.disconnect();sound.rainBus.connect(ambBus);}
 windGain=ambientLoop(510);waterGain=ambientLoop(2900);
}
async function unlock(){
 try{if(!prefs.enabled)return;const success=await sound.ensure();if(!success)return;unlocked=true;createAmbience();refreshUI();tick(true);}catch{}
}
function setEnabled(value){
 prefs.enabled=!!value;persist();
 if(sound.master&&sound.ctx)sound.master.gain.setTargetAtTime(prefs.enabled?.56:0,now(),.04);
 if(prefs.enabled)unlock();else if(sound.ctx&&sound.rainOn)sound.setRain(false);
 refreshUI();
}
function tick(force=false){
 if(!prefs.enabled||!unlocked||!sound.ctx||sound.ctx.state!=='running')return;
 const label=document.getElementById('weatherLabel')?.textContent||'';
 const time=document.getElementById('timeLabel')?.textContent||'';
 const phase=/ноч/i.test(time)?'night':/вечер/i.test(time)?'evening':'day';
 const rainy=/дожд|гроз/i.test(label),storm=/гроз/i.test(label),wind=/ветер|гроз/i.test(label);
 const rainButton=document.getElementById('rainAudioFarm');
 const rainAllowed=rainButton?.getAttribute('aria-pressed')!=='false';
 const wantRain=rainy&&rainAllowed;
 if(force||label!==lastWeather||phase!==lastDay){
   if(force||rainy!==sound.rainOn)sound.setRain(wantRain);
   lastWeather=label;lastDay=phase;
 }
 const region=window.PolyFarmAudioRegion||{};
 const nearWater=!!region.nearWater,nearAnimals=!!region.nearAnimals;
 const t=now();
 if(windGain)windGain.gain.setTargetAtTime((wind?.18:.045),t,.7);
 if(waterGain)waterGain.gain.setTargetAtTime(nearWater?.15:.015,t,.8);
 if(ambBus)ambBus.gain.setTargetAtTime(prefs.amb*.60,t,.18);
 if(storm&&performance.now()-lastThunder>18000){lastThunder=performance.now();play('thunder');}
 if(performance.now()-lastNature>4800){
    lastNature=performance.now()+(Math.random()*2800);
    if(!rainy){if(phase==='night')play('cricket');else if(nearAnimals&&Math.random()<.36)play('animal');else play('bird');}
 }
}
// Integrate with world position (without touching farm saves or the main website).
window.PolyFarmSoundscape={tick,enable:setEnabled,toggle:()=>setEnabled(!prefs.enabled),setFxVolume:val=>sound.setFxVolume(val),isEnabled:()=>prefs.enabled};
const screen=document.querySelector('.farm-playfield .screen-tools');
function refreshUI(){
 if(toggleBtn)toggleBtn.textContent=prefs.enabled?'🔊 Звук':'🔇 Звук';
 const fx=options?.querySelector('[data-farm-volume="fx"]');if(fx&&document.activeElement!==fx)fx.value=Math.round(prefs.fx*100);
 const amb=options?.querySelector('[data-farm-volume="amb"]');if(amb&&document.activeElement!==amb)amb.value=Math.round(prefs.amb*100);
}
if(screen){
 const wrap=document.createElement('span');wrap.className='farm-sound-wrap';
 wrap.innerHTML=`<button id="farmSfxToggle" class="fullscreen-btn" type="button" title="Включить или выключить весь звук">🔊 Звук</button><button id="farmSfxOptionsButton" class="fullscreen-btn" type="button" aria-expanded="false" title="Настройки звука">⚙</button><div id="farmSfxOptions" class="farm-sound-options" hidden><strong>🎧 Звук фермы</strong><label>Эффекты <input type="range" min="0" max="100" data-farm-volume="fx" value="80"></label><label>Природа и погода <input type="range" min="0" max="100" data-farm-volume="amb" value="58"></label><button type="button" id="farmTestSound">▶ Проверить звук</button><small>После первого нажатия доступны звуки растений, животных, рыбалки, техники, дождя и природы. Музыку можно включить отдельно ниже.</small></div>`;
 screen.append(wrap);toggleBtn=wrap.querySelector('#farmSfxToggle');options=wrap.querySelector('#farmSfxOptions');
 toggleBtn.addEventListener('click',()=>setEnabled(!prefs.enabled));
 wrap.querySelector('#farmSfxOptionsButton').addEventListener('click',e=>{const open=options.hidden;options.hidden=!open;e.currentTarget.setAttribute('aria-expanded',String(open));if(open)unlock();});
 options.querySelector('[data-farm-volume="fx"]').addEventListener('input',e=>sound.setFxVolume(Number(e.target.value)/100));
 options.querySelector('[data-farm-volume="amb"]').addEventListener('input',e=>{prefs.amb=Math.min(1,Math.max(0,Number(e.target.value)/100));persist();tick(true);});
 wrap.querySelector('#farmTestSound').addEventListener('click',()=>{setEnabled(true);sound.effect('fishSplash');setTimeout(()=>sound.effect('reward'),300);});
}
refreshUI();
const saveWasMuted=!prefs.enabled;
// Some browsers block autoplay: register a gesture on both desktop and touch.
document.addEventListener('pointerdown',()=>{if(prefs.enabled&&!unlocked)unlock();},{capture:true});
document.addEventListener('keydown',()=>{if(prefs.enabled&&!unlocked)unlock();},{capture:true});
setInterval(()=>tick(),1400);
// World-specific actions, without reliance on dynamically replaced card buttons.
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled||!prefs.enabled)return;
 const action=button.dataset.v9;
 if(action){const fx={mine:'mine',place:'build',furniture:'build',gift:'reward',petCare:'feed',petBuy:'buy',breed:'animal',contract:'sell',festival:'festival',hire:'buy',fire:'click',travel:'travel',house:'door',closeDialog:'click'}[action]||'click';
   sound.effect(fx);if(['petBuy','petCare'].includes(action))sound.effect('animal-'+button.dataset.id);return;
 }
 if(button.matches('[data-travel]')){sound.effect('travel');return;}
 if(button.matches('[data-tool]')){sound.effect('select');return;}
 if(button.matches('.seed-buy, .seed-choose, .animal-entry button, .economy-row button, .parcel-entry button, .story-claim, .farm-touch-pad button'))return; // Specific success sounds already in farm.js
 if(button.closest('.farm-sidebar')){sound.effect('click');return;}
 if(button.matches('#backpackToggle,#backpackClose,#sleepQuick,#fullscreenFarm,#farmInteract'))sound.effect('click');
},{capture:false});
// Patch old fullscreen button's sound toggle to reflect the global sound state.
})();
