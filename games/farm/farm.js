(() => {
'use strict';
const canvas=document.getElementById('farm'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const W=960,H=576,T=32,MW=176,MH=136,STORAGE='poly-scout-farm-v3';
const $=id=>document.getElementById(id);
const sound=new PlaygroundAudio('farm');
window.PolyFarmSound=sound;
let nextFootstepAt=0;
const world = new PixelValley(ctx,W,H,T,MW,MH);
let v9=null;
let fishingCooldown=0;
let fishingVisual=null; // Animated rod, cast, line, bobber and reel. Does not change save format.
let audioRainEnabled=true,lastRainAdvance=Date.now(),lastFarmSoundRegion=0;
const plants={
 carrot:{name:'Морковь',icon:'🥕',price:8,sell:21,grow:35000,body:'#ed8e42',leaf:'#609b4e'},
 potato:{name:'Картофель',icon:'🥔',price:13,sell:34,grow:55000,body:'#e0b774',leaf:'#79a85b'},
 berry:{name:'Клубника',icon:'🍓',price:22,sell:57,grow:85000,body:'#db545a',leaf:'#528e55'},
 flower:{name:'Ромашки',icon:'🌼',price:16,sell:44,grow:65000,body:'#f4ce73',leaf:'#689a53'},
 tomato:{name:'Помидор',icon:'🍅',price:18,sell:46,grow:75000,body:'#d85b49',leaf:'#538a4b'},
 corn:{name:'Кукуруза',icon:'🌽',price:24,sell:64,grow:90000,body:'#f5d36b',leaf:'#67974e'},
 pumpkin:{name:'Тыква',icon:'🎃',price:30,sell:85,grow:125000,body:'#e89b46',leaf:'#5f8a4c'},
 blueberry:{name:'Черника',icon:'🫐',price:26,sell:72,grow:105000,body:'#7775b4',leaf:'#43835c'},
 cabbage:{name:'Капуста',icon:'🥬',price:16,sell:40,grow:65000,body:'#83bc7e',leaf:'#508a58'},
 pepper:{name:'Перец',icon:'🫑',price:22,sell:59,grow:82000,body:'#e0ad59',leaf:'#568950'},
 melon:{name:'Арбуз',icon:'🍉',price:34,sell:98,grow:140000,body:'#6baf66',leaf:'#488044'},
 wheat:{name:'Пшеница',icon:'🌾',price:10,sell:28,grow:49000,body:'#e6c66b',leaf:'#baa15a'},
 grape:{name:'Виноград',icon:'🍇',price:28,sell:77,grow:100000,body:'#9583bf',leaf:'#4b8050'},
 apple:{name:'Яблоня',icon:'🍎',price:48,sell:123,grow:180000,body:'#d75d59',leaf:'#4f9450'},
 peach:{name:'Персик',icon:'🍑',price:45,sell:118,grow:165000,body:'#e8a474',leaf:'#56894b'},
 pear:{name:'Груша',icon:'🍐',price:39,sell:110,grow:152000,body:'#dfca6e',leaf:'#61914a'},
 sunflower:{name:'Подсолнух',icon:'🌻',price:20,sell:53,grow:85000,body:'#e7b84c',leaf:'#579651'},
 radish:{name:'Редис',icon:'🌱',price:7,sell:18,grow:28000,body:'#e66b84',leaf:'#67ac6b'},
 onion:{name:'Лук',icon:'🧅',price:14,sell:38,grow:60000,body:'#d9bb86',leaf:'#72995b'},
 eggplant:{name:'Баклажан',icon:'🍆',price:29,sell:79,grow:110000,body:'#8165a0',leaf:'#5d8b55'},
 pineapple:{name:'Ананас',icon:'🍍',price:52,sell:145,grow:175000,body:'#e7be5b',leaf:'#658b5a'},
 raspberry:{name:'Малина',icon:'🍇',price:26,sell:69,grow:98000,body:'#c75270',leaf:'#5f955b'},
 lavender:{name:'Лаванда',icon:'🪻',price:21,sell:55,grow:76000,body:'#b49acb',leaf:'#70915d'},
 cotton:{name:'Хлопок',icon:'☁',price:25,sell:62,grow:93000,body:'#eee9d9',leaf:'#6e995c'},
 beet:{name:'Свёкла',icon:'🫜',price:16,sell:43,grow:114000,body:'#b15062',leaf:'#66945b'},
 cucumber:{name:'Огурец',icon:'🥒',price:23,sell:68,grow:178000,body:'#73b46e',leaf:'#518d50'},
 garlic:{name:'Чеснок',icon:'🧄',price:17,sell:49,grow:157000,body:'#eee1b8',leaf:'#668d55'},
 broccoli:{name:'Брокколи',icon:'🥦',price:28,sell:81,grow:243000,body:'#538e61',leaf:'#477746'},
 cauliflower:{name:'Цветная капуста',icon:'🥬',price:29,sell:82,grow:267000,body:'#e3e7bb',leaf:'#579168'},
 spinach:{name:'Шпинат',icon:'🌿',price:12,sell:31,grow:104000,body:'#449561',leaf:'#387954'},
 rice:{name:'Рис',icon:'🍚',price:27,sell:77,grow:318000,body:'#e6d9a4',leaf:'#77a268'},
 mushroom:{name:'Грибы',icon:'🍄',price:38,sell:115,grow:420000,body:'#cc846b',leaf:'#69875a'},
 tea:{name:'Чай',icon:'🍵',price:54,sell:158,grow:540000,body:'#7bac71',leaf:'#518351'},
 coffee:{name:'Кофе',icon:'☕',price:64,sell:188,grow:620000,body:'#906d59',leaf:'#5a8b60'},
 cherry:{name:'Вишня',icon:'🍒',price:35,sell:101,grow:350000,body:'#c5595e',leaf:'#5c995c'},
 lemon:{name:'Лимон',icon:'🍋',price:47,sell:138,grow:510000,body:'#f1d26b',leaf:'#6b9b5b'},
 orange:{name:'Апельсин',icon:'🍊',price:51,sell:152,grow:590000,body:'#ec9a54',leaf:'#4e8656'},
 kiwi:{name:'Киви',icon:'🥝',price:57,sell:172,grow:690000,body:'#9db56b',leaf:'#538953'},
 banana:{name:'Банан',icon:'🍌',price:69,sell:205,grow:810000,body:'#f0d36b',leaf:'#568a54'},
 coconut:{name:'Кокос',icon:'🥥',price:79,sell:238,grow:880000,body:'#9f765b',leaf:'#5b8859'},
 pomegranate:{name:'Гранат',icon:'🍎',price:77,sell:240,grow:930000,body:'#c95a65',leaf:'#578c55'},
 fig:{name:'Инжир',icon:'🌳',price:63,sell:203,grow:760000,body:'#a275ab',leaf:'#567e59'},
 olive:{name:'Оливки',icon:'🫒',price:82,sell:259,grow:1060000,body:'#7b905d',leaf:'#4f814d'},
 vanilla:{name:'Ваниль',icon:'🌸',price:98,sell:315,grow:1220000,body:'#eee1aa',leaf:'#6f9b6e'},
 truffle:{name:'Трюфель',icon:'🍄',price:115,sell:380,grow:1560000,body:'#866c5c',leaf:'#507b57'},
 starfruit:{name:'Карамбола',icon:'⭐',price:125,sell:408,grow:1750000,body:'#f3c95a',leaf:'#4f8454'},
 dragonfruit:{name:'Питахайя',icon:'🐉',price:135,sell:440,grow:1960000,body:'#d76694',leaf:'#5b975f'},
 saffron:{name:'Шафран',icon:'🌺',price:170,sell:575,grow:2250000,body:'#d99dc2',leaf:'#688951'}
};

const EXTRA_CROPS=[
 ['oat','Овёс','🌾',28,82,204000,'#d6c37d','#74a46b'],['barley','Ячмень','🌾',34,103,270000,'#e3b970','#86b378'],
 ['rye','Рожь','🌾',37,108,310000,'#d1aa62','#75a96a'],['beans','Фасоль','🫘',41,129,280000,'#bc815b','#65a16e'],
 ['peas','Горошек','🫛',27,84,190000,'#7dbc64','#5e9c52'],['mint','Мята','🌿',33,101,320000,'#76bd9a','#609d87'],
 ['basil','Базилик','🌿',39,117,380000,'#648d68','#4e804f'],['rosemary','Розмарин','🌱',46,139,470000,'#96ac90','#688d70'],
 ['ginger','Имбирь','🫚',54,166,490000,'#d9b37e','#79a465'],['avocado','Авокадо','🥑',87,277,960000,'#86af61','#5f8d53'],
 ['mango','Манго','🥭',103,342,1180000,'#e0aa64','#638f55'],['papaya','Папайя','🍈',96,311,1140000,'#d6bb73','#659d5c'],
 ['plum','Слива','🟣',58,189,620000,'#8877b4','#568f69'],['apricot','Абрикос','🍑',63,205,650000,'#d79e67','#6ba164'],
 ['blackberry','Ежевика','🫐',42,139,580000,'#786a9d','#6b985e'],['cranberry','Клюква','🍒',49,158,640000,'#ba5a62','#62945c'],
 ['buckwheat','Гречиха','🌾',39,119,310000,'#d5b383','#7dac72'],['sesame','Кунжут','🌾',67,220,730000,'#ddd0a5','#78a26f'],
 ['peanut','Арахис','🥜',73,241,810000,'#c69b6e','#699d65'],['sweetpotato','Батат','🍠',66,218,740000,'#b78068','#67995c'],
 ['lotus','Лотос','🪷',117,397,1420000,'#dda7bc','#6f9f74'],['orchid','Орхидея','🌺',145,481,1820000,'#d09ac4','#6fa16e'],
 ['cocoa','Какао','🍫',168,550,2240000,'#88634f','#619259'],['hops','Хмель','🌿',84,278,960000,'#7ab56d','#4e894e'],
 ['aloe','Алоэ','🌵',103,354,1250000,'#7aaf84','#659b6d'],['triticale','Тритикале','🌾',61,204,730000,'#c3ac81','#77a366'],
 ['persimmon','Хурма','🍊',124,419,1560000,'#e8a269','#659b5e'],['dates','Финики','🌴',190,640,2700000,'#b28664','#73935b'],
 ['almond','Миндаль','🌰',152,501,1980000,'#c6a579','#608e64'],['chestnut','Каштан','🌰',158,532,2160000,'#9d7560','#658f5b'],
 ['hibiscus','Гибискус','🌺',129,439,1760000,'#d77699','#609e6c'],['elderberry','Бузина','🫐',86,281,1040000,'#775e9a','#649566']
];
for(const [id,name,icon,price,sell,grow,body,leaf] of EXTRA_CROPS){plants[id]={name,icon,price,sell,grow,body,leaf};}

const PARCELS=[
 {id:'south',name:'Луговая терраса',price:260,x:25,y:39,w:12,h:10,icon:'🌾',description:'120 клеток под поля и цветы'},
 {id:'east',name:'Восточный огород',price:470,x:63,y:14,w:13,h:12,icon:'🍓',description:'156 клеток у лесной дороги'},
 {id:'river',name:'Речная плантация',price:760,x:61,y:39,w:15,h:12,icon:'🌿',description:'180 клеток для большого урожая'},
 {id:'forest',name:'Лесная поляна',price:1250,x:83,y:12,w:16,h:13,icon:'🌲',description:'208 клеток среди леса'},
 {id:'bay',name:'Южная бухта',price:2300,x:82,y:48,w:19,h:13,icon:'🌊',description:'247 клеток возле побережья'},
 {id:'cliff',name:'Горный виноградник',price:3900,x:102,y:10,w:15,h:18,icon:'🍇',description:'270 клеток на холмах'},
 {id:'island',name:'Островной сад',price:6200,x:99,y:64,w:19,h:18,icon:'🏝️',description:'342 клетки для редких культур'},
 {id:'sun',name:'Солнечное ранчо',price:9300,x:43,y:60,w:23,h:18,icon:'🌻',description:'414 клеток для большой фермы'},
 {id:'northplain',name:'Золотой луг',price:12700,x:125,y:73,w:18,h:15,icon:'🌼',description:'270 клеток на восточной равнине'},
 {id:'marsh',name:'Туманный огород',price:17400,x:107,y:94,w:18,h:14,icon:'🌿',description:'252 клетки у заболоченной реки'},
 {id:'harvestland',name:'Большая жатва',price:26500,x:79,y:92,w:22,h:16,icon:'🚜',description:'352 клетки для трактора'},
 {id:'northern',name:'Северная роща',price:32200,x:143,y:7,w:22,h:16,icon:'🌲',description:'352 клетки у деревни'},
 {id:'diamond',name:'Алмазная долина',price:39800,x:141,y:31,w:25,h:18,icon:'⛏',description:'450 клеток у холмов'},
 {id:'harbor',name:'Прибрежные сады',price:48700,x:145,y:76,w:19,h:16,icon:'🌴',description:'304 клетки у пристани'},
 {id:'golden',name:'Золотая терраса',price:56400,x:134,y:113,w:22,h:19,icon:'🌻',description:'418 клеток на юге'},
 {id:'marigold',name:'Бархатный сад',price:69900,x:109,y:114,w:20,h:18,icon:'🌷',description:'360 клеток редких цветов'},
 {id:'ultimate',name:'Земля миллионера',price:98000,x:160,y:112,w:13,h:20,icon:'👑',description:'260 клеток для элитных культур'}
];
const QUESTS=[
 {id:'first',name:'Добро пожаловать в долину',text:'Собери 5 растений',metric:'harvests',target:5,reward:100,icon:'🌱'},
 {id:'seed',name:'Запасы для соседей',text:'Посади 12 семян',metric:'planted',target:12,reward:130,icon:'🌾'},
 {id:'water',name:'Дождевой танец',text:'Полей 10 грядок',metric:'watered',target:10,reward:110,icon:'💧'},
 {id:'fish',name:'История рыбака',text:'Поймай 3 рыбки в озере',metric:'fished',target:3,reward:175,icon:'🐟'},
 {id:'fruit',name:'Фруктовая посылка',text:'Собери 9 фруктов в саду',metric:'foraged',target:9,reward:180,icon:'🍎'},
 {id:'harvest',name:'Большой урожай',text:'Собери 20 растений',metric:'harvests',target:20,reward:280,icon:'🥕'},
 {id:'trade',name:'День на ярмарке',text:'Заработай 600 монет на урожае',metric:'earned',target:600,reward:200,icon:'🧺'},
 {id:'visitor',name:'Исследователь долины',text:'Посети 4 района по карте',metric:'visited',target:4,reward:150,icon:'🗺️'},
 {id:'seed2',name:'Лесной садовник',text:'Посади 35 семян',metric:'planted',target:35,reward:360,icon:'🌳'},
 {id:'water2',name:'Заботливые руки',text:'Полей 30 грядок',metric:'watered',target:30,reward:300,icon:'🌻'},
 {id:'fish2',name:'Легенда озера',text:'Поймай 12 рыбок',metric:'fished',target:12,reward:500,icon:'🎣'},
 {id:'grand',name:'Праздник урожая',text:'Собери 70 растений',metric:'harvests',target:70,reward:900,icon:'🏅'},
 {id:'friends',name:'Знакомство с долиной',text:'Поговори с 3 жителями',metric:'talked',target:3,reward:210,icon:'💌'},
 {id:'twenty',name:'Сорок ростков',text:'Посади 70 семян',metric:'planted',target:70,reward:510,icon:'🌱'},
 {id:'veteran',name:'Сто урожаев',text:'Собери 100 культур',metric:'harvests',target:100,reward:950,icon:'🥕'},
 {id:'farmer',name:'Большие поля',text:'Вскопай и посади 180 семян',metric:'planted',target:180,reward:1800,icon:'🌾'},
 {id:'granger',name:'Урожайная долина',text:'Собери 250 растений',metric:'harvests',target:250,reward:2750,icon:'🌽'},
 {id:'trader',name:'Выгодная торговля',text:'Продай урожая на 5000 монет',metric:'earned',target:5000,reward:1200,icon:'💰'},
 {id:'trader2',name:'Гильдия фермеров',text:'Продай урожая на 16000 монет',metric:'earned',target:16000,reward:3200,icon:'📦'},
 {id:'river2',name:'Рыбацкая деревня',text:'Вылови 35 рыб',metric:'fished',target:35,reward:1300,icon:'🐠'},
 {id:'river3',name:'Мастер удочки',text:'Вылови 80 рыб',metric:'fished',target:80,reward:3200,icon:'🎣'},
 {id:'garden',name:'Сокровища сада',text:'Собери 45 фруктов',metric:'foraged',target:45,reward:1450,icon:'🍐'},
 {id:'friends2',name:'Тёплая дружба',text:'Познакомься с 6 жителями',metric:'talked',target:6,reward:850,icon:'🤝'},
 {id:'watering',name:'Хозяин больших грядок',text:'Полей 110 культур',metric:'watered',target:110,reward:1250,icon:'💦'},
 {id:'lifestock',name:'Первые животные',text:'Заведи 3 животных',metric:'animalsBought',target:3,reward:600,icon:'🐔'},
 {id:'ranch',name:'Уютное ранчо',text:'Заведи 8 животных',metric:'animalsBought',target:8,reward:2000,icon:'🐄'},
 {id:'goods',name:'Свежие продукты',text:'Собери 12 продуктов с животных',metric:'animalGoods',target:12,reward:620,icon:'🥚'},
 {id:'goods2',name:'Молоко и шерсть',text:'Собери 55 продуктов с животных',metric:'animalGoods',target:55,reward:1700,icon:'🧀'},
 {id:'goods3',name:'Фермерский кооператив',text:'Собери 160 продуктов с животных',metric:'animalGoods',target:160,reward:4700,icon:'🐑'},
 {id:'longevity',name:'Долгие сезоны',text:'Проживи 12 игровых суток',metric:'days',target:12,reward:550,icon:'🌅'},
 {id:'longevity2',name:'Смена времён года',text:'Проживи 40 игровых суток',metric:'days',target:40,reward:2600,icon:'🌻'},
 {id:'supply',name:'Щедрая ферма',text:'Посади 600 семян',metric:'planted',target:600,reward:6800,icon:'🏡'},
 {id:'legend',name:'Легенда долины',text:'Собери 900 урожаев',metric:'harvests',target:900,reward:10500,icon:'🏆'},
 {id:'pilot',name:'Водитель комбайна',text:'Собери 60 культур трактором',metric:'tractorHarvests',target:60,reward:2600,icon:'🚜'},
 {id:'manufacturer',name:'Сельский промышленник',text:'Получи 10 партий готовой продукции с завода',metric:'processed',target:10,reward:4000,icon:'🏭'},
 {id:'industrialist',name:'Глава кооператива',text:'Получи 45 партий готовой продукции',metric:'processed',target:45,reward:11500,icon:'📦'}
];
const field=(x,y)=>(x>=12&&x<=25&&y>=10&&y<=21)||(x>=40&&x<=54&&y>=22&&y<=33)||PARCELS.some(p=>farm.parcels.includes(p.id)&&x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h);

const k=(x,y)=>x+','+y;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const initial=()=>({coins:145,harvests:0,day:1,dayStart:Date.now(),energy:100,name:'Долина клевера',seeds:{carrot:8,potato:5,berry:3,flower:2},tiles:{},questClaimed:0,questsClaimed:[],parcels:[],upgrades:[],stats:{planted:0,watered:0,fished:0,foraged:0,earned:0,visited:0,talked:0,animalsBought:0,animalGoods:0,days:1,processed:0,tractorHarvests:0},animals:[],storyStep:0,storyClaimed:[],daily:null,lastSeen:Date.now(),metVillagers:[],talkedDays:{},visitedRegions:[],maxEnergy:100,weather:'auto',player:{x:17.5,y:9.25,face:'down'},appearance:{skin:'#f2cda0',hair:'#72482f',shirt:'#467d83',hat:'#d4ae6d',style:'hat'},fruit:0,autoTrade:true,stock:{},supplies:{feed:0,fertilizer:0,fuel:0},generalUpgrades:[],factory:{owned:false,level:1,jobs:[]},tractor:{owned:false,active:false,level:1},restedAt:0,bagItems:{},bagSort:'kind'});
let farm=initial();try{const v=JSON.parse(localStorage.getItem(STORAGE)||'null');if(v&&typeof v==='object'){farm={...farm,...v,seeds:{...farm.seeds,...v.seeds},player:{...farm.player,...v.player},appearance:{...farm.appearance,...v.appearance}};}}catch{}
// Перенос монет и урожая из прежней мини-фермы при первом открытии новой версии.
try{if(!localStorage.getItem(STORAGE)){const old=JSON.parse(localStorage.getItem('poly-scout-farm-v2')||'null');if(old){farm.coins=Number(old.coins)||145;farm.harvests=Number(old.harvests)||0;farm.name=old.name||farm.name;}}}catch{}
if(!farm.tiles||typeof farm.tiles!=='object')farm.tiles={};
farm.parcels=Array.isArray(farm.parcels)?farm.parcels.filter(id=>PARCELS.some(p=>p.id===id)):[];
farm.questsClaimed=Array.isArray(farm.questsClaimed)?farm.questsClaimed:[];
farm.upgrades=Array.isArray(farm.upgrades)?farm.upgrades:[];
farm.stats={planted:0,watered:0,fished:0,foraged:0,earned:0,visited:0,talked:0,animalsBought:0,animalGoods:0,days:1,...farm.stats};
farm.animals=Array.isArray(farm.animals)?farm.animals:[];farm.storyStep=Number(farm.storyStep)||0;farm.storyClaimed=Array.isArray(farm.storyClaimed)?farm.storyClaimed:[];farm.lastSeen=Number(farm.lastSeen)||Date.now();
farm.visitedRegions=Array.isArray(farm.visitedRegions)?farm.visitedRegions:[];
farm.maxEnergy=farm.upgrades.includes('stamina')?150:100;
farm.energy=clamp(Number.isFinite(Number(farm.energy))?Number(farm.energy):100,0,farm.maxEnergy);
farm.metVillagers=Array.isArray(farm.metVillagers)?farm.metVillagers:[];farm.talkedDays=farm.talkedDays&&typeof farm.talkedDays==='object'?farm.talkedDays:{};
farm.stock=farm.stock&&typeof farm.stock==='object'?farm.stock:{};farm.supplies={feed:0,fertilizer:0,fuel:0,...(farm.supplies||{})};farm.generalUpgrades=Array.isArray(farm.generalUpgrades)?farm.generalUpgrades:[];farm.factory={owned:false,level:1,jobs:[],...(farm.factory||{})};farm.factory.jobs=Array.isArray(farm.factory.jobs)?farm.factory.jobs:[];farm.tractor={owned:false,active:false,level:1,...(farm.tractor||{})};farm.autoTrade=farm.autoTrade!==false;farm.bagItems=farm.bagItems&&typeof farm.bagItems==='object'?farm.bagItems:{};farm.bagSort=['kind','qty','name'].includes(farm.bagSort)?farm.bagSort:'kind';

if(Object.keys(farm.tiles).length===0){
  for(let y=11;y<16;y++)for(let x=14;x<20;x++)farm.tiles[k(x,y)]={tilled:true,wetUntil:0};
  const starters=[[15,12,'carrot',24000],[16,12,'carrot',33000],[17,12,'potato',49000],[18,12,'potato',42000],[15,13,'berry',60000],[16,13,'berry',75000],[17,13,'flower',59000],[18,13,'flower',64000],[15,14,'carrot',15000],[16,14,'carrot',28000]];
  for(const [x,y,type,delay] of starters)farm.tiles[k(x,y)].crop={type,readyAt:Date.now()+delay,plantedAt:Date.now()-14000};
}
const offlineDuration=Math.max(0,Date.now()-farm.lastSeen);
let tool='hoe',selected='carrot',hover=null,cam={x:0,y:0},tick=0,last=performance.now(),hudAt=0,noticeTimer=0;
const held=new Set(),puffs=[];let movement=0,waypoint=null;
let industryRefreshAt=0;
const hash=(x,y,z=0)=>{let v=Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+Math.imul(z+1,1274126177);v=Math.imul(v^(v>>>13),1274126177);return (v^(v>>>16))>>>0;};
function save(){try{farm.lastSeen=Date.now();localStorage.setItem(STORAGE,JSON.stringify(farm));}catch{}scheduleBagRender();}
function note(message){$('fieldMessage').textContent=message;const toast=$('gameToast');toast.textContent=message;toast.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>toast.classList.remove('visible'),2200);}
function dayClock(){
 const elapsed=Math.max(0,Date.now()-farm.dayStart),duration=12*60*1000,extra=Math.floor(elapsed/duration);
 if(extra){farm.day+=extra;farm.dayStart+=extra*duration;farm.stats.days=farm.day;save();}
 const within=(Date.now()-farm.dayStart)%duration;
 let phase,hoursLeft,remaining,total,clock;
 if(within<300000){phase='ДЕНЬ';remaining=300000-within;total=300000;clock=6+(within/300000)*12;}
 else if(within<420000){phase='ВЕЧЕР';remaining=420000-within;total=120000;clock=18+((within-300000)/120000)*4;}
 else{phase='НОЧЬ';remaining=720000-within;total=300000;clock=22+((within-420000)/300000)*8;}
 clock=clock%24;
 return {phase,remaining,total,hour:Math.floor(clock),minute:Math.floor((clock%1)*60),fraction:within/duration,within};
}
const WEATHER={sun:['☀','Солнечно'],rain:['☂','Тихий дождь'],storm:['⛈','Гроза'],fog:['🌫','Туман'],wind:['🍃','Ветер'],snow:['❄','Снег'],heat:['🌤','Жара']};
const WEATHER_CYCLE=['auto','sun','rain','storm','fog','wind','snow','heat'];
function weatherNow(){if(farm.weather!=='auto')return WEATHER[farm.weather]?farm.weather:'sun';return ['sun','wind','sun','rain','fog','sun','heat','storm','sun','snow'][farm.day%10];}
function isRain(){return ['rain','storm'].includes(weatherNow());}
const seasons=['Весна','Лето','Осень','Зима'];
function seasonIndex(){return Math.floor((farm.day-1)/8)%4;}
function weatherText(){const [icon,label]=WEATHER[weatherNow()];return icon+' '+label;}
function syncWeatherUi(){if($('weatherLabel'))$('weatherLabel').textContent=weatherText();if($('weatherFarm')){$('weatherFarm').textContent='Погода: '+weatherText()+' ↻';$('weatherFarm').setAttribute('aria-pressed',String(farm.weather!=='auto'));}if($('rainAudioFarm')){$('rainAudioFarm').textContent=audioRainEnabled?'♬ Шум дождя: вкл.':'♬ Шум дождя: выкл.';$('rainAudioFarm').setAttribute('aria-pressed',String(audioRainEnabled));}}
function updateHud(){const time=dayClock();syncWeatherUi();$('coins').textContent=Math.floor(farm.coins);$('harvests').textContent=farm.harvests;$('farmerLevel').textContent=String(1+Math.floor(farm.harvests/10)).padStart(2,'0');$('levelCaption').textContent=farm.harvests<10?'Начинающий садовод':farm.harvests<30?'Уверенный фермер':'Мастер урожая';$('dayLabel').textContent=`День ${String(farm.day).padStart(2,'0')} · ${seasons[seasonIndex()]}`;$('timeLabel').textContent=`${String(time.hour).padStart(2,'0')}:${String(time.minute).padStart(2,'0')} · ${time.phase}`;if($('phaseLabel'))$('phaseLabel').textContent=`${time.phase.toLowerCase()} · ${Math.floor(time.remaining/60000)}:${String(Math.floor(time.remaining/1000)%60).padStart(2,'0')} до смены`;if($('phaseProgress'))$('phaseProgress').style.width=Math.max(0,(1-time.remaining/time.total)*100)+'%';$('energyLabel').textContent=(farm.energy<=0?'😴 ПЕРЕУТОМЛЕНИЕ · ':farm.energy<20?'⚠ УСТАЛОСТЬ · ':'♥ ')+`${Math.ceil(farm.energy)} / ${farm.maxEnergy}`;if($('farmExhaustion'))$('farmExhaustion').hidden=farm.energy>0; if($('farmEnergyBar'))$('farmEnergyBar').style.width=(100*farm.energy/farm.maxEnergy)+'%';if($('factoryCoins'))$('factoryCoins').textContent=Math.floor(farm.coins);
 document.querySelectorAll('.farm-seed').forEach(b=>{b.classList.toggle('selected',b.dataset.seed===selected);b.querySelector('.seed-count').textContent=farm.seeds[b.dataset.seed]||0;});}
function setupShop(){const box=$('seedList');box.innerHTML='';for(const [id,plant] of Object.entries(plants)){const el=document.createElement('div');el.className='farm-seed';el.dataset.seed=id;el.innerHTML=`<button type="button" class="seed-choose" aria-label="Выбрать ${plant.name}"><span class="seed-emoji">${plant.icon}</span><span class="seed-text"><b>${plant.name}</b><small>Созреет за ${Math.ceil(plant.grow/1000)} сек.</small></span><span class="seed-count">0</span></button><button type="button" class="seed-buy" title="Купить семя за ${plant.price} монет">+ <span>${plant.price}</span></button>`;el.querySelector('.seed-choose').addEventListener('click',()=>{selected=id;setTool('seed');updateHud();note('Выбрано: '+plant.name);sound.effect('select');});el.querySelector('.seed-buy').addEventListener('click',()=>{if(farm.coins<plant.price)return note('Монет пока не хватает');farm.coins-=plant.price;farm.seeds[id]=(farm.seeds[id]||0)+1;save();updateHud();note('Куплены семена: '+plant.name);sound.effect('buy');});box.appendChild(el);}}

const UPGRADES=[
 {id:'stamina',icon:'❤️',name:'Сытный завтрак',desc:'Силы увеличиваются со 100 до 150',price:430},
 {id:'boots',icon:'👟',name:'Лёгкие сапоги',desc:'На 35% быстрее ходьба',price:340},
 {id:'fishing',icon:'🎣',name:'Счастливый поплавок',desc:'Чаще попадается рыба',price:300},
 {id:'market',icon:'🪙',name:'Торговая тележка',desc:'+25% монет при продаже урожая',price:580}
];
const STORY=[
 {title:'Письмо из долины',desc:'Добро пожаловать домой! Получи первый подарок: семена и 80 монет.',check:()=>true,reward:80,seeds:{carrot:7,radish:4}},
 {title:'Первый росток',desc:'Посади хотя бы 3 семени. Выбери инструмент 2, затем нажми на грядки.',check:()=>farm.stats.planted>=3,reward:130,seeds:{potato:5}},
 {title:'Забота о земле',desc:'Полей 3 грядки: инструмент 3.',check:()=>farm.stats.watered>=3,reward:140,seeds:{berry:4}},
 {title:'Первый урожай',desc:'Собери 5 спелых растений. Рост продолжается и при закрытой игре.',check:()=>farm.harvests>=5,reward:200,seeds:{tomato:5}},
 {title:'Курятник за домом',desc:'Купи первую курицу во вкладке «Животные».',check:()=>farm.stats.animalsBought>=1,reward:280,seeds:{wheat:8}},
 {title:'Семейная ферма',desc:'Собери с животных 2 продукта и получи финальную награду главы.',check:()=>farm.stats.animalGoods>=2,reward:650,seeds:{pumpkin:5,grape:3}}
];
const DAILY_ORDERS=[
 {id:'pick',name:'Корзина для ярмарки',action:'harvests',target:7,icon:'🧺'},
 {id:'sow',name:'Заказ рассады',action:'planted',target:9,icon:'🌿'},
 {id:'water',name:'Уход за огородами',action:'watered',target:8,icon:'💧'},
 {id:'fish',name:'Рыба в деревню',action:'fished',target:2,icon:'🐟'},
 {id:'milk',name:'Продукты с ранчо',action:'animalGoods',target:2,icon:'🥛'},
 {id:'fruit',name:'Фруктовый короб',action:'foraged',target:3,icon:'🍏'}
];
function dailyBoard(){const root=$('dailyBoard');if(!root)return;
 if(!farm.daily||farm.daily.day!==farm.day){const stats={...farm.stats,harvests:farm.harvests};farm.daily={day:farm.day,started:stats,claimed:[]};save();}
 root.innerHTML='';for(let i=0;i<3;i++){
  const def=DAILY_ORDERS[(farm.day*2+i*2+(Math.floor(farm.day/3)))%DAILY_ORDERS.length],id=String(i)+'-'+def.id;
  const value=def.action==='harvests'?farm.harvests:(farm.stats[def.action]||0);
  const progress=Math.max(0,value-(farm.daily.started[def.action]||0));
  const target=def.target+Math.floor(farm.day/12);const claimed=farm.daily.claimed.includes(id);
  const reward=Math.min(680,130+Math.floor(farm.day*9)+i*35);
  const entry=document.createElement('div');entry.className='daily-entry';entry.innerHTML='<div class="daily-title">'+def.icon+' '+def.name+'</div><small>'+Math.min(progress,target)+' / '+target+'</small>';
  const btn=document.createElement('button');btn.type='button';btn.disabled=claimed||progress<target;btn.textContent=claimed?'✓ Выдано':progress>=target?'+'+reward+' ✦':'В работе';
  btn.addEventListener('click',()=>{if(farm.daily.claimed.includes(id))return;if(Math.max(0,(def.action==='harvests'?farm.harvests:farm.stats[def.action]||0)-(farm.daily.started[def.action]||0))<target)return;farm.daily.claimed.push(id);farm.coins+=reward;save();updateHud();dailyBoard();note('Заказ выполнен! +'+reward+' ✦');sound.effect('reward');});
  entry.append(btn);root.append(entry);
 }
 $('dailyDay').textContent='День '+farm.day;
}
const ANIMAL_TYPES=[
 {id:'hen',name:'Курица',icon:'🐔',price:230,feed:8,produce:'Яйцо',yield:30,wait:150000,color:'#f2d6b7'},
 {id:'duck',name:'Утка',icon:'🦆',price:410,feed:12,produce:'Утиное яйцо',yield:53,wait:210000,color:'#e4f1d1'},
 {id:'rabbit',name:'Кролик',icon:'🐇',price:560,feed:14,produce:'Пух',yield:72,wait:240000,color:'#e8d9c1'},
 {id:'goose',name:'Гусь',icon:'🪿',price:720,feed:18,produce:'Гусиное перо',yield:92,wait:280000,color:'#e9e9d9'},
 {id:'goat',name:'Коза',icon:'🐐',price:950,feed:24,produce:'Козье молоко',yield:131,wait:340000,color:'#d8cab4'},
 {id:'sheep',name:'Овечка',icon:'🐑',price:1250,feed:30,produce:'Шерсть',yield:169,wait:390000,color:'#f4e5cf'},
 {id:'cow',name:'Корова',icon:'🐄',price:1650,feed:36,produce:'Молоко',yield:218,wait:445000,color:'#e5d2b8'},
 {id:'pig',name:'Свинка',icon:'🐖',price:1960,feed:41,produce:'Лесные трюфели',yield:268,wait:490000,color:'#f0b7ad'},
 {id:'bee',name:'Пчелиный улей',icon:'🐝',price:2450,feed:55,produce:'Мёд',yield:340,wait:560000,color:'#f2d18b'},
 {id:'turkey',name:'Индюк',icon:'🦃',price:3100,feed:64,produce:'Перо',yield:411,wait:625000,color:'#ae846c'},
 {id:'alpaca',name:'Альпака',icon:'🦙',price:4100,feed:75,produce:'Мягкая шерсть',yield:524,wait:740000,color:'#e0bc9b'},
 {id:'horse',name:'Лошадь',icon:'🐎',price:5450,feed:94,produce:'Помощь с доставкой',yield:703,wait:870000,color:'#b88869'},
 {id:'deer',name:'Олень',icon:'🦌',price:6900,feed:113,produce:'Лесные дары',yield:905,wait:1020000,color:'#d5aa87'},
 {id:'peacock',name:'Павлин',icon:'🦚',price:8800,feed:135,produce:'Праздничные перья',yield:1150,wait:1180000,color:'#76adae'},
 {id:'quail',name:'Перепёлка',icon:'🐦',price:290,feed:9,produce:'Перепелиное яйцо',yield:40,wait:190000,color:'#ad9c8b'},
 {id:'swan',name:'Лебедь',icon:'🦢',price:1550,feed:35,produce:'Лебединое перо',yield:210,wait:480000,color:'#f2f2e4'},
 {id:'buffalo',name:'Буйвол',icon:'🐃',price:4450,feed:86,produce:'Жирное молоко',yield:620,wait:820000,color:'#8c756a'},
 {id:'yak',name:'Як',icon:'🐂',price:5200,feed:93,produce:'Тёплая шерсть',yield:760,wait:880000,color:'#ae8d7a'},
 {id:'pony',name:'Пони',icon:'🐴',price:1900,feed:41,produce:'Помощь с повозкой',yield:260,wait:460000,color:'#cf9a79'},
 {id:'ostrich',name:'Страус',icon:'🐦',price:5900,feed:118,produce:'Большое яйцо',yield:800,wait:990000,color:'#c1b29f'},
 {id:'silkworm',name:'Шелкопряд',icon:'🐛',price:3100,feed:67,produce:'Шёлк',yield:475,wait:685000,color:'#e6e2b4'},
 {id:'camel',name:'Верблюд',icon:'🐪',price:7950,feed:127,produce:'Верблюжья шерсть',yield:1140,wait:1150000,color:'#c6a77f'},
 {id:'koi',name:'Карп кои',icon:'🐟',price:2600,feed:59,produce:'Редкая икра',yield:392,wait:650000,color:'#d6aa82'},
 {id:'llama',name:'Лама',icon:'🦙',price:6800,feed:119,produce:'Мягкий пух',yield:900,wait:1070000,color:'#cdb294'}
];

ANIMAL_TYPES.push(
 {id:'hedgehog',name:'Ёж',icon:'🦔',price:340,feed:10,produce:'Лесные семена',yield:48,wait:220000,color:'#b19974'},
 {id:'tortoise',name:'Черепаха',icon:'🐢',price:760,feed:18,produce:'Редкий камень',yield:94,wait:320000,color:'#8da67e'},
 {id:'ferret',name:'Хорёк',icon:'🐾',price:980,feed:23,produce:'Полезная находка',yield:119,wait:365000,color:'#c6aa83'},
 {id:'hamster',name:'Хомяк',icon:'🐹',price:430,feed:11,produce:'Семена',yield:57,wait:240000,color:'#d8bb86'},
 {id:'parrot',name:'Попугай',icon:'🦜',price:2650,feed:59,produce:'Яркое перо',yield:371,wait:700000,color:'#87b78c'},
 {id:'flamingo',name:'Фламинго',icon:'🦩',price:4900,feed:93,produce:'Розовое перо',yield:705,wait:980000,color:'#e2a7ae'},
 {id:'redpanda',name:'Красная панда',icon:'🦝',price:7200,feed:121,produce:'Редкая шерсть',yield:1010,wait:1100000,color:'#c88564'},
 {id:'donkey',name:'Ослик',icon:'🫏',price:2550,feed:55,produce:'Помощь в хозяйстве',yield:350,wait:680000,color:'#aa9480'},
 {id:'guineapig',name:'Морская свинка',icon:'🐹',price:830,feed:20,produce:'Тёплый пух',yield:115,wait:350000},
 {id:'turtoise',name:'Сухопутная черепаха',icon:'🐢',price:1450,feed:30,produce:'Жемчужный камушек',yield:210,wait:480000,color:'#88aa78'}
);

const animalInfo=id=>ANIMAL_TYPES.find(t=>t.id===id);
const timeSpan=ms=>{const n=Math.max(0,Math.ceil(ms/1000));return n>=3600?Math.ceil(n/3600)+' ч '+Math.ceil(n%3600/60)+' мин':n>=60?Math.floor(n/60)+' мин '+n%60+' сек':n+' сек';};
function storyBoard(){const el=$('storyBoard');if(!el)return;if(farm.storyStep>=STORY.length){el.innerHTML='<div class="story-finale">✦ Первая глава завершена! Долина теперь в твоих руках. Исследуй карту, строй ферму и собирай коллекцию культур.</div>';return;}
 const q=STORY[farm.storyStep],ok=q.check(),d=document.createElement('article');d.className='story-mission';
 const h=document.createElement('h4');h.textContent='Глава '+(farm.storyStep+1)+' / '+STORY.length+' · '+q.title;const p=document.createElement('p');p.textContent=q.desc;const b=document.createElement('button');b.type='button';b.className='story-claim';b.disabled=!ok;b.textContent=ok?'Получить награду · +'+q.reward+' ✦':'Выполняется…';
 b.addEventListener('click',()=>{if(!q.check())return;farm.coins+=q.reward;for(const [type,amount] of Object.entries(q.seeds))farm.seeds[type]=(farm.seeds[type]||0)+amount;farm.storyClaimed.push(farm.storyStep);farm.storyStep++;save();updateHud();storyBoard();setupAnimalShop();note('Глава завершена! +'+q.reward+' ✦ и новые семена');sound.effect('reward');});d.append(h,p,b);el.replaceChildren(d);}
function setupAnimalShop(){const box=$('animalShop');if(!box)return;box.innerHTML='';const owned=farm.animals;
 for(const t of ANIMAL_TYPES){const animal=owned.find(a=>a.type===t.id),ready=animal&&animal.nextReadyAt&&Date.now()>=animal.nextReadyAt;
  const el=document.createElement('article');el.className='animal-entry';const label=document.createElement('div');label.className='animal-info';
  const avatar=document.createElement('span');avatar.className='animal-emoji';avatar.textContent=t.icon;const desc=document.createElement('span');desc.innerHTML='<b>'+t.name+'</b><small>'+t.produce+' · '+timeSpan(t.wait)+'</small>';label.append(avatar,desc);el.append(label);
  const action=document.createElement('button');action.type='button';const status=document.createElement('div');status.className='animal-status';
  if(!animal){action.textContent='Купить · '+t.price+' ✦';status.textContent='Новый житель';action.addEventListener('click',()=>{if(farm.coins<t.price)return note('Нужно ещё '+(t.price-farm.coins)+' ✦');farm.coins-=t.price;farm.animals.push({id:t.id+'-'+Date.now(),type:t.id,nextReadyAt:0,boughtAt:Date.now()});record('animalsBought');save();setupAnimalShop();storyBoard();updateHud();note('У тебя новое животное: '+t.name);sound.effect('buy');sound.effect('animal-'+t.id);});}
  else if(animal.babyUntil>Date.now()){action.textContent='Подрастает';action.disabled=true;status.textContent='Малыш · '+timeSpan(animal.babyUntil-Date.now())+' до взросления';}
  else if(ready){action.textContent='Собрать · +'+t.yield+' ✦';status.textContent='Продукт готов!';el.classList.add('animal-ready');action.addEventListener('click',()=>{if(Date.now()<animal.nextReadyAt)return;if(!farm.autoTrade&&stockCount()>=stockCapacity()){note('Склад заполнен! Продай сырьё или купи большой амбар.');return;}if(farm.autoTrade){farm.coins+=t.yield;record('earned',t.yield);}else addStock('animal:'+t.id,1);animal.nextReadyAt=0;record('animalGoods');save();updateHud();setupAnimalShop();storyBoard();refreshEconomy();note('Собрано: '+t.produce+(farm.autoTrade?' · +'+t.yield+' ✦':' · на складе'));sound.effect('animalCollect');sound.effect('animal-'+t.id);});}
  else if(animal.nextReadyAt){action.textContent='Растёт';action.disabled=true;status.textContent='Осталось '+timeSpan(animal.nextReadyAt-Date.now())+' (в том числе офлайн)';}
  else{action.textContent='Покормить · '+t.feed+' ✦';status.textContent='Ждёт кормления';action.addEventListener('click',()=>{if(farm.coins<t.feed&&farm.supplies.feed<=0)return note('Не хватает монет на корм');if(farm.supplies.feed>0)farm.supplies.feed--;else farm.coins-=t.feed;animal.nextReadyAt=Date.now()+Math.round(t.wait*(farm.generalUpgrades.includes('stable')?.8:1));save();updateHud();setupAnimalShop();note(t.name+' сыта! Продукт появится даже после выхода из игры.');sound.effect('feed');sound.effect('animal-'+t.id);});}
  el.append(status,action);if(animal){const sell=document.createElement('button');sell.className='animal-sell';const resale=Math.round(t.price*.65);sell.textContent='Продать животное · '+resale+' ✦';sell.addEventListener('click',()=>{if(!confirm('Продать животное «'+t.name+'»? Эту покупку нельзя отменить.'))return;farm.animals=farm.animals.filter(a=>a.id!==animal.id);farm.coins+=resale;record('earned',resale);save();updateHud();setupAnimalShop();refreshEconomy();note(t.name+' отправлена новому хозяину. +'+resale+' ✦');});el.append(sell);}box.append(el);
 }
 $('animalCount').textContent=owned.length+' животных · '+ANIMAL_TYPES.length+' видов';
}
function updateQuestProgress(){const board=$('questBoard');if(!board)return;board.innerHTML='';
 for(const q of QUESTS){const completed=farm.questsClaimed.includes(q.id),progress=q.metric==='harvests'?farm.harvests:q.metric==='days'?farm.day:Number(farm.stats[q.metric]||0),ready=progress>=q.target;
  const card=document.createElement('article');card.className='quest-entry'+(ready?' ready':'')+(completed?' completed':'');
  const head=document.createElement('div');head.className='quest-entry-head';head.innerHTML='<span class="quest-emoji">'+q.icon+'</span><div><b>'+q.name+'</b><small>'+q.text+'</small></div>';
  const bar=document.createElement('div');bar.className='quest-small-track';const fill=document.createElement('span');fill.style.width=Math.min(100,progress/q.target*100)+'%';bar.append(fill);
  const foot=document.createElement('div');foot.className='quest-entry-foot';const count=document.createElement('span');count.textContent=Math.min(q.target,progress)+' / '+q.target;
  const btn=document.createElement('button');btn.type='button';btn.disabled=!ready||completed;btn.textContent=completed?'✓ Получено':'+ '+q.reward+' ✦';btn.addEventListener('click',()=>{if(farm.questsClaimed.includes(q.id)||((q.metric==='harvests'?farm.harvests:q.metric==='days'?farm.day:farm.stats[q.metric])||0)<q.target)return;farm.questsClaimed.push(q.id);farm.coins+=q.reward;save();updateHud();updateQuestProgress();setupLandShop();note('Задание выполнено! +'+q.reward+' ✦');sound.effect('reward');});
  foot.append(count,btn);card.append(head,bar,foot);board.append(card);
 }
 $('questsDone').textContent=farm.questsClaimed.length+' / '+QUESTS.length;
}
function setupLandShop(){const container=$('parcelShop');if(!container)return;container.innerHTML='';
 for(const p of PARCELS){const owned=farm.parcels.includes(p.id);const el=document.createElement('div');el.className='parcel-entry'+(owned?' owned':'');const descr=document.createElement('span');descr.innerHTML='<b>'+p.icon+' '+p.name+'</b><small>'+p.description+'</small>';const btn=document.createElement('button');btn.type='button';btn.disabled=owned;btn.textContent=owned?'✓ Мой участок':p.price+' ✦';btn.addEventListener('click',()=>{if(farm.coins<p.price)return note('Нужно ещё '+(p.price-farm.coins)+' монет на участок');farm.coins-=p.price;farm.parcels.push(p.id);save();updateHud();setupLandShop();note('Участок «'+p.name+'» теперь твой!');});el.append(descr,btn);container.append(el);}
}
function setupUpgradeShop(){const container=$('upgradeShop');if(!container)return;container.innerHTML='';for(const item of UPGRADES){const owned=farm.upgrades.includes(item.id);const el=document.createElement('div');el.className='parcel-entry'+(owned?' owned':'');const descr=document.createElement('span');descr.innerHTML='<b>'+item.icon+' '+item.name+'</b><small>'+item.desc+'</small>';const btn=document.createElement('button');btn.type='button';btn.disabled=owned;btn.textContent=owned?'✓ Куплено':item.price+' ✦';btn.addEventListener('click',()=>{if(farm.coins<item.price)return note('Не хватает монет');farm.coins-=item.price;farm.upgrades.push(item.id);if(item.id==='stamina'){farm.maxEnergy=150;farm.energy=150;}save();updateHud();setupUpgradeShop();note('Улучшение куплено: '+item.name);sound.effect('upgrade');});el.append(descr,btn);container.append(el);}}
let questUiAt=0;
function record(action,n=1){farm.stats[action]=(farm.stats[action]||0)+n;save();updateQuestProgress();storyBoard();dailyBoard();}
function fullscreen(buttonId){const button=$(buttonId),shell=document.querySelector('.game-shell');if(!button||!shell)return;
 button.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();else note('Этот браузер не поддерживает полноэкранный режим');}catch{note('Браузер запретил полноэкранный режим');}});
 document.addEventListener('fullscreenchange',()=>{button.textContent=document.fullscreenElement?'⤢ Выйти из полного экрана':'⛶ На полный экран';});
}
const VILLAGERS=[
 {id:'mira',name:'Мира',x:36.5,y:10.7,color:'#c690b2',hair:'#9a6745',message:'Тут красиво после дождя. Загляни к озеру на закате!'},
 {id:'leo',name:'Лёва',x:58.5,y:19.8,color:'#7f9fbe',hair:'#534c46',message:'Если захочешь расширить ферму, начни с луговой террасы.'},
 {id:'nika',name:'Ника',x:38.7,y:37.9,color:'#e3ad71',hair:'#665048',message:'У нас на ярмарке ценят хороший урожай. Не забывай про задания!'},
 {id:'tim',name:'Тим',x:70.2,y:11.7,color:'#98b88a',hair:'#aa7547',message:'На востоке есть редкие поля и тихие речные тропы.'},
 {id:'lina',name:'Лина',x:87.1,y:7.8,color:'#b6a5c9',hair:'#8d6056',message:'Если посадишь редкие цветы, долина станет ещё красивее.'},
 {id:'pasha',name:'Паша',x:95.3,y:33.4,color:'#8fc2b1',hair:'#665a48',message:'Наши животные любят свежую траву и доброту.'},
 {id:'sima',name:'Сима',x:75.6,y:72.2,color:'#d0ad79',hair:'#a86a43',message:'В тёплые дни наши поля полны редких фруктов.'},
 {id:'rose',name:'Роза',x:107.1,y:42.7,color:'#d38e91',hair:'#634443',message:'Торговцы очень ценят чай и специи.'},
 {id:'igor',name:'Игорь',x:32.5,y:68.5,color:'#8fa5cb',hair:'#9b8665',message:'За холмами появилась новая дорога к ранчо.'},
 {id:'taya',name:'Тая',x:112.3,y:73.3,color:'#adbc83',hair:'#a07a5d',message:'Островной сад лучше всего исследовать ночью.'},
 ...(window.POLY_V9_VILLAGERS||[])
];
function villagerAt(x,y){return VILLAGERS.find(v=>{const p=v9?v9.npcPosition(v):v;return Math.hypot(p.x-x,p.y-y)<2.1;});}
function talk(v){if(!v)return false;if(Math.hypot((v9?v9.npcPosition(v):v).x-farm.player.x,(v9?v9.npcPosition(v):v).y-farm.player.y)>2.5){note('Подойди поближе к жителю, чтобы поговорить');return true;}
 const old=farm.metVillagers.includes(v.id);if(!old){farm.metVillagers.push(v.id);farm.stats.talked=farm.metVillagers.length;updateQuestProgress();}
 const gifted=farm.talkedDays[v.id]===farm.day;
 if(!gifted){farm.talkedDays[v.id]=farm.day;farm.coins+=18;}
 note(v.name+': «'+(v9?v9.dialogue(v):v.message)+'» '+(gifted?'':'(+18 ✦ за знакомство)'));sound.effect('dialog');save();updateHud();return true;}
