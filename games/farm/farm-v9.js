/* POLY SCOUT v9: independent expansion module. Original pixel-art, offline-first. */
(() => {
'use strict';
const extraVillagers = [
 ['boris','Борис','Механик',131,23,'#8babc0'],['emma','Эмма','Пекарь',41,35,'#dfb38f'],
 ['greg','Григорий','Строитель',24,39,'#9bba83'],['dasha','Даша','Флорист',37,9,'#c99da9'],
 ['artem','Артём','Шахтёр',56,10,'#a59a89'],['sasha','Саша','Учитель',31,14,'#99b4cb'],
 ['yana','Яна','Ветеринар',98,32,'#e7b694'],['seva','Сева','Кондитер',43,37,'#a1b98d'],
 ['rina','Рина','Художница',55,45,'#c9a0c9'],['kostya','Костя','Почтальон',14,26,'#87b7b2'],
 ['olya','Оля','Садовник',71,40,'#9cb983'],['andrey','Андрей','Капитан',85,70,'#b8a1a1'],
 ['max','Макс','Столяр',113,42,'#c2a37f'],['sofia','София','Врач',28,35,'#d2a3b9'],
 ['polina','Полина','Повар',45,12,'#ddba84'],['valya','Валя','Библиотекарь',37,18,'#aaa6c1'],
 ['fedya','Федя','Рыбак',12,23,'#91bbc0'],['zhanna','Жанна','Ткач',130,47,'#e6ba9c'],
 ['kirill','Кирилл','Фермер',89,39,'#b4c08c'],['milana','Милана','Музыкант',128,65,'#9f96ca']
];
window.POLY_V9_VILLAGERS=extraVillagers.map(([id,name,job,x,y,color],i)=>({id,name,job,x,y,color,hair:['#765343','#9e735e','#514039','#be935e'][i%4],message:['Какой чудесный день в долине!','Если нужна помощь, заходи в деревню.','Наша ярмарка всегда ждёт урожай.','Друзья делают хозяйство уютнее.'][i%4]}));

window.createPolyFarmV9 = function(api){
 const {farm,plants,animalTypes,parcels,stats,save,note,updateHud,refreshEconomy,setupAnimalShop,dayClock,villagers,canvas,ctx,T,W,H,cam}=api;
 const $=id=>document.getElementById(id), n=v=>Math.max(0,Math.floor(Number(v)||0)), price=v=>n(v).toLocaleString('ru-RU')+' ✦';
 const defs = {
  house:{name:'Расширение дома',emoji:'🏠',cost:2100,time:90000,w:6,h:5,desc:'Уютная комната и больше мебели',home:true},
  barn:{name:'Новый хлев',emoji:'🐮',cost:1650,time:90000,w:5,h:5,desc:'Место для большого стада'},
  coop:{name:'Птичник',emoji:'🐣',cost:1200,time:85000,w:5,h:4,desc:'Уютное помещение для птиц'},
  silo:{name:'Силос',emoji:'🌾',cost:900,time:75000,w:3,h:4,desc:'Большой запас корма'},
  greenhouse:{name:'Теплица',emoji:'🌱',cost:2800,time:120000,w:6,h:5,desc:'Сад круглый год'},
  workshop:{name:'Мастерская',emoji:'🔧',cost:3500,time:150000,w:6,h:5,desc:'Оборудование и инструменты'},
  bee:{name:'Пасека',emoji:'🍯',cost:1250,time:95000,w:4,h:4,desc:'Участок для пчёл'},
  gazebo:{name:'Беседка',emoji:'🌸',cost:600,time:40000,w:3,h:3,desc:'Украшение усадьбы'},
  stable:{name:'Конюшня',emoji:'🐎',cost:3100,time:150000,w:6,h:5,desc:'Помещение для лошадей'},
  windmill:{name:'Ветряная мельница',emoji:'🪁',cost:4400,time:220000,w:5,h:6,desc:'Часть фермерского поселения'},
  bridge:{name:'Декоративный мостик',emoji:'🌉',cost:750,time:65000,w:4,h:2,desc:'Переправа через ручей'},
  fountain:{name:'Фонтан',emoji:'⛲',cost:1750,time:95000,w:4,h:4,desc:'Центральная площадь фермы'}
 };
 const furn=[['bed','🛏️','Кровать',400],['table','🪑','Деревянный стол',300],['rug','🧶','Ковёр',220],['lamp','💡','Лампа',180],['flowers','💐','Ваза',140],['books','📚','Книжная полка',650],['sofa','🛋️','Диван',880],['piano','🎹','Пианино',1250],['fire','🔥','Камин',1500],['window','🪟','Большое окно',510],['cabinet','🗄️','Комод',440],['plant','🪴','Комнатное дерево',280]];
 const roles=[['harvest','🌾','Сборщик',540,'Собирает созревший урожай'],['water','💧','Поливальщик',390,'Ускоряет рост посевов'],['animals','🐄','Смотритель',470,'Кормит и собирает продукты']];
 const professions=[['farmer','🌱','Фермерство'],['miner','⛏','Горное дело'],['fisher','🎣','Рыбалка'],['rancher','🐑','Животноводство'],['trader','💰','Торговля']];
 const marketCrops=['wheat','carrot','potato','corn','berry','tomato','cotton','lavender','coffee','pumpkin','apple','tea','melon','peach','rice','vanilla'];
 const mining=['🪨 Камень','🔩 Железо','💎 Сапфир','✨ Редкий кристалл'];
 const travel=[['village','🏘 Деревня',36,13],['mine','⛏ Пещеры',57,10],['market','🛒 Рынок',137,66],['farm','🏡 Усадьба',16,9],['north','🌲 Северный лес',155,18],['beach','🏖 Южный пляж',153,113]];
 let mode='world', placing=null, furnitureView='bed', lastPanel=0;
 const fresh=()=>({friends:{},giftDay:{},buildings:[],furniture:['bed'],workers:[],pets:[],breeding:[],professions:{farmer:0,miner:0,fisher:0,rancher:0,trader:0},mining:{visits:0,stone:0,iron:0,gems:0,crystal:0,last:0},festivalClaims:[],contracts:[],contractDay:0,lastWorkAt:Date.now(),completedWorkers:0});
 farm.v9={...fresh(),...(farm.v9||{})};const v=farm.v9;
 for(const key of ['buildings','furniture','workers','pets','breeding','festivalClaims','contracts'])if(!Array.isArray(v[key]))v[key]=[];
 for(const key of ['friends','giftDay','professions','mining'])if(!v[key]||typeof v[key]!=='object')v[key]={...fresh()[key]};
 const friendLevel=id=>Math.min(5,Math.floor((v.friends[id]||0)/25));
 function rank(id){const xp=v.professions[id]||0;return 1+Math.floor(Math.sqrt(xp/12));}
 function gain(id,amt=1){v.professions[id]=(v.professions[id]||0)+amt;}
 function npcPosition(person){const clock=dayClock();const hour=clock.hour,day=farm.day;const i=villagers.findIndex(o=>o.id===person.id);
  if(hour<8||hour>=22)return {x:person.x,y:person.y};
  const swing=Math.sin(Date.now()/5000+i*1.9)*(.25+(i%4)*.16);
  if(hour>=17&&hour<20)return {x:person.x+Math.sin(day+i)*1.8,y:person.y+Math.cos(day*.7+i)*1.1};
  if(hour>=13&&hour<15)return {x:person.x+Math.sin(i*1.7)*2+ swing,y:person.y+1.8};
  return {x:person.x+swing,y:person.y+Math.cos(Date.now()/6100+i)*.5};
 }
 function dialogue(person){const name=person.name;
  const byWeather={rain:'Дождь — самое время собраться в кафе.',snow:'Снег укрыл долину. Береги тепло в хлеву.',storm:'Во время грозы лучше укрыться дома.',sun:'Отличный день для прогулки и посадок.'};
  const message=(farm.weather!=='auto'&&byWeather[farm.weather])||['Сегодня на рынке особенно оживлённо.','Я люблю прогулки после обеда.','Загляни на праздник урожая!','Давай дружить — дружба открывает новые подарки.'][farm.day%4];
  const already=v.giftDay['talk:'+person.id]===farm.day;
  if(!already){v.friends[person.id]=Math.min(150,(v.friends[person.id]||0)+5);v.giftDay['talk:'+person.id]=farm.day;}
  save();if($('v9Dialog')){$('v9Dialog').hidden=false;$('v9DialogName').textContent=name+' · '+(person.job||'Житель долины')+' · дружба '+friendLevel(person.id)+'/5';$('v9DialogText').textContent=message;}
  return message+(already?'':' · +5 дружбы');
 }
 function paid(cost){if(farm.coins<cost){note('Нужно ещё '+price(cost-farm.coins));return false;}farm.coins-=cost;gain('trader');save();updateHud();return true;}
 function buyGift(id){const p=villagers.find(x=>x.id===id);if(!p)return;if(v.giftDay['gift:'+id]===farm.day)return note('Сегодня подарок уже вручён');
  const stockKeys=Object.keys(farm.stock).filter(key=>farm.stock[key]>0);
  if(stockKeys.length){farm.stock[stockKeys[0]]--;}else if(!paid(55))return;
  v.giftDay['gift:'+id]=farm.day;v.friends[id]=Math.min(150,(v.friends[id]||0)+15);save();note('🎁 Подарок для '+p.name+'! Дружба +15');renderPanels(true);
 }
 function festival(){return [{id:'flowers',name:'🌸 Весенний бал',reward:380},{id:'harvest',name:'🌾 Праздник урожая',reward:550},{id:'snow',name:'❄ Зимняя ярмарка',reward:650},{id:'summer',name:'☀ Летний фестиваль',reward:450}][Math.floor((farm.day-1)/8)%4];}
 function festivalClaim(){const key=Math.floor((farm.day-1)/8),f=festival();if(v.festivalClaims.includes(key))return note('Награда этого праздника уже получена');v.festivalClaims.push(key);farm.coins+=f.reward;gain('trader',4);save();updateHud();note(f.name+' · '+price(f.reward));renderPanels(true);}
 function isBuildable(x,y,w,h){if(x<4||y<4||x+w>=176||y+h>=136)return false;
  if(x<113&&y<109)return false; // New eastern / southern expansion zones only. Protects old world artwork and fields.
  if(parcels.some(p=>!(x+w<=p.x||x>=p.x+p.w||y+h<=p.y||y>=p.y+p.h)))return false;
  if(v.buildings.some(b=>{const d=defs[b.id];return d&&!(x+w<=b.x||x>=b.x+d.w||y+h<=b.y||y>=b.y+d.h)}))return false;
  return true;
 }
 function placeAt(x,y){if(!placing)return false;const def=defs[placing];if(!def)return false;
  if(!isBuildable(x,y,def.w,def.h)){note('Место занято. Строй в восточных и южных новых районах');return true;}
  if(!paid(def.cost))return true;
  const b={id:placing,x,y,createdAt:Date.now(),readyAt:Date.now()+def.time};v.buildings.push(b);placing=null;save();note('Стройка началась: '+def.name+'!');renderPanels(true);return true;
 }
 function buildClick(id){const def=defs[id];if(!def)return;if(id==='house'){const current=v.buildings.filter(b=>b.id==='house').length;const upgrade=price(def.cost*(1+current));note('Выбери место для '+def.name+'. Стоимость '+upgrade);}
  placing=id;mode='world';note('🏗 Выбери свободное место в новом районе на карте и кликни по земле');renderPanels(true);
 }
 function buyFurn(id){const item=furn.find(i=>i[0]===id);if(!item)return;if(v.furniture.includes(id)){furnitureView=id;drawHouse();return;}if(!paid(item[3]))return;v.furniture.push(id);furnitureView=id;save();drawHouse();renderPanels(true);}
 function drawHouse(){const c=$('v9HouseCanvas');if(!c)return;const g=c.getContext('2d'),width=c.width,height=c.height;
  g.fillStyle='#f1d8af';g.fillRect(0,0,width,height);g.fillStyle='#cba67c';g.fillRect(0,0,width,58);g.fillStyle='#8b6c56';g.fillRect(0,height-88,width,88);
  for(let x=0;x<width;x+=42){g.fillStyle=x%84===0?'#9c7355':'#ac835e';g.fillRect(x,height-86,2,86);}
  g.fillStyle='#8a5445';g.fillRect(12,10,width-24,13);g.fillStyle='#f9e0ab';g.fillRect(22,35,95,80);g.fillStyle='#7daeb2';g.fillRect(30,43,79,64);
  g.strokeStyle='#f3d7a8';g.lineWidth=6;g.strokeRect(26,39,87,72);g.beginPath();g.moveTo(70,40);g.lineTo(70,109);g.stroke();
  g.fillStyle='#f4e4c7';g.font='bold 18px sans-serif';g.fillText('МОЙ УЮТНЫЙ ДОМ',142,33);
  const positions=[[28,170],[116,155],[204,158],[290,166],[60,247],[150,240],[244,240],[333,239],[385,159],[375,262],[450,233],[450,154]];
  const em=v.furniture.map(k=>furn.find(q=>q[0]===k)).filter(Boolean);em.forEach((item,i)=>{const [x,y]=positions[i%positions.length];g.font='35px system-ui';g.fillText(item[1],x,y);});
  g.fillStyle='#f3dfbd';g.fillRect(18,height-34,width-36,25);g.fillStyle='#70523d';g.font='13px sans-serif';g.fillText('Мебель: '+v.furniture.length+'/'+furn.length+' · твой дом сохраняется',30,height-17);
 }
 function petBuy(type){const opts={dog:['🐕','Собака',1250],cat:['🐈','Кошка',850],horse:['🐎','Лошадь',3600]};const option=opts[type];if(!option||v.pets.some(p=>p.type===type))return;if(!paid(option[2]))return;
  const name=prompt('Как зовут питомца?',option[1]);if(name===null){farm.coins+=option[2];save();updateHud();return;}v.pets.push({type,name:name.trim().slice(0,24)||option[1],affection:0,lastFedAt:0});save();note('Новый питомец: '+name);renderPanels(true);
 }
 function petCare(type){const p=v.pets.find(x=>x.type===type);if(!p)return;if(Date.now()-p.lastFedAt<60000)return note('Питомец только что поел');if(farm.supplies.feed>0)farm.supplies.feed--;else if(!paid(22))return;p.lastFedAt=Date.now();p.affection=Math.min(100,p.affection+12);save();note('❤️ '+p.name+': доверие '+p.affection+'/100');renderPanels(true);}
 function animalBreed(type){const t=animalTypes.find(x=>x.id===type),adults=farm.animals.filter(a=>a.type===type && (!a.babyUntil||a.babyUntil<=Date.now()));if(!t||adults.length<2)return note('Для разведения нужны два взрослых животных одного вида');
  if(v.breeding.some(q=>q.type===type))return note('Детёныш уже ожидается');if(!paid(Math.max(50,n(t.feed)*6)))return;
  v.breeding.push({type,readyAt:Date.now()+Math.max(180000,t.wait*2)});save();note('🐣 Скоро появится малыш: '+t.name);renderPanels(true);
 }
 function advanceBreed(){let changed=false;for(const b of [...v.breeding]){if(Date.now()<b.readyAt)continue;farm.animals.push({id:b.type+'-baby-'+Date.now(),type:b.type,nextReadyAt:0,boughtAt:Date.now(),babyUntil:Date.now()+180000});v.breeding.splice(v.breeding.indexOf(b),1);changed=true;}if(changed){save();setupAnimalShop();note('🐣 На ранчо родились детёныши!');}}
 function hire(role){const def=roles.find(r=>r[0]===role);if(!def||v.workers.some(w=>w.role===role))return;if(!paid(def[3]))return;v.workers.push({role,level:1,worked:0});v.lastWorkAt=Date.now();save();note('Нанят работник: '+def[2]);renderPanels(true);}
 function fire(role){v.workers=v.workers.filter(w=>w.role!==role);save();renderPanels(true);note('Работник завершил работу');}
 function workOffline(){const current=Date.now(),delta=Math.max(0,Math.min(current-(v.lastWorkAt||current),8*3600*1000));if(!v.workers.length){v.lastWorkAt=current;return;}
  let cycles=Math.min(60,Math.floor(delta/85000));
  if(cycles===0)return;v.lastWorkAt=Math.min(current,(v.lastWorkAt||current)+cycles*85000);let actions=0,charged=false;
  for(let step=0;step<cycles;step++)for(const worker of v.workers){const wage=worker.role==='harvest'?17:worker.role==='water'?12:14;if(farm.coins<wage)continue;farm.coins-=wage;charged=true;worker.worked++;const lvl=worker.level||1;
   if(worker.role==='harvest'){const ready=Object.entries(farm.tiles).filter(([key,t])=>t.crop&&t.crop.readyAt<=current).slice(0,1+lvl);for(const [key,t] of ready){const crop=plants[t.crop.type];if(!crop || (!farm.autoTrade&&!ensureCapacity()))continue;const cropId=t.crop.type;delete t.crop;t.tilled=true;farm.harvests++;farm.stats.earned+=farm.autoTrade?crop.sell:0;if(farm.autoTrade)farm.coins+=crop.sell;else if(ensureCapacity()){farm.stock['crop:'+cropId]=(farm.stock['crop:'+cropId]||0)+1;}actions++;gain('farmer');}}
   if(worker.role==='water'){for(const tile of Object.values(farm.tiles).filter(t=>t.crop&&t.crop.readyAt>current).slice(0,2+lvl)){tile.wetUntil=current+30000;tile.crop.readyAt=Math.max(current+1500,tile.crop.readyAt-8000);actions++;}}
   if(worker.role==='animals'){for(const animal of farm.animals.slice(0,2+lvl)){const t=animalTypes.find(o=>o.id===animal.type);if(!t||animal.babyUntil>current||(!farm.autoTrade&&!ensureCapacity()))continue;if(!animal.nextReadyAt){animal.nextReadyAt=current+t.wait;actions++;}else if(animal.nextReadyAt<=current){if(farm.autoTrade){farm.coins+=t.yield;farm.stats.earned+=t.yield;}else if(ensureCapacity()){const key='animal:'+t.id;farm.stock[key]=(farm.stock[key]||0)+1;}animal.nextReadyAt=current+t.wait;farm.stats.animalGoods++;gain('rancher');actions++;}}}
   if(worker.worked%25===0)worker.level=Math.min(5,lvl+1);
  }
  if(charged||actions){v.completedWorkers+=actions;save();updateHud();if(actions)note('Работники позаботились о ферме: '+actions+' действий. Зарплата списана.');}
 }
 function newContracts(){if(v.contractDay===farm.day&&v.contracts.length)return;v.contractDay=farm.day;v.contracts=[0,1,2].map((_,i)=>{const crop=marketCrops[(farm.day*3+i*5)%marketCrops.length];const count=2+i+(farm.day%3);return {crop,count,bonus:Math.round((plants[crop]?.sell||20)*count*(1.25+i*.1)),done:false};});save();}
 function contractSell(i){newContracts();const q=v.contracts[i],key='crop:'+q?.crop;if(!q||q.done)return;if((farm.stock[key]||0)<q.count)return note('Для контракта нужно сырьё на складе');farm.stock[key]-=q.count;q.done=true;farm.coins+=q.bonus;gain('trader',q.count);farm.stats.earned+=q.bonus;save();updateHud();refreshEconomy();renderPanels(true);note('📦 Контракт выполнен! '+price(q.bonus));}
 function mine(){const time=Date.now();if(time-(v.mining.last||0)<28000)return note('⏳ Подожди, пока охладится кирка');if(farm.energy<8)return note('Сначала отдохни: нужно 8 сил');farm.energy-=8;v.mining.last=time;v.mining.visits++;const t=Math.random();const index=t<.44?0:t<.77?1:t<.95?2:3;const key=['stone','iron','gems','crystal'][index];v.mining[key]=(v.mining[key]||0)+1;const reward=[35,75,145,390][index];farm.coins+=reward;gain('miner',index+1);save();updateHud();note(mining[index]+' · найдено! +'+price(reward));renderPanels(true);}
 function weatherEconomyMultiplier(){const s=Math.floor((farm.day-1)/8)%4;return [1.05,1.12,1.2,1.28][s];}
 function ensureCapacity(){const cap=farm.generalUpgrades.includes('barnstorage')?600:80;return Object.values(farm.stock).reduce((a,b)=>a+n(b),0)<cap;}
 function drawWorld(){const g=ctx,x0=cam.x,y0=cam.y;function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  const areas=[[147,11,9,6,'#bb8b65','#b85e4d'],[148,51,9,6,'#c9a371','#537e89'],[147,103,10,7,'#e0b879','#9d695c'],[123,120,10,7,'#d5ae7e','#689c8a']];
  // Roads and additions on the eastern/southern map. Frame-culling keeps animation inexpensive.
  for(const [x,y,w,h,wall,roof] of areas){const X=x*T-x0,Y=y*T-y0;if(X>W+250||X+w*T<-100||Y>H+200||Y+h*T<-100)continue;rect(X-16,Y+h*T-8,w*T+34,16,'#bd9b6d');rect(X,Y+40,w*T,h*T-42,wall);rect(X-12,Y+22,w*T+24,24,roof);rect(X+42,Y+70,48,68,'#725c50');for(let z=0;z<3;z++)rect(X+150+z*46,Y+80,30,35,'#97c6c1');}
  for(let yy=111;yy<135;yy++)for(let xx=134;xx<177;xx++){const X=xx*T-x0,Y=yy*T-y0;if(X<-T||X>W+T||Y<-T||Y>H+T)continue;if((xx+yy)%6===0)rect(X+7,Y+15,8,3,'#e4d88e');}
  for(const [x,y] of [[144,8],[165,13],[155,42],[160,66],[155,92],[144,127]]){const X=x*T-x0,Y=y*T-y0;if(X<-60||X>W+60||Y<-60||Y>H+60)continue;rect(X,Y-15,10,60,'#67553d');rect(X-20,Y-47,55,42,'#3e8357');rect(X-29,Y-25,69,30,'#47975e');rect(X-22,Y-53,56,10,'#76b970');}
  for(const b of v.buildings){const d=defs[b.id];if(!d)continue;const X=b.x*T-x0,Y=b.y*T-y0,w=d.w*T,h=d.h*T;if(X>W+30||Y>H+30||X+w<0||Y+h<0)continue;const ready=Date.now()>=b.readyAt;rect(X+5,Y+h-18,w-4,18,'#6a7e50');rect(X+5,Y+30,w-8,h-43,ready?'#d4b48a':'#bcb39c');rect(X-5,Y+24,w+10,18,ready?'#ae7160':'#907970');rect(X+18,Y+60,30,36,'#866348');if(!ready){rect(X+2,Y+4,w,14,'#edd7a3');rect(X+w-24,Y+5,14,h-4,'#b38652');}g.font='23px system-ui';g.fillText(ready?d.emoji:'🏗',X+20,Y+22);}
  if(placing){const d=defs[placing];const x=Math.round(farm.player.x),y=Math.round(farm.player.y),X=x*T-x0,Y=y*T-y0;g.save();g.globalAlpha=.44;rect(X,Y,d.w*T,d.h*T,'#f6e8b8');g.restore();}
 }
 function drawPets(){const p=farm.player;for(let i=0;i<v.pets.length;i++){const pet=v.pets[i],x=p.x*T-cam.x+(i-1)*40+Math.sin(Date.now()/550+i)*4,y=p.y*T-cam.y+30+Math.cos(Date.now()/730+i)*3;ctx.font='27px system-ui';ctx.fillText(({dog:'🐕',cat:'🐈',horse:'🐎'}[pet.type]||'🐾'),x,y);} }
 function renderPanels(force=false){if(!force && Date.now()-lastPanel<6000)return;lastPanel=Date.now();advanceBreed();newContracts();
  const npc=$('v9NpcBoard');if(npc){npc.innerHTML=villagers.map(p=>`<div class="v9-line"><span><strong>${p.name}</strong><small>${p.job||'Житель'} · дружба ${friendLevel(p.id)}/5</small></span><button data-v9="gift" data-id="${p.id}">🎁 Подарок</button></div>`).join('');}
  const builds=$('v9BuildingBoard');if(builds){builds.innerHTML=Object.entries(defs).map(([id,d])=>`<div class="v9-line"><span><strong>${d.emoji} ${d.name}</strong><small>${d.desc} · ${d.w}×${d.h} клеток</small></span><button data-v9="place" data-id="${id}">${price(d.cost)}</button></div>`).join('')+'<p class="v9-footnote">После выбора постройки нажми на свободное место в новых восточных или южных районах игрового поля. Строительство занимает реальное время.</p>'+v.buildings.map(b=>{const d=defs[b.id];return `<div class="v9-line"><span>${d?.emoji||'🏗'} ${d?.name||b.id}</span><small>${Date.now()>=b.readyAt?'✓ Готово':'Строится · '+Math.ceil((b.readyAt-Date.now())/60000)+' мин'}</small></div>`;}).join('');}
  const f=$('v9FurnitureBoard');if(f){f.innerHTML=furn.map(item=>`<div class="v9-line"><span>${item[1]} ${item[2]}</span><button data-v9="furniture" data-id="${item[0]}">${v.furniture.includes(item[0])?'✓ Есть':price(item[3])}</button></div>`).join('');}
  const ws=$('v9WorkerBoard');if(ws){ws.innerHTML=roles.map(q=>{const w=v.workers.find(z=>z.role===q[0]);return `<div class="v9-line"><span><strong>${q[1]} ${q[2]}</strong><small>${q[4]} · зарплата каждые 85 секунд · ${w?'ур. '+w.level:'не нанят'}</small></span><button data-v9="${w?'fire':'hire'}" data-id="${q[0]}">${w?'Уволить':price(q[3])}</button></div>`;}).join('')+'<small>Работники действуют и после закрытия вкладки (при входе рассчитывается до 8 часов). Учитываются зарплаты, наличие урожая и ресурсов. Выполнено задач: '+n(v.completedWorkers)+'.</small>';
  }
  const ps=$('v9PetBoard');if(ps){ps.innerHTML=[['dog','🐕','Собака',1250],['cat','🐈','Кошка',850],['horse','🐎','Лошадь',3600]].map(q=>{const p=v.pets.find(x=>x.type===q[0]);return `<div class="v9-line"><span><strong>${q[1]} ${p?.name||q[2]}</strong><small>${p?'Доверие '+p.affection+'/100':'Не куплен'}</small></span><button data-v9="${p?'petCare':'petBuy'}" data-id="${q[0]}">${p?'Покормить':price(q[3])}</button></div>`;}).join('');}
  const breed=$('v9BreedBoard');if(breed){breed.innerHTML=animalTypes.filter(t=>farm.animals.filter(a=>a.type===t.id).length>=2).map(t=>`<div class="v9-line"><span>${t.icon} ${t.name}</span><button data-v9="breed" data-id="${t.id}">${v.breeding.some(b=>b.type===t.id)?'⏳ Ждём':'Разводить'}</button></div>`).join('')||'<p>Купи два животных одного вида, чтобы появилось разведение.</p>';
   breed.innerHTML+='<p class="v9-footnote">'+(v.breeding.length?v.breeding.map(q=>'🐣 '+(animalTypes.find(a=>a.id===q.type)?.name||q.type)+' — '+Math.max(1,Math.ceil((q.readyAt-Date.now())/60000))+' мин').join(' · '):'Детёныши взрослеют по реальному времени.')+'</p>';
  }
  const co=$('v9ContractBoard');if(co){co.innerHTML=v.contracts.map((q,i)=>`<div class="v9-line"><span><strong>${plants[q.crop]?.icon||'🌿'} ${plants[q.crop]?.name||q.crop} ×${q.count}</strong><small>На складе ${(farm.stock['crop:'+q.crop]||0)} · награда ${price(q.bonus)}</small></span><button data-v9="contract" data-id="${i}" ${q.done?'disabled':''}>${q.done?'✓ Выполнено':'Продать'}</button></div>`).join('');}
  const pro=$('v9ProfessionBoard');if(pro){pro.innerHTML=professions.map(p=>`<div class="v9-prof"><span>${p[1]} ${p[2]}</span><b>ур. ${rank(p[0])}</b><small>${n(v.professions[p[0]])} опыта</small></div>`).join('');}
  const festiv=$('v9FestivalBoard');if(festiv){const f=festival(),key=Math.floor((farm.day-1)/8);festiv.innerHTML='<strong>'+f.name+'</strong><p>Фестиваль этого сезона. Подарок за участие: '+price(f.reward)+'.</p><button data-v9="festival" '+(v.festivalClaims.includes(key)?'disabled':'')+'>'+(v.festivalClaims.includes(key)?'✓ Участвовал':'Принять участие')+'</button>';}
  const mini=$('v9MiniStats');if(mini)mini.textContent=villagers.length+' NPC · '+v.workers.length+' работников · '+v.pets.length+' питомцев · '+v.buildings.length+' построек';
  drawHouse();
 }
 function act(type,id){switch(type){case 'gift':return buyGift(id);case 'place':return buildClick(id);case 'furniture':return buyFurn(id);case 'hire':return hire(id);case 'fire':return fire(id);case 'petBuy':return petBuy(id);case 'petCare':return petCare(id);case 'breed':return animalBreed(id);case 'contract':return contractSell(Number(id));case 'festival':return festivalClaim();case 'mine':return mine();case 'house':mode=mode==='house'?'world':'house';$('v9HouseView').hidden=mode!=='house';drawHouse();return;case 'closeDialog':$('v9Dialog').hidden=true;return;case 'travel':{const pos=travel.find(t=>t[0]===id);if(pos){farm.player.x=pos[2];farm.player.y=pos[3];note('🧭 '+pos[1]);save();}return;}}
 }
 document.addEventListener('click',e=>{const el=e.target.closest('[data-v9]');if(!el)return;act(el.dataset.v9,el.dataset.id||'');});
 document.addEventListener('keydown',e=>{if(e.code==='Escape'){placing=null;$('v9Dialog').hidden=true;renderPanels(true);}if(e.code==='KeyH'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){mode=mode==='house'?'world':'house';$('v9HouseView').hidden=mode!=='house';drawHouse();}});
 function moveArea(x,y){return placeAt(x,y);}
 function fastAdvance(){advanceBreed();workOffline();renderPanels();}
 workOffline();save();renderPanels(true);setInterval(fastAdvance,30000);
 return {npcPosition,dialogue,drawWorld,drawPets,placeAt:moveArea,renderPanels,festivalClaim,mine, gain,advanceBreed,workOffline};
};
})();