function talkNearby(){return talk(villagerAt(farm.player.x,farm.player.y));}
function drawVillagers(){for(const v of VILLAGERS){const pos=v9?v9.npcPosition(v):v,X=Math.round(pos.x*T-cam.x),Y=Math.round(pos.y*T-cam.y),b=Math.round(Math.sin(tick*.07+v.x)*2);
 if(X<-42||X>W+42||Y<-42||Y>H+45)continue;
 ellipse(X,Y+3,12,4,'#345c4450');pix(X-8,Y-22+b,16,20,v.color);pix(X-6,Y-35+b,13,15,'#efc49a');pix(X-8,Y-40+b,16,8,v.hair);pix(X-5,Y-29+b,3,3,'#443f41');pix(X+2,Y-29+b,3,3,'#443f41');pix(X-8,Y-4,6,8,'#5c5553');pix(X+2,Y-4,6,8,'#5c5553');
 if(Math.hypot(v.x-farm.player.x,v.y-farm.player.y)<2.5){ctx.fillStyle='#fff8d9';ctx.fillRect(X-8,Y-62,19,17);ctx.fillStyle='#6b7c50';ctx.font='bold 12px Georgia';ctx.fillText('!',X-1,Y-49);}
 }}
function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('active',el.dataset.tool===t));}
function fx(x,y,color,n=8){for(let i=0;i<n;i++)puffs.push({x,y,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2-1,life:25+Math.random()*20,color});}
function interact(x,y){if(!field(x,y)){note('Здесь пока нет огорода — новые участки продаются справа');return;}if(farm.energy<=0){note('Ты переутомился! Пора поспать в домике ☾');return;}if(tool==='harvest'&&farm.tractor.owned&&farm.tractor.active){tractorHarvest(x,y);return;}const key=k(x,y),tile=farm.tiles[key]||(farm.tiles[key]={tilled:false,wetUntil:0}),now=Date.now();
 if(tool==='hoe'){if(v9)v9.gain('farmer');if(tile.tilled){note('Эта грядка уже готова');return;}if(farm.energy<2)return note('Энергия закончилась — отдохни');tile.tilled=true;farm.energy-=2;note('Земля вскопана');sound.effect('hoe');fx(x*T+16,y*T+16,'#b68a59');}
 if(tool==='seed'){if(v9)v9.gain('farmer');if(!tile.tilled)return note('Сначала вскопай землю мотыгой');if(tile.crop)return note('На грядке уже что-то растёт');if(!farm.seeds[selected])return note('Семена закончились — загляни в лавку');if(farm.energy<2)return note('Пора отдохнуть');const boost=(farm.generalUpgrades.includes('greenhouse')?.83:1)*(weatherNow()==='snow'?1.2:weatherNow()==='heat'?1.1:isRain()?.90:1);tile.crop={type:selected,plantedAt:now,readyAt:now+Math.round(plants[selected].grow*boost)};farm.seeds[selected]--;farm.energy-=2;record('planted');note('Посажено: '+plants[selected].name);sound.effect('seed');fx(x*T+16,y*T+16,'#d4d18b',5);}
 if(tool==='water'){if(!tile.tilled)return note('Сначала подготовь грядку');if(farm.energy<1)return note('Пора отдохнуть');if(tile.wetUntil>now)return note('Земля уже полита');tile.wetUntil=now+30000;farm.energy-=1;record('watered');if(tile.crop)tile.crop.readyAt=Math.max(now+2500,tile.crop.readyAt-Math.min(45000,plants[tile.crop.type].grow*.14));note('Полито! Растения растут быстрее');sound.effect('water');fx(x*T+16,y*T+16,'#83d7e4',12);}
 if(tool==='harvest'){if(!tile.crop)return note('Здесь пока нечего собирать');if(tile.crop.readyAt>now)return note('Урожай ещё созревает');if(!harvestCell(x,y,tile,false))return note('Склад заполнен — продай сырьё или расширь амбар');note(farm.autoTrade?'Урожай продан на ярмарке!':'Урожай отправлен на склад');sound.effect('harvest');refreshEconomy();}
 if(tool==='fertilize'){if(!tile.crop)return note('Сначала посади растение');if(!farm.supplies.fertilizer)return note('Купи удобрение в универсальном магазине');if(tile.fertilized)return note('Эта грядка уже удобрена');tile.fertilized=true;farm.supplies.fertilizer--;tile.crop.readyAt=Math.max(now+1200,tile.crop.readyAt-Math.round(plants[tile.crop.type].grow*.23));farm.energy=Math.max(0,farm.energy-.5);note('Грядка удобрена! Растение созреет раньше.');sound.effect('fertilize');}
 save();updateHud();}
function stockCapacity(){return farm.generalUpgrades.includes('barnstorage')?600:80;}function stockCount(){return Object.values(farm.stock).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);}function addStock(id,count=1){if(stockCount()+count>stockCapacity())return false;farm.stock[id]=(farm.stock[id]||0)+count;return true;}
function harvestCell(x,y,tile,tractor=false){if(!tile.crop||tile.crop.readyAt>Date.now())return false;if(!farm.autoTrade&&stockCount()>=stockCapacity())return false;const pl=plants[tile.crop.type]||plants.carrot,sale=Math.round(pl.sell*(farm.upgrades.includes('market')?1.25:1)*(farm.generalUpgrades.includes('trader')?1.1:1));if(farm.autoTrade){farm.coins+=sale;farm.stats.earned+=sale;}else addStock('crop:'+tile.crop.type,1);tile.crop=null;tile.fertilized=false;farm.harvests++;farm.energy=Math.max(0,farm.energy-(tractor?.12:1.0));if(tractor)farm.stats.tractorHarvests++;fx(x*T+16,y*T+16,'#f9df8e',9);return true;}
function tractorHarvest(x,y){if(farm.supplies.fuel<=0){note('Трактору нужно топливо — купи его в магазине');return;}const radius=farm.tractor.level>=2?2:1;let count=0;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=x+dx,yy=y+dy;if(!field(xx,yy))continue;const tile=farm.tiles[k(xx,yy)];if(tile&&harvestCell(xx,yy,tile,true))count++;}if(count){farm.supplies.fuel--;save();updateHud();updateQuestProgress();storyBoard();dailyBoard();refreshEconomy();note('🚜 Трактор собрал '+count+' растений! Топливо: '+farm.supplies.fuel);sound.effect('tractor');}else note('Нет спелых культур или склад заполнен');}
function pix(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);ctx.fill();}
function pxworld(x,y,w,h,c){pix(x-cam.x,y-cam.y,w,h,c)}
function cloudShadow(x,y,r){ellipse(x-cam.x,y-cam.y,r,r*.28,'#2e573b25')}
function drawGround(){const palette=[['#89be76','#8fc37b','#8bbd73','#91c17a'],['#79ba74','#80bd77','#7db670','#87c17b'],['#a5b87b','#aab777','#b5bb7b','#a5b26d'],['#c3d1c0','#bfceba','#cad7c4','#c0d1c4']][seasonIndex()];ctx.fillStyle=palette[0];ctx.fillRect(0,0,W,H);const sx=Math.floor(cam.x/T)-1,sy=Math.floor(cam.y/T)-1,ex=sx+W/T+3,ey=sy+H/T+3;
 for(let y=Math.max(0,sy);y<Math.min(MH,ey);y++)for(let x=Math.max(0,sx);x<Math.min(MW,ex);x++){const px=x*T-cam.x,py=y*T-cam.y,h=hash(x,y);pix(px,py,T,T,palette[h%4]);if(h%5===0){pix(px+5,py+7,2,5,'#6da75f');pix(px+10,py+10,2,3,'#a2d08a');}if(h%11===0){pix(px+22,py+18,3,3,'#e7e1a2');pix(px+25,py+17,2,2,'#fff3d3');}if(h%17===0){pix(px+9,py+24,4,3,'#d7a3b0');pix(px+13,py+22,3,3,'#f4d2d6');}if(h%19===0){pix(px+18,py+4,5,4,'#8bb16e');}}
 // Протоптанные дорожки из дома к огороду, пруду и сараю
 for(let x=7;x<=28;x++)for(let y=8;y<=9;y++)pathTile(x,y);
 for(let y=8;y<=18;y++)for(let x=10;x<=11;x++)pathTile(x,y);
 for(let x=24;x<=27;x++)for(let y=9;y<=14;y++)pathTile(x,y);
}
function pathTile(x,y){const sx=x*T-cam.x,sy=y*T-cam.y,h=hash(x,y,8);pix(sx,sy,32,32,h%2?'#d4bc88':'#cbb280');pix(sx+5,sy+9,9,2,'#bca273');pix(sx+23,sy+21,5,3,'#e1c997');}
function drawPond(){for(let y=15;y<=21;y++)for(let x=2;x<=9;x++){const dx=(x-5.5)/4.25,dy=(y-18)/3.9;if(dx*dx+dy*dy>1.0)continue;const px=x*T-cam.x,py=y*T-cam.y;pix(px,py,32,32,'#d3c69a');pix(px+3,py+3,26,26,'#6cbbbd');pix(px+5,py+5,22,22,hash(x,y)%2?'#79c6c6':'#67afb9');if(hash(x,y)%5===0){pix(px+8,py+9,9,2,'#b2e2d3');pix(px+18,py+20,5,2,'#b2e2d3');}}
 for(const [x,y] of [[4,16],[8,19],[3,20]]){const px=x*T-cam.x,py=y*T-cam.y;ellipse(px+13,py+17,12,6,'#4a9e73');pix(px+13,py+8,5,5,'#f1c5ca');}}
function tree(x,y,size=1){const X=x*T-cam.x,Y=y*T-cam.y,s=size;cloudShadow(x*T+16,y*T+28,19*s);pix(X+12*s,Y+1*s,9*s,41*s,'#8c6243');pix(X+15*s,Y+7*s,4*s,28*s,'#b27c52');const leaf=(dx,dy,w,h,c)=>pix(X+dx*s,Y+dy*s,w*s,h*s,c);leaf(-7,-27,48,25,'#3c8053');leaf(-12,-12,55,23,'#397d4d');leaf(-2,-40,42,19,'#4b965e');leaf(2,-29,30,9,'#70ae69');leaf(-5,-12,15,6,'#68a968');leaf(24,-18,12,5,'#75b475');leaf(0,-37,10,4,'#8cc77d');}
function building(x,y,w,h,type){const X=x*T-cam.x,Y=y*T-cam.y,ww=w*T,hh=h*T;cloudShadow(x*T+ww/2,y*T+hh,ww*.48);
 if(type==='house'){pix(X+13,Y+53,ww-26,hh-52,'#e9c997');pix(X+20,Y+63,ww-40,hh-68,'#f5dbad');pix(X+2,Y+46,ww-4,17,'#734e55');pix(X+14,Y+13,ww-28,39,'#a75f58');pix(X+25,Y+4,ww-50,15,'#b86c5f');pix(X+32,Y+20,ww-64,4,'#d58b75');pix(X+31,Y+80,34,37,'#7c5b4c');pix(X+39,Y+87,18,30,'#a97a58');pix(X+ww-75,Y+77,40,31,'#e9f3dc');pix(X+ww-70,Y+82,30,21,'#87c2bd');pix(X+ww-57,Y+81,4,25,'#fff3d3');pix(X+ww-70,Y+90,30,4,'#fff3d3');pix(X+ww-50,Y+1,19,31,'#dfb59a');pix(X+ww-55,Y-2,29,8,'#6f5551');pix(X+ww/2-17,Y+42,35,12,'#f0d89b');pix(X+ww/2-8,Y+46,19,4,'#ba7765');}
 else{pix(X+12,Y+55,ww-24,hh-55,'#bc8d69');pix(X+16,Y+60,ww-32,hh-67,'#d9ae7d');pix(X+2,Y+48,ww-4,18,'#7a6a5b');pix(X+17,Y+12,ww-34,42,'#7d8d6c');pix(X+27,Y+5,ww-54,14,'#9ca781');pix(X+ww/2-25,Y+77,50,hh-77,'#6c6554');pix(X+ww/2-18,Y+84,36,hh-84,'#b9aa7e');pix(X+ww/2-2,Y+83,4,hh-85,'#7e735d');pix(X+ww/2-20,Y+104,41,4,'#7e735d');pix(X+ww-59,Y+80,26,23,'#b9e0cf');pix(X+ww-53,Y+85,14,13,'#7db8aa');}
}
function fence(){for(let x=11;x<=24;x++){if(x===17||x===18)continue;post(x,9);post(x,18);}for(let y=10;y<18;y++){post(11,y);post(24,y);}function post(x,y){const X=x*T-cam.x,Y=y*T-cam.y;pix(X+3,Y+16,27,6,'#a9815e');pix(X+3,Y+24,27,4,'#e3c18a');pix(X+12,Y+9,8,26,'#f2d69c');pix(X+12,Y+6,8,7,'#fff0c4');pix(X+14,Y+10,4,22,'#d9b781');}}
function cropArt(x,y,crop){const X=x*T-cam.x,Y=y*T-cam.y,now=Date.now(),pl=plants[crop.type]||plants.carrot,progress=clamp(1-(crop.readyAt-now)/pl.grow,0,1),stage=Math.min(3,Math.floor(progress*4));if(stage===0){pix(X+14,Y+17,4,7,'#5b9850');pix(X+10,Y+16,6,4,'#78b765');return;}pix(X+15,Y+10,3,15,'#497f46');pix(X+9,Y+12,8,5,'#6aa859');pix(X+18,Y+9,7,5,'#7cb765');if(stage>=2){pix(X+11,Y+14,12,10,pl.body);pix(X+13,Y+18,8,6,crop.type==='potato'?'#c6a06a':pl.body);pix(X+12,Y+16,3,3,'#fff1b660');}if(stage===3){pix(X+8,Y+11,16,12,pl.body);pix(X+12,Y+9,11,9,crop.type==='flower'?'#f9d96f':pl.body);if(crop.type==='berry'){pix(X+9,Y+14,3,3,'#ffe4ac');pix(X+19,Y+16,3,3,'#ffe4ac');}if(crop.type==='flower'){pix(X+10,Y+9,14,13,'#f9c0c4');pix(X+14,Y+13,6,6,'#f3d16a');}if(crop.type==='carrot'){pix(X+14,Y+22,6,5,'#c97636');}}if(now>=crop.readyAt){const bob=Math.round(Math.sin(tick*.08+x)*2);pix(X+12,Y-2+bob,11,11,'#fdf3b3');pix(X+15,Y+1+bob,5,5,'#edb94d');}}
function cropVariety(x,y,crop){
 const X=x*T-cam.x,Y=y*T-cam.y,pl=plants[crop.type]||plants.carrot;if(Date.now()<crop.readyAt)return;
 const stem='#467a4c';const fruit=(dx,dy,w,h,c)=>pix(X+dx,Y+dy,w,h,c);
 if(['apple','peach','pear','cherry','lemon','orange','kiwi','banana','coconut','pomegranate','fig','olive'].includes(crop.type)){
  fruit(14,-17,5,30,'#815b42');fruit(5,-25,23,15,'#397c4b');fruit(2,-18,27,14,'#549657');fruit(9,-31,16,13,'#70ac63');for(let i=0;i<4;i++)fruit(7+(i%2)*11,-23+Math.floor(i/2)*10,6,6,pl.body);
 }else if(crop.type==='corn'||crop.type==='wheat'||crop.type==='rice'){ 
  for(let i=0;i<3;i++){const dx=5+i*8;fruit(dx,0,3,25,stem);fruit(dx-2,4,6,10,pl.leaf);fruit(dx,1,5,11,pl.body);fruit(dx+1,2,2,4,'#fff0be');}
 }else if(crop.type==='pumpkin'||crop.type==='melon'||crop.type==='pineapple'){ 
  fruit(5,11,24,17,pl.body);fruit(8,8,18,21,pl.body);fruit(13,6,4,8,stem);fruit(9,13,2,11,'#e7b17c');fruit(23,13,2,11,'#4c7c4c');
 }else if(crop.type==='sunflower'||crop.type==='saffron'){ 
  fruit(14,-8,4,31,stem);for(let i=0;i<8;i++){const a=i*Math.PI/4;fruit(15+Math.round(Math.cos(a)*11),4+Math.round(Math.sin(a)*10),6,6,'#f5cb5a');}fruit(12,1,11,11,'#80593c');
 }else if(['grape','blueberry','raspberry','coffee','tea','mushroom','truffle'].includes(crop.type)){
  fruit(14,0,4,21,stem);for(let i=0;i<9;i++)fruit(8+(i%3)*6,7+Math.floor(i/3)*6,6,6,pl.body);
 }else if(['cabbage','broccoli','cauliflower','spinach','beet'].includes(crop.type)){
  fruit(4,8,25,21,stem);fruit(6,9,20,18,'#8cc98a');fruit(9,12,14,14,pl.body);fruit(13,10,3,13,'#cae5a0');
 }else if(['tomato','pepper','cucumber','garlic','vanilla','dragonfruit','starfruit'].includes(crop.type)){
  for(let i=0;i<3;i++)fruit(5+i*8,10+(i%2)*5,9,10,pl.body);fruit(7,6,19,6,'#578956');
 }
}
function drawLandMarkers(){for(const p of PARCELS){const owned=farm.parcels.includes(p.id),xx=p.x*T-cam.x,yy=p.y*T-cam.y,ww=p.w*T,hh=p.h*T;
 if(xx>W+40||yy>H+40||xx+ww<-40||yy+hh<-40)continue;
 ctx.save();ctx.globalAlpha=owned?.13:.27;ctx.fillStyle=owned?'#badf86':'#cfac72';ctx.fillRect(xx+3,yy+3,ww-6,hh-6);ctx.globalAlpha=1;ctx.strokeStyle=owned?'#f5e5a8':'#c88e61';ctx.lineWidth=4;ctx.setLineDash([13,8]);ctx.strokeRect(xx+2,yy+2,ww-4,hh-4);ctx.setLineDash([]);
 if(!owned){for(let ry=1;ry<p.h-1;ry+=2)for(let rx=1;rx<p.w-1;rx+=2){const px=xx+rx*32+6,py=yy+ry*32+8;if(px<-20||px>W+20||py<-20||py>H+20)continue;pix(px,py,4,9,'#75a05d');pix(px+6,py+2,4,6,'#67965d');if((rx+ry)%5===0){pix(px-3,py-6,8,7,'#f3d7ae');pix(px+2,py-5,3,5,'#cf9b99');}}ctx.fillStyle='#654e3d';ctx.fillRect(xx+12,yy+10,Math.min(ww-24,230),50);ctx.fillStyle='#fff2cb';ctx.font='bold 15px Georgia';ctx.textAlign='left';ctx.fillText('ЗАКРЫТЫЙ УЧАСТОК',xx+19,yy+30);ctx.font='12px Georgia';ctx.fillText(p.price+' ✦ · купить справа',xx+19,yy+47);}ctx.restore();}}
function drawField(){drawLandMarkers();for(const bounds of [[12,25,10,21],[40,54,22,33],...PARCELS.filter(p=>farm.parcels.includes(p.id)).map(p=>[p.x,p.x+p.w-1,p.y,p.y+p.h-1])])for(let y=bounds[2];y<=bounds[3];y++)for(let x=bounds[0];x<=bounds[1];x++){const X=x*T-cam.x,Y=y*T-cam.y;if(X<-40||Y<-45||X>W+40||Y>H+45)continue;const t=farm.tiles[k(x,y)];if(t?.tilled){pix(X+1,Y+2,30,29,'#805941');pix(X+3,Y+4,26,25,t.wetUntil>Date.now()?'#76584b':'#a47652');pix(X+7,Y+10,8,2,'#b88b61');pix(X+19,Y+22,5,2,'#694c3a');if(t.crop){cropArt(x,y,t.crop);cropVariety(x,y,t.crop);}}else{const h=hash(x,y,11);if(h%4===0){pix(X+9,Y+10,4,5,'#70a961');pix(X+16,Y+17,4,6,'#6ca35c');}}}}
function chicken(x,y,n){const X=x*T-cam.x,Y=y*T-cam.y,b=Math.sin(tick*.035+n)*2;ellipse(X+16,Y+27,13,4,'#375e4238');pix(X+7,Y+11+b,19,16,'#fff1d3');pix(X+11,Y+5+b,14,12,'#fff8e5');pix(X+23,Y+12+b,7,4,'#e4a158');pix(X+13,Y+2+b,4,6,'#df7270');pix(X+18,Y+2+b,4,6,'#e98779');pix(X+20,Y+10+b,3,3,'#473d37');pix(X+10,Y+26+b,3,4,'#b58150');pix(X+19,Y+26+b,3,4,'#b58150');}
function player(){const X=farm.player.x*T-cam.x,Y=farm.player.y*T-cam.y;const moving=movement>0,b=Math.round(Math.sin(tick*.16)*2)*(moving?1:0),leg=Math.round(Math.sin(tick*.18)*4)*(moving?1:0);ellipse(X,Y+5,13,5,'#2e593d60');pix(X-9,Y-21+b,18,20,farm.appearance.shirt);pix(X-6,Y-24+b,12,8,farm.appearance.skin);pix(X-8,Y-34+b,16,14,farm.appearance.skin);pix(X-9,Y-42+b,18,10,farm.appearance.hair);if(farm.appearance.style==='hat'){pix(X-14,Y-38+b,28,7,'#ad8153');pix(X-9,Y-44+b,18,9,farm.appearance.hat);}else if(farm.appearance.style==='cap'){pix(X-10,Y-43+b,20,9,farm.appearance.hat);pix(X-15,Y-37+b,20,4,farm.appearance.hat);}else {pix(X-9,Y-43+b,18,8,farm.appearance.hair);pix(X-12,Y-38+b,6,10,farm.appearance.hair);}pix(X-5,Y-40+b,10,2,'#f4d49b');pix(X-8,Y-1+leg,7,8,'#564d55');pix(X+2,Y-1-leg,7,8,'#564d55');pix(X-12,Y-18+b,5,12,'#e5b78c');pix(X+8,Y-18+b,5,12,'#e5b78c');if(farm.player.face==='left'){pix(X-7,Y-30+b,3,3,'#423c37');}else if(farm.player.face==='right'){pix(X+4,Y-30+b,3,3,'#423c37');}else if(farm.player.face==='down'){pix(X-5,Y-30+b,2,3,'#423c37');pix(X+4,Y-30+b,2,3,'#423c37');}pix(X-7,Y-20+b,14,3,'#f1ce9c');}
function overlay(){const tm=dayClock();if(tm.phase==='ВЕЧЕР'){ctx.fillStyle='rgba(150,80,107,.19)';ctx.fillRect(0,0,W,H);}else if(tm.phase==='НОЧЬ'){ctx.fillStyle='rgba(18,31,77,.47)';ctx.fillRect(0,0,W,H);
 for(const loc of [[5.5,6.7],[8.7,6.7],[27.5,6.3],[37.9,6.6],[42.5,37.7],[54.8,7.4]]){
  const lx=loc[0]*T-cam.x,ly=loc[1]*T-cam.y;
  if(lx<-130||lx>W+130||ly<-130||ly>H+130)continue;
  ctx.save();ctx.globalCompositeOperation='screen';
  const glow=ctx.createRadialGradient(lx,ly,2,lx,ly,80);glow.addColorStop(0,'rgba(255,223,142,.54)');glow.addColorStop(.32,'rgba(255,212,121,.2)');glow.addColorStop(1,'rgba(255,215,128,0)');ctx.fillStyle=glow;ctx.fillRect(lx-80,ly-80,160,160);ctx.restore();
 }
 }if(isRain()){ ctx.fillStyle='rgba(84,115,130,.12)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#d7f4ef90';ctx.lineWidth=2;for(let i=0;i<85;i++){const x=(i*113+tick*4)%W,y=(i*79+tick*11)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+13);ctx.stroke();}}}
function tinyCat(x,y){const X=x*T-cam.x,Y=y*T-cam.y,tail=Math.sin(tick*.035)*4;ellipse(X+14,Y+27,13,4,'#37564236');pix(X+7,Y+11,19,15,'#d6b78d');pix(X+7,Y+8,5,6,'#997755');pix(X+21,Y+8,5,6,'#997755');pix(X+8,Y+7,17,14,'#dcc09a');pix(X+11,Y+13,3,3,'#554444');pix(X+20,Y+13,3,3,'#554444');pix(X+16,Y+17,3,2,'#c27d79');pix(X+24,Y+19,8,4,'#be9975');pix(X+31,Y+14+tail,4,12,'#c6a380');}
function butterflies(){for(let i=0;i<7;i++){const x=([3.5,11,19,25,28,14,5][i]+Math.sin(tick*.006+i)*2.5)*T-cam.x;const y=([11,20,5,17,23,7,25][i]+Math.cos(tick*.009+i)*1.5)*T-cam.y;const flap=Math.sin(tick*.18+i)*5;ellipse(x-4-flap*.35,y,4+Math.abs(flap)*.25,6,i%2?'#f1c2a3':'#f9deb5');ellipse(x+4+flap*.35,y,4+Math.abs(flap)*.25,6,i%2?'#dfb2cd':'#eab5bc');pix(x,y,2,5,'#765d64');}}
function floatingLight(){if(dayClock().phase!=='НОЧЬ')return;for(let i=0;i<24;i++){const wx=hash(i,13)%1100-cam.x,wy=hash(15,i)%800-cam.y;const a=.25+Math.sin(tick*.03+i)*.2;ctx.globalAlpha=a;ellipse(wx+Math.sin(tick*.007+i)*15,wy+Math.cos(tick*.008+i)*10,3.5,3.5,'#ffe9a1');ctx.globalAlpha=1;}}
function weatherSplashes(){if(!isRain())return;for(let i=0;i<34;i++){const x=(hash(i,3)%W+tick*1.5)%W,y=(hash(3,i)%H+tick*2.6)%H;const phase=(tick+i*3)%43;ctx.globalAlpha=.55*(1-phase/43);ctx.strokeStyle='#e8f7ee';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(x,y,3+phase*.11,1.5+phase*.045,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
function drawRanch(){
 const areas=[[84,32],[89,35],[96,34],[86,40],[93,40],[102,34],[107,35],[91,46],[104,45],[54,72],[60,73],[71,75],[77,75],[81,72]];
 const source=farm.animals.length?farm.animals:ANIMAL_TYPES.slice(0,3).map(v=>({type:v.id}));
 for(let i=0;i<source.length;i++){
  const a=source[i],t=animalInfo(a.type);if(!t)continue;
  const pt=areas[i%areas.length],xx=pt[0]*T-cam.x+Math.sin(tick*.008+i*2)*9,yy=pt[1]*T-cam.y+Math.sin(tick*.01+i)*5;
  if(xx<-60||xx>W+60||yy<-80||yy>H+60)continue;
  ellipse(xx+16,yy+25,17,5,'#345a4240');const big=['cow','horse','alpaca','goat','deer','sheep','pig'].includes(t.id);
  const w=big?32:24,h=big?22:16;
  pix(xx+1,yy+8,w,h,t.color);pix(xx+4,yy+6,w-8,h-4,t.color);pix(xx+w-8,yy+1,13,14,t.color);
  for(const dx of [5,w-9]){pix(xx+dx,yy+h+5,5,7,'#755b49');}
  pix(xx+w+1,yy+7,4,3,'#493f39');pix(xx+w-3,yy+7,3,3,'#514b42');
  if(t.id==='cow'){pix(xx+8,yy+12,11,8,'#9c806c');pix(xx+1,yy+4,5,9,'#b9a890');}
  if(t.id==='bee'){for(let k=0;k<3;k++)pix(xx+4+k*8,yy+8,4,12,'#775743');}
  if(t.id==='rabbit'){pix(xx+w-5,yy-11,5,13,t.color);pix(xx+w+2,yy-11,4,13,t.color);}
  if(t.id==='sheep'||t.id==='alpaca'){for(let k=0;k<4;k++)ellipse(xx+5+k*7,yy+10,8,7,t.color);}
  if(t.id==='goose'||t.id==='duck'){pix(xx+19,yy,6,13,t.color);pix(xx+w+3,yy+8,9,4,'#dfa14d');}
  if(t.id==='hen'){pix(xx+w-5,yy-3,4,9,'#cb6662');pix(xx+w,yy-2,3,7,'#e47e66');pix(xx+w+4,yy+11,7,4,'#deb35c');}
  if(t.id==='cow'){pix(xx+4,yy+4,9,8,'#7b655c');pix(xx+12,yy+18,10,7,'#9b8072');pix(xx+w+3,yy+13,10,8,'#d8a3a1');pix(xx+w+6,yy+16,2,2,'#986e6a');}
  if(t.id==='pig'){pix(xx+w+5,yy+13,12,9,'#d88f91');pix(xx+w+9,yy+17,2,3,'#b26d6b');pix(xx+8,yy+5,6,6,'#efc6be');}
  if(t.id==='horse'){pix(xx+w-7,yy-2,9,17,'#8b6551');pix(xx+3,yy+9,5,19,'#7d5b45');pix(xx+w+3,yy+5,4,10,'#bc8864');}
  if(t.id==='goat'||t.id==='deer'){pix(xx+w-4,yy-10,3,15,'#ad8c6f');pix(xx+w+5,yy-10,3,15,'#ad8c6f');pix(xx+w+7,yy+13,5,11,'#d0b092');}
  if(t.id==='alpaca'){pix(xx+w-7,yy-13,10,24,t.color);pix(xx+w-6,yy-18,5,10,'#cfac91');pix(xx+w+2,yy-15,5,11,'#cfac91');}
  if(t.id==='sheep'){for(let q=0;q<5;q++)ellipse(xx+q*7,yy+7,7,7,'#f4e7df');}
  if(t.id==='peacock'){for(let j=0;j<6;j++){const a=j*Math.PI/5;ellipse(xx+8+Math.cos(a)*17,yy+11-Math.sin(a)*21,5,12,j%2?'#59b8a1':'#6590bc');}pix(xx+w-7,yy-9,8,20,'#5a8f9d');}
  if(t.id==='turkey'){for(let j=0;j<6;j++)ellipse(xx+8+j*4,yy-2+Math.sin(j)*4,6,10,'#987051');pix(xx+w+5,yy+10,8,3,'#d8a764');}
  if(t.id==='bee'){ellipse(xx+5,yy+1,9,6,'#d5e8d7');ellipse(xx+19,yy+1,9,6,'#e1e9df');}
  if(t.id==='rabbit'){pix(xx+w+7,yy+13,6,3,'#ca9d9a');}

 }
}
function drawWeatherExtended(){const w=weatherNow();ctx.save();if(w==='fog'){ctx.fillStyle='#eef2e1';ctx.globalAlpha=.18+.065*Math.sin(tick*.013);ctx.fillRect(0,0,W,H);for(let i=0;i<9;i++)ellipse((i*153+tick*.22)%(W+180)-80,180+(i%5)*90,110,22,'#f3f1dc4a');}if(w==='snow'){for(let i=0;i<88;i++){const x=(hash(i,11)%W+tick*(.25+(i%5)*.2))%W,y=(hash(12,i)%H+tick*(.5+(i%4)*.4))%H;pix(x,y,i%3?3:5,i%3?3:5,'#fffef1');}}if(w==='wind'){for(let i=0;i<18;i++){const x=(hash(i,77)%W+tick*2.9)%(W+100),y=(hash(33,i)%H);ctx.strokeStyle='#f6f0d199';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x-40,y);ctx.quadraticCurveTo(x,y-9,x+22,y);ctx.stroke();}}if(w==='heat'){ctx.globalAlpha=.085;ctx.fillStyle='#f7b766';ctx.fillRect(0,0,W,H);}if(w==='storm'&&Math.floor(tick/63)%11===7){ctx.fillStyle='#f8f5e680';ctx.fillRect(0,0,W,H);}ctx.restore();}
function drawTractor(){if(!farm.tractor.owned)return;const X=(farm.tractor.active?farm.player.x:130)*T-cam.x,Y=(farm.tractor.active?farm.player.y:21)*T-cam.y;pix(X-11,Y-12,89,49,'#3b704c');pix(X+1,Y-28,46,29,'#7fb88b');pix(X+8,Y-23,30,19,'#d4e9da');pix(X-17,Y+22,109,11,'#b5a46a');for(const wx of [8,64]){ellipse(X+wx,Y+32,14,14,'#34454a');ellipse(X+wx,Y+32,6,6,'#d4c5a3');}pix(X+72,Y+5,26,7,'#e2c579');pix(X+87,Y-15,5,22,'#625b51');}
function drawFishing(){
 if(!fishingVisual)return;
 const f=fishingVisual,elapsed=Date.now()-f.started;
 if(elapsed>=3000){fishingVisual=null;return;}
 const p=farm.player,X=p.x*T-cam.x,Y=p.y*T-cam.y;
 const tx=f.targetX*T-cam.x,ty=f.targetY*T-cam.y;
 const dx=tx-X,dy=ty-Y,side=dx<0?-1:1;
 const cast=Math.min(1,Math.max(0,(elapsed-110)/410));
 const reel=elapsed>2050?Math.min(1,(elapsed-2050)/850):0;
 const tipX=X+side*(20+7*Math.sin(elapsed*.002)),tipY=Y-58-6*Math.sin(elapsed*.003);
 const bobX=(X+side*22)+(tx-X-side*22)*cast*(1-reel),bobY=(Y-42)+(ty-Y+42)*cast*(1-reel);
 ctx.save();
 // Handle, tapered rod and a spinning reel are anchored to the character's hand.
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle='#3d332a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(X+side*9,Y-11);ctx.lineTo(tipX,tipY);ctx.stroke();
 ctx.strokeStyle='#c99d5a';ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(X+side*9,Y-11);ctx.lineTo(tipX,tipY);ctx.stroke();
 ctx.strokeStyle='#f1da96';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X+side*9,Y-11);ctx.lineTo(tipX,tipY);ctx.stroke();
 ctx.fillStyle='#7c8d77';ctx.beginPath();ctx.arc(X+side*11,Y-17,5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e6cb87';ctx.beginPath();ctx.arc(X+side*11,Y-17,2,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#f7f7e6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.quadraticCurveTo(tipX+side*11,tipY+16,bobX,bobY);ctx.stroke();
 if(elapsed>370){
   const bob=2.3*Math.sin(elapsed*.008)+(elapsed>1350&&elapsed<1950?5*Math.sin(elapsed*.05):0);
   const cx=bobX,cy=bobY+bob;
   ctx.globalAlpha=.38;ctx.strokeStyle='#d8faf2';ctx.lineWidth=2;
   for(let j=0;j<2;j++){const rr=8+((elapsed*.022+j*13)%20);ctx.beginPath();ctx.ellipse(cx,cy+4,rr,rr*.32,0,0,Math.PI*2);ctx.stroke();}
   ctx.globalAlpha=1;
   ctx.fillStyle='#f8f3e2';ctx.beginPath();ctx.ellipse(cx,cy-5,5,6,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#dc6656';ctx.fillRect(cx-5,cy-7,10,4);
   ctx.fillStyle='#e7e19b';ctx.fillRect(cx-1,cy-13,2,4);
   if(elapsed>1540&&elapsed<2110){ctx.fillStyle='#fff4b5';ctx.font='bold 17px sans-serif';ctx.fillText('!',cx+13,cy-14);}
 }
 if(elapsed>2200){ctx.globalAlpha=Math.min(1,(elapsed-2200)/190);ctx.fillStyle='#fff6d1';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(f.success?'🐟 Улов!':'💧 Не клюёт',X,Y-74);}
 ctx.restore();
}
function render(){ctx.clearRect(0,0,W,H);world.background(cam,seasonIndex(),tick);if(v9)v9.drawWorld();drawField();drawVillagers();drawRanch();drawTractor();fence();chicken(29+Math.sin(tick*.009)*1.6,10,0);chicken(31+Math.cos(tick*.008)*1.1,12,2);chicken(27+Math.sin(tick*.006)*1.2,11,4);tinyCat(10.5+Math.sin(tick*.004)*.35,7.3);butterflies();player();drawFishing();if(v9)v9.drawPets();if(hover&&field(hover.x,hover.y)){ctx.strokeStyle='#fff5c1';ctx.lineWidth=3;ctx.strokeRect(hover.x*T-cam.x+2,hover.y*T-cam.y+2,28,28);}for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];pix(p.x-cam.x,p.y-cam.y,4,4,p.color);p.x+=p.vx;p.y+=p.vy;p.life--;if(p.life<0)puffs.splice(i,1);}overlay();floatingLight();weatherSplashes();drawWeatherExtended();if(waypoint){const tx=waypoint.x*T-cam.x,ty=waypoint.y*T-cam.y;ellipse(tx,ty,12+Math.sin(tick*.05)*3,4,'#ffedb6');pix(tx-3,ty-28,6,19,'#fef5aa');}}
function collide(x,y){return x<.8||y<.7||x>MW-.8||y>MH-.8||
 (x>3.8&&x<10.1&&y>3.1&&y<8.15)||(x>25.8&&x<32.1&&y>3.1&&y<8.2)||
 (x>2&&x<9.5&&y>15.1&&y<21.6)||(x>26&&x<31&&y>18.5&&y<22.5)||
 (x>36&&x<42&&y>3&&y<8)||(x>52&&x<59&&y>4&&y<9)||
 (x>44&&x<53&&y>11&&y<18)||
 // Garage in world-art.js: X=128 tiles, Y=12 tiles, solid body ends at y=17.35.
 (x>127.95&&x<135.10&&y>12.15&&y<17.65)||
 // Cooperative factory and storage hall, also rendered as solid.
 (x>124.08&&x<132.15&&y>39.85&&y<44.38);
}
function update(dt){tick+=dt*60;if(collide(farm.player.x,farm.player.y)&&farm.player.x>127&&farm.player.x<136&&farm.player.y>12&&farm.player.y<18){farm.player.x=131.5;farm.player.y=19.25;}else if(collide(farm.player.x,farm.player.y)&&farm.player.x>124&&farm.player.x<133&&farm.player.y>39&&farm.player.y<45){farm.player.x=129;farm.player.y=46.5;}let dx=Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft')),dy=Number(held.has('KeyS')||held.has('ArrowDown'))-Number(held.has('KeyW')||held.has('ArrowUp'));movement=Math.abs(dx)+Math.abs(dy);if(fishingVisual&&Date.now()-fishingVisual.started<2800){movement=0;dx=0;dy=0;}if(movement){const norm=Math.hypot(dx,dy);dx=dx/norm*(farm.upgrades.includes('boots')?4.6:3.4)*(farm.energy<=0?.48:farm.tractor.active?1.5:1)*dt;dy=dy/norm*(farm.upgrades.includes('boots')?4.6:3.4)*(farm.energy<=0?.48:farm.tractor.active?1.5:1)*dt;const p=farm.player;if(collide(p.x,p.y)){p.x=131.5;p.y=19.25;}if(dx>0)p.face='right';else if(dx<0)p.face='left';else if(dy>0)p.face='down';else if(dy<0)p.face='up';if(!collide(p.x+dx,p.y))p.x+=dx;if(!collide(p.x,p.y+dy))p.y+=dy;if(performance.now()>nextFootstepAt){sound.effect(farm.tractor.active?'tractorStep':'step');nextFootstepAt=performance.now()+(farm.tractor.active?700:415);}}
 if(performance.now()-lastFarmSoundRegion>750){lastFarmSoundRegion=performance.now();const q=farm.player;window.PolyFarmAudioRegion={nearWater:Math.min(Math.hypot(q.x-10,q.y-18),Math.hypot(q.x-45,q.y-17))<10,nearAnimals:Math.hypot(q.x-92,q.y-35)<17};}
 const targetX=clamp(farm.player.x*T-W*.5,0,MW*T-W),targetY=clamp(farm.player.y*T-H*.5,0,MH*T-H);cam.x+=(targetX-cam.x)*Math.min(1,dt*6);cam.y+=(targetY-cam.y)*Math.min(1,dt*6);if((isRain()||farm.generalUpgrades.includes('sprinkler'))&&Date.now()-lastRainAdvance>12500){lastRainAdvance=Date.now();for(const tile of Object.values(farm.tiles)){if(tile.tilled){tile.wetUntil=Date.now()+16000;if(tile.crop&&tile.crop.readyAt>Date.now()+2500)tile.crop.readyAt-=2000;}}save();}if(performance.now()-hudAt>500){updateHud();drawMinimap();hudAt=performance.now();}if(performance.now()-industryRefreshAt>4000){refreshEconomy();if(v9)v9.renderPanels();industryRefreshAt=performance.now();}}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop);}
function fish(){
 const p=farm.player;
 if(Math.min(Math.hypot(p.x-10,p.y-18),Math.hypot(p.x-45,p.y-17))>5.2)return note('Подойди поближе к пруду, чтобы порыбачить');
 const now=Date.now();if(now<fishingCooldown||fishingVisual)return note('Подожди немного — рыбалка уже идёт');
 if(farm.energy<5)return note('Слишком мало сил, пора домой');
 if(v9)v9.gain('fisher');
 fishingCooldown=now+6000;farm.energy-=5;
 const success=Math.random()>(farm.upgrades.includes('fishing')?.12:.29);
 const first=Math.hypot(p.x-10,p.y-18)<=Math.hypot(p.x-45,p.y-17);
 fishingVisual={started:now,success,targetX:first?7.2:45,targetY:first?18.4:17};
 sound.effect('fishCast');note('🎣 Забрасываю удочку…');
 setTimeout(()=>sound.effect('fishSplash'),440);
 setTimeout(()=>{if(fishingVisual?.started===now)sound.effect('fishBite');},1520);
 setTimeout(()=>{if(fishingVisual?.started===now)sound.effect('fishReel');},1910);
 // Credit the caught fish before the delayed animation, so switching tabs cannot lose progress.
 let message;
 if(success){const coins=14+Math.floor(Math.random()*24);farm.coins+=coins;record('fished');message='🐟 На крючке рыбка! Продано за '+coins+' монет';fx(p.x*T,p.y*T,'#bfeced',16);}
 else message='💧 Рыбка ускользнула. Попробуй ещё!';
 save();updateHud();
 setTimeout(()=>{if(fishingVisual?.started!==now)return;sound.effect(success?'fishCatch':'fishMiss');note(message);},2220);
}
function pos(e){const r=canvas.getBoundingClientRect();return {x:Math.floor(((e.clientX-r.left)/r.width*W+cam.x)/T),y:Math.floor(((e.clientY-r.top)/r.height*H+cam.y)/T)};}
canvas.addEventListener('pointermove',e=>hover=pos(e));canvas.addEventListener('pointerleave',()=>hover=null);canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=pos(e);if(v9&&v9.placeAt(p.x,p.y))return;if(!talk(villagerAt(p.x,p.y)))interact(p.x,p.y);});
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(['Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code)){setTool({Digit1:'hoe',Digit2:'seed',Digit3:'water',Digit4:'harvest',Digit5:'fertilize'}[e.code]);}if(e.code==='KeyT'&&!e.repeat)toggleTractor();if(e.code==='KeyF'&&!e.repeat)fish();if(e.code==='KeyE'&&!e.repeat&&!talkNearby()){const p=farm.player,off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.face];interact(Math.floor(p.x+off[0]),Math.floor(p.y+off[1]));}held.add(e.code);});window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{held.clear();save();});window.addEventListener('beforeunload',save);
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('sleepQuick')?.addEventListener('click',()=>{$('sleepBtn').click();});$('farmName').value=farm.name;$('farmName').addEventListener('change',e=>{farm.name=e.target.value.trim().slice(0,26)||'Долина клевера';save();note('Новое название сохранено');sound.effect('click');});$('sleepBtn').addEventListener('click',()=>{const oldEnergy=farm.energy;farm.day++;farm.dayStart=Date.now();farm.energy=farm.maxEnergy;farm.restedAt=Date.now();farm.player.x=17.5;farm.player.y=9.25;save();updateHud();updateQuestProgress();dailyBoard();note(oldEnergy<=0?'Ты выспался и снова полон сил! ☀':'Отдых в домике восстановил силы. Доброе утро!');sound.effect('sleep');if(audioRainEnabled)sound.setRain(isRain());});$('exportFarm')?.addEventListener('click',()=>{save();const blob=new Blob([JSON.stringify({format:'poly-scout-farm',version:9,save:farm},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='clover-farm-save.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);note('Копия фермы сохранена в файл');});
$('importFarm')?.addEventListener('click',()=>$('importFarmFile').click());
$('importFarmFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2_000_000)return note('Файл слишком большой: максимум 2 МБ');try{const v=JSON.parse(await f.text());if(v.format!=='poly-scout-farm'||![7,8,9].includes(v.version)||!v.save||typeof v.save!=='object'||typeof v.save.coins!=='number'||!v.save.tiles||!v.save.seeds)throw new Error('Неверный формат');if(!confirm('Заменить текущее сохранение фермы данными из файла?'))return;localStorage.setItem(STORAGE,JSON.stringify(v.save));location.reload();}catch{note('Не удалось загрузить копию: неверный файл');}finally{e.target.value='';}});
$('resetFarm').addEventListener('click',()=>{if(confirm('Начать новую ферму? Весь прогресс будет удалён.')){farm=initial();save();location.reload();}});
for(const btn of document.querySelectorAll('[data-farmmove]')){const code=btn.dataset.farmmove;btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);held.add(code);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>held.delete(code));}
$('farmInteract').addEventListener('click',()=>{if(talkNearby())return;const p=farm.player,off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.face];interact(Math.floor(p.x+off[0]),Math.floor(p.y+off[1]));});
$('musicFarm').addEventListener('click',async()=>{const on=await sound.toggleMusic();$('musicFarm').textContent=on?'♫ Музыка: играет':'♫ Музыка: выкл.';$('musicFarm').setAttribute('aria-pressed',String(on));note(on?'Играет тихая мелодия долины':'Музыка выключена');});
$('weatherFarm').addEventListener('click',async()=>{farm.weather=WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(farm.weather)+1)%WEATHER_CYCLE.length];save();syncWeatherUi();if(audioRainEnabled)await sound.setRain(isRain());note('Погода: '+weatherText()+(farm.weather==='auto'?' · по календарю':''));});
$('rainAudioFarm').addEventListener('click',async()=>{audioRainEnabled=!audioRainEnabled;await sound.setRain(audioRainEnabled&&isRain());syncWeatherUi();note(audioRainEnabled?(isRain()?'Слышен тихий шум дождя':'Шум дождя включится, когда пойдёт дождь'):'Звук дождя выключен');});

// Universal shop, garage and cooperative. All state is stored in the same v7 save key.
const GENERAL_STORE=[
 {id:'snack',name:'Яблочный пирог',icon:'🥧',price:95,desc:'+35 сил',buy:()=>farm.energy=Math.min(farm.maxEnergy,farm.energy+35)},
 {id:'meal',name:'Домашний обед',icon:'🍲',price:205,desc:'+85 сил',buy:()=>farm.energy=Math.min(farm.maxEnergy,farm.energy+85)},
 {id:'mixedseeds',name:'Коробка семян',icon:'🪴',price:260,desc:'12 случайных семян',buy:()=>{const pool=Object.keys(plants).slice(0,30);for(let i=0;i<12;i++){const id=pool[Math.floor(Math.random()*pool.length)];farm.seeds[id]=(farm.seeds[id]||0)+1;}}},
 {id:'feed',name:'Мешок корма',icon:'🌾',price:125,desc:'5 порций корма',buy:()=>farm.supplies.feed+=5},
 {id:'fertilizer',name:'Удобрение',icon:'🍂',price:185,desc:'8 применений инструмента 5',buy:()=>farm.supplies.fertilizer+=8},
 {id:'fuel',name:'Тракторное топливо',icon:'⛽',price:215,desc:'20 поездок комбайна',buy:()=>farm.supplies.fuel+=20},
 {id:'sprinkler',name:'Умный полив',icon:'💦',price:2800,desc:'Автополив всех грядок',permanent:true},
 {id:'greenhouse',name:'Тёплая теплица',icon:'🏡',price:3800,desc:'Растения созревают на 17% быстрее',permanent:true},
 {id:'stable',name:'Утеплённый хлев',icon:'🐑',price:2950,desc:'Продукты животных на 20% быстрее',permanent:true},
 {id:'trader',name:'Договор с рынком',icon:'📜',price:2400,desc:'+10% к продаже сырья',permanent:true},
 {id:'barnstorage',name:'Большой амбар',icon:'📦',price:4200,desc:'Расширение склада и красивый знак',permanent:true}
];
const RECIPES=[
 {id:'flour',icon:'🥖',name:'Мука для пекарни',cost:{'crop:wheat':4,'crop:corn':1},time:105000,sell:350},
 {id:'jam',icon:'🍯',name:'Ягодное варенье',cost:{'crop:berry':4,'crop:raspberry':2},time:160000,sell:660},
 {id:'juice',icon:'🧃',name:'Фруктовый сок',cost:{'crop:apple':2,'crop:orange':2},time:210000,sell:850},
 {id:'cheese',icon:'🧀',name:'Домашний сыр',cost:{'animal:cow':2,'animal:goat':1},time:240000,sell:1040},
 {id:'cake',icon:'🍰',name:'Медовый десерт',cost:{'animal:bee':1,'crop:wheat':3},time:200000,sell:720},
 {id:'cloth',icon:'🧵',name:'Шерстяное полотно',cost:{'crop:cotton':5,'animal:sheep':1},time:310000,sell:1350},
 {id:'perfume',icon:'🧴',name:'Лавандовые духи',cost:{'crop:lavender':4,'crop:vanilla':1},time:370000,sell:2070},
 {id:'island',icon:'🍹',name:'Тропический напиток',cost:{'crop:banana':2,'crop:pineapple':2},time:280000,sell:1560},
 {id:'luxury',icon:'✨',name:'Королевский набор',cost:{'crop:dragonfruit':2,'animal:peacock':1,'crop:saffron':1},time:460000,sell:4200}
];
const stockLabel=id=>{const [kind,key]=id.split(':');return kind==='crop'?(plants[key]?.icon+' '+plants[key]?.name):(animalInfo(key)?.icon+' '+animalInfo(key)?.produce)||id;};
// V12: inventory is a VIEW over the existing save: seeds, supplies and warehouse
// remain authoritative. Only handmade food is stored in bagItems.
const BAG_FOOD={snack:{name:'Ягодный перекус',icon:'🍓',energy:28},soup:{name:'Овощной суп',icon:'🥣',energy:55},compote:{name:'Садовый компот',icon:'🧃',energy:40}};
const BAG_RECIPES=[
 {id:'snack',cost:{'crop:berry':2,'crop:carrot':1}},
 {id:'soup',cost:{'crop:potato':2,'crop:carrot':2}},
 {id:'compote',cost:{'crop:apple':2,'crop:berry':1}}
];
const BAG_SUPPLIES={feed:{name:'Корм',icon:'🌾',hint:'Используй в меню животных'},fertilizer:{name:'Удобрение',icon:'🍂',hint:'Выбери инструмент 5 и обработай грядку'},fuel:{name:'Топливо',icon:'⛽',hint:'Нужно трактору при сборе урожая'}};
let bagTab='all',bagSelected='',bagRenderPending=false;
function scheduleBagRender(){if(bagRenderPending)return;bagRenderPending=true;requestAnimationFrame(()=>{bagRenderPending=false;updateBagBadge();if(!$('backpackPanel')?.hidden)renderBackpack();});}
function bagItemsList(){const result=[];
 for(const [id,qty] of Object.entries(farm.seeds)){if(Number(qty)>0&&plants[id])result.push({key:'seed:'+id,kind:'seed',id,name:'Семена: '+plants[id].name,icon:plants[id].icon,qty:Number(qty),desc:'Выбрать для посадки · рост '+Math.ceil(plants[id].grow/1000)+' сек.'});}
 for(const [id,qty] of Object.entries(farm.stock)){if(Number(qty)>0&&/^(crop|animal):/.test(id)){const [kind,ref]=id.split(':');const a=kind==='crop'?plants[ref]:animalInfo(ref);if(!a)continue;result.push({key:'stock:'+id,kind:'stock',id,name:stockLabel(id),icon:kind==='crop'?a.icon:a.icon,qty:Number(qty),desc:kind==='crop'?'Собранный урожай · можно продать или переработать':'Продукт животного · можно продать или переработать'});}}
 for(const [id,qty] of Object.entries(farm.supplies)){if(Number(qty)>0&&BAG_SUPPLIES[id]){const a=BAG_SUPPLIES[id];result.push({key:'supply:'+id,kind:'supply',id,name:a.name,icon:a.icon,qty:Number(qty),desc:a.hint});}}
 for(const [id,qty] of Object.entries(farm.bagItems)){if(Number(qty)>0&&BAG_FOOD[id]){const a=BAG_FOOD[id];result.push({key:'food:'+id,kind:'food',id,name:a.name,icon:a.icon,qty:Number(qty),desc:'Восстанавливает '+a.energy+' сил'});}}
 return result;
}
function bagPrice(id){const [type,code]=id.split(':');const base=type==='crop'?(plants[code]?.sell||0):(animalInfo(code)?.yield||0);return Math.round(base*(farm.upgrades.includes('market')?1.25:1)*(farm.generalUpgrades.includes('trader')?1.1:1));}
function bagSell(id,count){const have=Math.max(0,Number(farm.stock[id])||0),n=Math.max(0,Math.min(have,Math.floor(count)));if(!n)return;const value=bagPrice(id)*n;farm.stock[id]=have-n;farm.coins+=value;farm.stats.earned+=value;save();updateHud();refreshEconomy();note('Продано '+n+' ед. · +'+value+' ✦');renderBackpack();}
function bagCraft(id){const r=BAG_RECIPES.find(x=>x.id===id);if(!r||!Object.entries(r.cost).every(([key,qty])=>(farm.stock[key]||0)>=qty))return note('Не хватает ингредиентов на складе');for(const [key,qty]of Object.entries(r.cost))farm.stock[key]-=qty;farm.bagItems[id]=(farm.bagItems[id]||0)+1;save();refreshEconomy();renderBackpack();note('Приготовлено: '+BAG_FOOD[id].name+'!');}
function updateBagBadge(){const a=$('backpackCount');if(a)a.textContent=bagItemsList().reduce((n,it)=>n+it.qty,0);}
function bagShow(show){const el=$('backpackPanel');if(!el)return;el.hidden=!show;$('backpackToggle')?.setAttribute('aria-expanded',String(show));if(show){renderBackpack();el.scrollIntoView({behavior:'smooth',block:'nearest'});}}
function renderBackpack(){const panel=$('backpackPanel');if(!panel||panel.hidden)return;const items=bagItemsList();const all=items.filter(it=>bagTab==='all'||it.kind===bagTab);const sorter=farm.bagSort;all.sort((a,b)=>sorter==='qty'?b.qty-a.qty||a.name.localeCompare(b.name,'ru'):sorter==='name'?a.name.localeCompare(b.name,'ru'):['seed','stock','supply','food'].indexOf(a.kind)-['seed','stock','supply','food'].indexOf(b.kind)||a.name.localeCompare(b.name,'ru'));
 $('bagStorage').textContent=stockCount()+' / '+stockCapacity();$('bagSeeds').textContent=Object.values(farm.seeds).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);$('bagCoins').textContent=Math.floor(farm.coins);$('bagSort').value=sorter;$('bagStoreMode').checked=!farm.autoTrade;
 document.querySelectorAll('[data-bag-tab]').forEach(b=>{const active=b.dataset.bagTab===bagTab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const grid=$('bagGrid');grid.replaceChildren();for(const it of all){const b=document.createElement('button');b.type='button';b.className='backpack-slot'+(it.key===bagSelected?' selected':'');b.title=it.name+' ×'+it.qty;b.setAttribute('aria-label',it.name+', '+it.qty+' штук');b.innerHTML='<span class="bag-icon"></span><span class="bag-qty"></span><span class="bag-label"></span>';b.querySelector('.bag-icon').textContent=it.icon;b.querySelector('.bag-qty').textContent='×'+it.qty;b.querySelector('.bag-label').textContent=it.name;b.addEventListener('click',()=>{bagSelected=it.key;renderBackpack();});grid.append(b);}
 for(let i=all.length;i<Math.max(24,all.length);i++){const empty=document.createElement('div');empty.className='backpack-slot empty';empty.setAttribute('aria-hidden','true');grid.append(empty);}
 const info=$('bagItemInfo');info.replaceChildren();const chosen=items.find(x=>x.key===bagSelected);if(!chosen){const title=document.createElement('strong');title.textContent='Выбери предмет';const p=document.createElement('p');p.textContent=all.length?'Нажми на ячейку слева, чтобы выбрать действие.':'В этой категории пока ничего нет.';info.append(title,p);}else{
 const title=document.createElement('h3');title.textContent=chosen.icon+' '+chosen.name;const desc=document.createElement('p');desc.textContent=chosen.desc;const qty=document.createElement('p');qty.className='backpack-qtytext';qty.textContent='В наличии: '+chosen.qty;info.append(title,desc,qty);
 const act=(text,handler)=>{const b=document.createElement('button');b.type='button';b.className='backpack-action';b.textContent=text;b.addEventListener('click',handler);info.append(b);};
 if(chosen.kind==='seed')act('🌱 Взять для посадки',()=>{selected=chosen.id;setTool('seed');updateHud();note('Выбраны семена: '+plants[chosen.id].name);bagShow(false);});
 if(chosen.kind==='stock'){act('✦ Продать 1 · '+bagPrice(chosen.id),()=>bagSell(chosen.id,1));if(chosen.qty>1)act('✦ Продать всё · '+bagPrice(chosen.id)*chosen.qty,()=>bagSell(chosen.id,chosen.qty));}
 if(chosen.kind==='food')act('🍽 Съесть · +'+BAG_FOOD[chosen.id].energy+' сил',()=>{if(farm.energy>=farm.maxEnergy)return note('Силы уже полностью восстановлены');farm.bagItems[chosen.id]--;farm.energy=Math.min(farm.maxEnergy,farm.energy+BAG_FOOD[chosen.id].energy);save();updateHud();renderBackpack();note('Восстановлены силы!');});
 if(chosen.kind==='supply'&&chosen.id==='fertilizer')act('🍂 Выбрать удобрение',()=>{setTool('fertilize');bagShow(false);});
 if(chosen.kind==='supply'&&chosen.id==='fuel'&&farm.tractor.owned)act('🚜 Включить / выключить трактор',()=>{toggleTractor();renderBackpack();});
 }
 const recipes=$('bagRecipes');recipes.replaceChildren();for(const rec of BAG_RECIPES){const food=BAG_FOOD[rec.id],ok=Object.entries(rec.cost).every(([id,n])=>(farm.stock[id]||0)>=n),row=document.createElement('div');row.className='backpack-recipe';const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=food.icon+' '+food.name;const detail=document.createElement('small');detail.textContent=Object.entries(rec.cost).map(([id,n])=>stockLabel(id)+' ×'+n).join(' · ');copy.append(name,detail);const b=document.createElement('button');b.type='button';b.textContent='Готовить';b.disabled=!ok;b.addEventListener('click',()=>bagCraft(rec.id));row.append(copy,b);recipes.append(row);}
}
$('backpackToggle')?.addEventListener('click',()=>bagShow($('backpackPanel').hidden));$('backpackClose')?.addEventListener('click',()=>bagShow(false));
document.querySelectorAll('[data-bag-tab]').forEach(btn=>btn.addEventListener('click',()=>{bagTab=btn.dataset.bagTab;bagSelected='';renderBackpack();}));
$('bagSort')?.addEventListener('change',e=>{farm.bagSort=e.target.value;save();renderBackpack();});
$('bagStoreMode')?.addEventListener('change',e=>{farm.autoTrade=!e.target.checked;save();refreshEconomy();renderBackpack();note(farm.autoTrade?'Автопродажа включена':'Урожай теперь складывается в амбар');});
window.addEventListener('keydown',e=>{const target=e.target;if(e.code!=='KeyI'||e.repeat||target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement||target.isContentEditable)return;e.preventDefault();bagShow($('backpackPanel').hidden);});
updateBagBadge();

function toggleTractor(){if(!farm.tractor.owned)return note('Купи трактор в гараже, чтобы включить режим 🚜');farm.tractor.active=!farm.tractor.active;if(farm.tractor.active)setTool('harvest');save();refreshEconomy();note(farm.tractor.active?'🚜 Трактор включён: инструмент 4 собирает квадратами':'Трактор припаркован');sound.effect('tractor');}
function refreshEconomy(){const store=$('generalStore'),warehouse=$('warehouseStock'),factoryBox=$('factoryBoard'),garage=$('garageBoard');if(!store)return;
 store.replaceChildren();for(const item of GENERAL_STORE){const owned=item.permanent&&farm.generalUpgrades.includes(item.id);const row=document.createElement('div');row.className='economy-row';const lbl=document.createElement('div');lbl.innerHTML='<strong>'+item.icon+' '+item.name+'</strong><small>'+item.desc+'</small>';const btn=document.createElement('button');btn.type='button';btn.textContent=owned?'✓ Куплено':item.price+' ✦';btn.disabled=owned||farm.coins<item.price;btn.addEventListener('click',()=>{if(farm.coins<item.price)return;farm.coins-=item.price;if(item.permanent)farm.generalUpgrades.push(item.id);else item.buy();save();updateHud();refreshEconomy();note('Куплено: '+item.name);sound.effect('buy');});row.append(lbl,btn);store.append(row);}
 if($('stockMode'))$('stockMode').checked=!farm.autoTrade;
 const stock=Object.entries(farm.stock).filter(([_,v])=>v>0);warehouse.replaceChildren();const capacity=document.createElement('p');capacity.className='economy-note';capacity.textContent='Заполнено: '+stockCount()+' / '+stockCapacity()+' ед. · склад сохраняется после выхода';warehouse.append(capacity);if(!stock.length){const empty=document.createElement('p');empty.className='economy-note';empty.textContent='Склад пуст. Включи «Оставлять урожай на складе», затем собери урожай или продукты животных.';warehouse.append(empty);}else for(const [id,qty]of stock){const row=document.createElement('div');row.className='economy-row';const label=document.createElement('div');label.innerHTML='<strong>'+stockLabel(id)+'</strong><small>На складе: '+qty+' шт.</small>';const btn=document.createElement('button');const [kind,key]=id.split(':');const base=kind==='crop'?(plants[key]?.sell||0):(animalInfo(key)?.yield||0);const price=Math.round(base*(farm.upgrades.includes('market')?1.25:1)*(farm.generalUpgrades.includes('trader')?1.1:1));btn.textContent='Продать всё · '+price*qty+' ✦';btn.addEventListener('click',()=>{const amount=farm.stock[id]||0;if(!amount)return;farm.stock[id]=0;farm.coins+=price*amount;record('earned',price*amount);save();updateHud();refreshEconomy();note('Продано со склада: +'+price*amount+' ✦');sound.effect('sell');});row.append(label,btn);warehouse.append(row);}
 garage.replaceChildren();if(!farm.tractor.owned){const b=document.createElement('button');b.className='economy-primary';b.textContent='🚜 Купить трактор · 8500 ✦';b.disabled=farm.coins<8500;b.addEventListener('click',()=>{if(farm.coins<8500)return;farm.coins-=8500;farm.tractor.owned=true;farm.tractor.active=true;farm.supplies.fuel+=35;setTool('harvest');save();updateHud();refreshEconomy();note('Трактор куплен! Нажми на поле — соберёшь 3×3 клетки.');sound.effect('tractor');});garage.append(b);}else{const toggle=document.createElement('button');toggle.className='economy-primary';toggle.textContent=farm.tractor.active?'🚜 Припарковать трактор (T)':'🚜 Выехать на поле (T)';toggle.addEventListener('click',toggleTractor);garage.append(toggle);if(farm.tractor.level===1){const upgrade=document.createElement('button');upgrade.textContent='Расширить ковш до 5×5 · 11500 ✦';upgrade.disabled=farm.coins<11500;upgrade.addEventListener('click',()=>{if(farm.coins<11500)return;farm.coins-=11500;farm.tractor.level=2;save();updateHud();refreshEconomy();note('Теперь трактор собирает площадь 5×5!');});garage.append(upgrade);}}const fuel=document.createElement('p');fuel.className='economy-note';fuel.textContent='Топливо: '+farm.supplies.fuel+' · трактор собирает '+(farm.tractor.level===2?'5×5':'3×3')+' грядок, расходуя 1 ед. за сбор.';garage.append(fuel);
 factoryBox.replaceChildren();if(!farm.factory.owned){const b=document.createElement('button');b.className='economy-primary';b.disabled=farm.coins<5400;b.textContent='🏭 Построить кооператив · 5400 ✦';b.addEventListener('click',()=>{if(farm.coins<5400)return;farm.coins-=5400;farm.factory.owned=true;save();updateHud();refreshEconomy();note('Кооператив открыт! Выбирай рецепт.');sound.effect('build');});factoryBox.append(b);return;}
 const maxSlots=farm.factory.level===2?3:1;const info=document.createElement('p');info.className='economy-note';info.textContent='Линии производства: '+farm.factory.jobs.length+'/'+maxSlots+' · готовая продукция продаётся после завершения таймера, даже если игра закрыта.';factoryBox.append(info);
 for(const job of farm.factory.jobs){const recipe=RECIPES.find(x=>x.id===job.recipe);if(!recipe)continue;const ready=Date.now()>=job.readyAt,row=document.createElement('div');row.className='economy-row';const name=document.createElement('div');name.innerHTML='<strong>'+recipe.icon+' '+recipe.name+'</strong><small>'+(ready?'Готово к отправке':timeSpan(job.readyAt-Date.now())+' до завершения')+'</small>';const btn=document.createElement('button');btn.disabled=!ready;btn.textContent=ready?'Отправить +'+recipe.sell+' ✦':'В работе';btn.addEventListener('click',()=>{if(Date.now()<job.readyAt)return;farm.coins+=recipe.sell;farm.factory.jobs=farm.factory.jobs.filter(j=>j!==job);record('processed');record('earned',recipe.sell);save();updateHud();refreshEconomy();note('Готовая продукция продана! +'+recipe.sell+' ✦');});row.append(name,btn);factoryBox.append(row);}
 if(farm.factory.level===1){const b=document.createElement('button');b.className='economy-primary';b.textContent='Открыть три линии · 9200 ✦';b.disabled=farm.coins<9200;b.addEventListener('click',()=>{if(farm.coins<9200)return;farm.coins-=9200;farm.factory.level=2;save();updateHud();refreshEconomy();note('Кооператив расширен до трёх линий');});factoryBox.append(b);}
 for(const recipe of RECIPES){const can=Object.entries(recipe.cost).every(([id,n])=>(farm.stock[id]||0)>=n),row=document.createElement('div');row.className='economy-row';const label=document.createElement('div');label.innerHTML='<strong>'+recipe.icon+' '+recipe.name+'</strong><small>'+Object.entries(recipe.cost).map(([id,n])=>stockLabel(id)+' ×'+n).join(' + ')+' · '+timeSpan(recipe.time)+'</small>';const btn=document.createElement('button');btn.textContent='Запустить · '+recipe.sell+' ✦';btn.disabled=!can||farm.factory.jobs.length>=maxSlots;btn.addEventListener('click',()=>{if(farm.factory.jobs.length>=maxSlots||!Object.entries(recipe.cost).every(([id,n])=>(farm.stock[id]||0)>=n))return;for(const [id,n] of Object.entries(recipe.cost))farm.stock[id]-=n;farm.factory.jobs.push({recipe:recipe.id,readyAt:Date.now()+recipe.time});save();refreshEconomy();note('На заводе запущен выпуск: '+recipe.name);});row.append(label,btn);factoryBox.append(row);}
}
$('stockMode')?.addEventListener('change',e=>{farm.autoTrade=!e.target.checked;save();refreshEconomy();note(farm.autoTrade?'Урожай автоматически продаётся':'Теперь урожай и продукты поступают на склад');});
const appearanceOptions={skin:['#f2cda0','#e8b28a','#c88a63','#8a553d','#f6ddc4'],hair:['#72482f','#3d302f','#bc7f49','#d5aa69','#704f8b'],shirt:['#467d83','#b86b77','#618454','#daaa62','#6576bd'],hat:['#d4ae6d','#be776a','#90a77d','#6d6a8c','#f3d9a0'],style:['hat','cap','hair']};
function setupCustom(){
 const box=$('characterOptions');if(!box)return;
 box.innerHTML='';const names={skin:'Кожа',hair:'Волосы',shirt:'Одежда',hat:'Головной убор',style:'Причёска'};
 for(const [key,values] of Object.entries(appearanceOptions)){
  const row=document.createElement('div');row.className='custom-line';const lbl=document.createElement('strong');lbl.textContent=names[key];row.append(lbl);
  const opts=document.createElement('div');opts.className='swatch-row';
  values.forEach((value,i)=>{const b=document.createElement('button');b.type='button';b.className='look-swatch';b.title=key==='style'?['Шляпа','Кепка','Без головного убора'][i]:names[key]+' '+(i+1);b.setAttribute('aria-label',b.title);b.style.background=key==='style'?['#d5ae71','#657fa0','#90654e'][i]:value;b.textContent=key==='style'?['▱','▰','✿'][i]:'';b.classList.toggle('chosen',farm.appearance[key]===value);b.addEventListener('click',()=>{farm.appearance[key]=value;setupCustom();save();});opts.append(b);});row.append(opts);box.append(row);
 }
}
const mm=$('farmMap');let mapCtx=mm?.getContext('2d');
function drawMinimap(){if(!mapCtx)return;const c=mapCtx,w=mm.width,h=mm.height;c.clearRect(0,0,w,h);c.fillStyle='#86ba70';c.fillRect(0,0,w,h);
 const sx=w/MW,sy=h/MH;
 const rect=(x,y,w2,h2,color)=>{c.fillStyle=color;c.fillRect(x*sx,y*sy,w2*sx,h2*sy);};
 for(let j=0;j<220;j++){const x=hash(j,1)%MW,y=hash(j,5)%MH;rect(x,y,1,1,j%3?'#73a96c':'#a1c68a');}
 for(const [x,y,ww,hh] of [[1,15,10,8],[43,12,10,7],[8,30,11,7]]){c.fillStyle='#72b9c4';c.beginPath();c.ellipse((x+ww/2)*sx,(y+hh/2)*sy,ww*sx*.49,hh*sy*.48,0,0,Math.PI*2);c.fill();}
 rect(4,3,6,5,'#ae6957');rect(26,3,6,5,'#9d8070');rect(37,3,6,5,'#b78b62');rect(54,4,5,4,'#837f87');rect(68,4,6,5,'#9d7e66');
 for(const b of [[12,10,14,12],[40,22,15,12]]){rect(...b,'#957248');}for(const p of PARCELS){rect(p.x,p.y,p.w,p.h,farm.parcels.includes(p.id)?'#87613e':'#c9a578');}rect(84,28,25,23,'#b8a26f');rect(49,67,37,13,'#cfbd7f');rect(128,12,7,5,'#7c8b7a');rect(124,38,8,6,'#ad8e73');rect(137,57,5,4,'#ce9c6a');rect(127,77,6,32,'#7dbbc0');
 for(let x=0;x<6;x++)for(let y=0;y<4;y++)rect(43+x*2,5+y*2,1,1,'#4c8657');
 c.fillStyle='#fff5bd';c.beginPath();c.arc(farm.player.x*sx,farm.player.y*sy,4.5,0,Math.PI*2);c.fill();c.strokeStyle='#3f5844';c.lineWidth=2;c.stroke();
 for(const v of VILLAGERS){const q=v9?v9.npcPosition(v):v;c.fillStyle='#ffe7b0';c.fillRect(q.x*sx-2,q.y*sy-2,5,5);}if(waypoint){c.strokeStyle='#fdf0b6';c.lineWidth=2;c.strokeRect(waypoint.x*sx-5,waypoint.y*sy-5,10,10);}
}
mm?.addEventListener('click',e=>{const r=mm.getBoundingClientRect();waypoint={x:Math.min(MW-2,Math.max(1,Math.floor((e.clientX-r.left)/r.width*MW))),y:Math.min(MH-2,Math.max(1,Math.floor((e.clientY-r.top)/r.height*MH)))};drawMinimap();note('Точка на карте отмечена — иди к светлому маячку');});
document.querySelectorAll('[data-travel]').forEach(b=>b.addEventListener('click',()=>{const destinations={home:[17.5,9.25],east:[38,18],orchard:[47,9],south:[21,34],high:[70,11],river:[64,37],ranch:[95,34],forest:[86,7],coast:[80,67],island:[108,72],garage:[132,23],factory:[129,50],market:[140,66]};const xy=destinations[b.dataset.travel];if(!xy)return;farm.player.x=xy[0];farm.player.y=xy[1];if(!farm.visitedRegions.includes(b.dataset.travel)){farm.visitedRegions.push(b.dataset.travel);farm.stats.visited=farm.visitedRegions.length;updateQuestProgress();}waypoint=null;save();drawMinimap();note('Новое место: '+b.textContent);if(sound?.effect)sound.effect('jump');}));
// Простой сбор фруктов в новом саду (G); каждый день можно получить 3 плода.
function forage(){const p=farm.player;if(!(p.x>=42&&p.x<=54&&p.y>=4&&p.y<=14))return note('Фрукты можно собирать в восточном саду · клавиша G');const key='forageDay';if(farm[key]===farm.day)return note('Сегодня все спелые фрукты уже собраны');farm[key]=farm.day;farm.fruit=(farm.fruit||0)+3;farm.coins+=33;record('foraged',3);save();updateHud();note('Собрано 3 яблока · +33 монеты');sound.effect('forage');fx(p.x*T,p.y*T,'#f3b494',24);}
window.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat&&!(e.target instanceof HTMLInputElement))forage();});
$('forageBtn')?.addEventListener('click',forage);
v9=window.createPolyFarmV9?.({farm,plants,animalTypes:ANIMAL_TYPES,parcels:PARCELS,stats:farm.stats,save,note,updateHud,refreshEconomy,setupAnimalShop,dayClock,villagers:VILLAGERS,canvas,ctx,T,W,H,cam})||null;
setupCustom();drawMinimap();setupLandShop();setupUpgradeShop();updateQuestProgress();storyBoard();setupAnimalShop();dailyBoard();fullscreen('fullscreenFarm');
if(offlineDuration>18000){const ready=Object.values(farm.tiles).filter(t=>t.crop&&t.crop.readyAt<=Date.now()).length;setTimeout(()=>note('С возвращением! Пока тебя не было '+timeSpan(offlineDuration)+'; готовых культур: '+ready+'.'),850);}
setInterval(()=>{if(document.visibilityState==='visible')setupAnimalShop();},10000);

setupShop();refreshEconomy();updateHud();requestAnimationFrame(loop);setInterval(save,15000);

})();
