/* POLY CINEMA — original inked scenery & character animation for the browser game.
 * Stateless Canvas renderer. Does not touch gameplay, collision or saved progress.
 * No external assets, fonts, or network required. */
(()=>{'use strict';
const PI=Math.PI,T=PI*2,INK='#292331',PAPER='#fff0ce';
const palette=[
 ['#273e60','#d59c99','#eab779','#59485f','#e5c29a'],
 ['#466d68','#9ccfa5','#f1ccb7','#41645f','#e9b2b9'],
 ['#3d4861','#aab6ce','#e1cb9e','#52546c','#d0a280'],
 ['#1b3657','#8097c1','#e7ac86','#3a4968','#dec0a6'],
 ['#85506c','#e8a5af','#ffe1ad','#965b72','#f4c3a1'],
 ['#47728a','#b1e0e8','#eef6ef','#729bb9','#dae2e6'],
 ['#34304e','#9581ab','#dbb6b3','#594265','#e1c4d0'],
 ['#574960','#9b8d93','#dbc1a1','#6b5d67','#cbaa88'],
 ['#41334e','#af799a','#efd0c4','#694461','#e7b2c0'],
 ['#191a33','#684d84','#d590a2','#483453','#c6a4b7']
];
function line(c,x,y,X,Y,color=INK,w=3){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()}
function oval(c,x,y,rx,ry,color,stroke=INK,lw=3,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,T);c.fillStyle=color;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}}
function curve(c,pts,fill,stroke=INK,lw=4){c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i+5<pts.length;i+=6)c.bezierCurveTo(...pts.slice(i,i+6));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke()}}
function rounded(c,x,y,w,h,r,fill,stroke=INK,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}}
function rays(c,x,y,tm,color,count=13){c.save();c.translate(x,y);c.rotate(tm*.0002);c.fillStyle=color;for(let i=0;i<count;i++){const a=i*T/count;c.beginPath();c.moveTo(Math.cos(a)*46,Math.sin(a)*46);c.lineTo(Math.cos(a-.06)*660,Math.sin(a-.06)*660);c.lineTo(Math.cos(a+.06)*660,Math.sin(a+.06)*660);c.fill();}c.restore()}
function star(c,x,y,r,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,rr=i%2?r*.48:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=INK;c.lineWidth=2.3;c.stroke();c.restore()}
function cloud(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=.85;oval(c,-32,9,43,18,'#fff1d7','#58626a',2);oval(c,-4,-7,36,28,'#fff8e6','#58626a',2);oval(c,39,8,38,20,'#fff3d9','#58626a',2);c.restore()}
function hill(c,offset,y,fill,w=960){c.beginPath();c.moveTo(0,540);c.lineTo(0,y);for(let x=0;x<=w+40;x+=40)c.lineTo(x,y+Math.sin(x*.011+offset)*21+Math.sin(x*.031+offset)*10);c.lineTo(w,540);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke()}
function flower(c,x,y,s,t){c.save();c.translate(x,y);c.scale(s,s);line(c,0,0,Math.sin(t)*4,-65,'#3b6753',6);oval(c,-16,-21,17,9,'#72a38b','#386758',2,-.4);oval(c,17,-44,16,8,'#79b28c','#386758',2,.4);c.translate(Math.sin(t)*4,-73);for(let i=0;i<7;i++){const a=i*T/7;oval(c,Math.cos(a)*21,Math.sin(a)*21,18,13,i%2?'#ffd5b9':'#ed8ba1',INK,2,a)}oval(c,0,0,17,16,'#ffce62',INK,3);oval(c,-6,-3,2.5,5,INK,null);oval(c,6,-3,2.5,5,INK,null);c.restore()}
function building(c,x,y,w,h,fill,detail,kind=0){c.save();c.translate(x,y);rounded(c,0,-h,w,h,8,fill,INK,5);curve(c,[-13,-h, w*.35,-h-37, w*.68,-h-39, w+12,-h],detail,INK,5);rounded(c,w*.36,-57,w*.28,57,15,'#503a50',INK,3);oval(c,w*.5,-51,9,18,'#ffd2a2',null);for(let i=0;i<2;i++){rounded(c,10+i*(w-37),-h+17,27,37,9,'#ffe9bb',INK,2);line(c,23+i*(w-37),-h+18,23+i*(w-37),-h+53,INK,2)}c.restore()}
function gardenTree(c,x,y,s,t){c.save();c.translate(x,y);c.scale(s,s);curve(c,[-10,3,-4,-40,-14,-69,-8,-124,  -5,-132, 17,-132, 18,-120,  10,-73, 20,-35, 15,3],'#855e60',INK,5);for(const [a,b,r] of [[-30,-114,39],[12,-136,49],[49,-103,41],[-5,-86,39]]){oval(c,a+Math.sin(t*.6+a)*2,b,r,r*.8,a%2?'#87ae83':'#528b77',INK,4);oval(c,a-10,b-12,r*.43,r*.17,'#b5d19a',null)}c.restore()}
function prop(c,i,x,y,tm,level){const p=palette[level];c.save();c.translate(x,y);const b=Math.sin(tm*.023+i*1.7);
 if(level===0){if(i%4===0){ // striped circus tent
  curve(c,[-60,0,-48,-80,-12,-112,0,-141, 15,-112,52,-75,59,0],p[4],INK,5);for(let q=-1;q<=1;q++)curve(c,[q*25-12,0,q*26-11,-70,q*15,-90,q*5,-125],q%2?'#e1a0a0':'#ffdeb0',null);line(c,0,-147,0,-174,INK,4);star(c,1,-179,11,'#ffdb84',b*.05);}
  else{gardenTree(c,0,0,.65,b);}}
 else if(level===1){flower(c,0,0,1.6,b);if(i%3===0)gardenTree(c,52,6,.55,b);}
 else if(level===2){building(c,-35,0,74,168+i%4*13,'#7e7896','#e4c28b');oval(c,0,-127,26,29,PAPER,INK,4);line(c,0,-127,0,-145,INK,3);line(c,0,-127,14,-127,INK,2);}
 else if(level===3){building(c,-40,0,86,120+i%3*20,'#667798','#c9afae');line(c,15,-151,15,-183,'#474157',6);oval(c,15,-186,11,11,'#ffe3a3',INK,3);}
 else if(level===4){building(c,-35,0,72,90+i%4*18,'#efa9a9','#fff0ce');for(let a=0;a<4;a++)oval(c,-17+a*13,-100,14,19,'#ffe6c3',INK,2);oval(c,0,-130,20,22,'#ffb7ae',INK,3);}
 else if(level===5){curve(c,[-28,0,-20,-54,-36,-89,-7,-176, 13,-137,25,-72,34,0],'#d8f0f7','#527c9b',5);line(c,-26,-25,26,-106,'#fffefe',3);}
 else if(level===6){rounded(c,-32,-156,64,157,30,'#665b87',INK,5);oval(c,0,-92,26,48,'#dfbed3',INK,4);oval(c,0,-92,14,33,'#fff0d8',null);star(c,0,-97,10,'#b98aa9',b*.04);}
 else if(level===7){rounded(c,-50,-108,102,100,8,'#846c71',INK,5);rounded(c,-37,-94,76,29,4,'#c5aa8f',INK,3);for(let j=-1;j<=1;j++)oval(c,j*32,-6,16,17,'#3c3d54',INK,3);oval(c,0,-116,24,24,'#ded5cb',INK,3);}
 else if(level===8){rounded(c,-45,-156,91,154,17,'#876783',INK,5);oval(c,0,-115,31,49,'#ffe8ce',INK,4);for(let s=-1;s<=1;s++)oval(c,s*16,-123,5,13,'#49384e',null);}
 else{building(c,-47,0,96,185,'#4c3a67','#b48ea5');for(let s=-1;s<=1;s++)star(c,s*30,-157,9,'#d9ada9',b*.06);}
 c.restore();}
function stage(c,{level=0,cam=0,frames=0,W=960,H=540,FLOOR=435}={}){
 const p=palette[level%10],t=frames;const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,p[0]);sky.addColorStop(.6,p[1]);sky.addColorStop(1,p[2]);c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.save();c.globalAlpha=.15;rays(c,level===9?780:600,126,t,'#fff0dc');c.restore();
 // Print-style moon/sun, nested hand-inked rings and spotlights.
 oval(c,level===9?700:690,136,73,73,level===9?'#ecd2c2':'#fff0c5','#674e61',4);oval(c,710,115,13,11,'#ecd0ae',null);oval(c,666,155,8,8,'#ecd0ae',null);
 for(let i=0;i<7;i++){const x=(i*220-(cam*.12)%220+220)%1100-55,y=97+(i%3)*35;cloud(c,x,y,.55+(i%3)*.15)}
 hill(c,1.2-cam*.0003,337,p[3]);hill(c,2.4-cam*.0013,368,p[4]);
 // scrolling painted scenery in 3 depth layers with per-level silhouettes
 for(let i=0;i<18;i++){const x=i*115-((cam*.38)%115)-62;prop(c,i,x,408+((i%4)-2)*7,t,level);}
 // hand inked heavy stage, wooden boards and brass rivets
 c.fillStyle='#352f3c';c.fillRect(0,FLOOR-3,W,12);c.fillStyle=level>=8?'#614657':'#b18165';c.fillRect(0,FLOOR+9,W,H-FLOOR);
 c.save();c.globalAlpha=.29;for(let j=0;j<7;j++){line(c,0,FLOOR+20+j*15,W,FLOOR+20+j*15,'#392933',2.5)}c.restore();
 for(let i=0;i<30;i++){oval(c,i*36+(cam*.4%36),FLOOR+14,2,2,'#eed7ae',null)}
 // ground footlights, plants, falling stylized atmospheric flakes
 for(let i=0;i<8;i++){let x=i*141-(cam*.7%141)+40;oval(c,x,FLOOR-3,11,4,'#314a4c88',null);if(level===1||level===0)flower(c,x,FLOOR,.24,frames*.02+i);}
 if(level===3||level===5||level===9){for(let i=0;i<24;i++){const x=((i*171+Math.sin(i*4)*44+t*(level===5?.6:1.25))%1050+1050)%1050-45, y=((i*71+t*(level===5?.3:2.3))%430+430)%430;line(c,x,y,x-5,y+14,level===5?'#fff5eccc':'#f0d0ddaa',level===5?2:1.6)}}
 if(level===0||level===4||level===8){for(let i=0;i<13;i++){const x=(i*197+Math.sin(t*.022+i)*18)%980,y=70+(i*71)%290;star(c,x,y,3.6,p[2],t*.006)}}
}
function glove(c,x,y,rot=0){c.save();c.translate(x,y);c.rotate(rot);curve(c,[-13,4,-22,-2,-12,-24,-3,-18, 4,-31,18,-18,12,-6, 25,-11,29,8,10,16, -8,24,-16,13,-13,4],PAPER,INK,4);line(c,0,1,12,7,'#b7a68d',2);c.restore()}
function hero(c,{x,y,w=45,h=72,walk=0,face=1,heroId=0,body='#79ad9d',head='#f3d8b3',ground=true,duck=false,flash=0,dash=0,inv=0,frames=0,vx=0,vy=0,shield=0}={}){
 if(inv>0&&Math.floor(frames/5)%2)return;
 const t=walk,run=Math.abs(vx)>1.2,hop=!ground,foot=run?Math.sin(t*2.8)*12:Math.sin(frames*.05)*1.2;const squash=duck?.67:hop?1.11:1+Math.sin(t*2)*.03,stretch=hop?.9:run?1.045:1;
 c.save();c.translate(x+w*.5,y+h);c.scale(face*stretch,squash);c.translate(-w*.5,-h);
 c.save();c.globalAlpha=.23;oval(c,23,h+3,29,5,'#171326',null);c.restore();
 // rubber limbs plus expressive flying scarf
 for(const [xx,s] of [[10,1],[34,-1]]){line(c,xx,48,xx+foot*s*.44,62+foot*s*.6,INK,8);oval(c,xx+foot*s*.7,68+foot*s*.4,16,9,'#ce785f',INK,4);oval(c,xx+foot*s*.7-5,67+foot*s*.4,7,3,'#ffe5ad',null)}
 curve(c,[7,25,6,42,2,56,13,57,29,67,47,55,41,27],body,INK,5);rounded(c,20,35,6,14,3,'#f9e9ce',INK,1);oval(c,24,46,2.6,2.6,'#f4bc74',null);
 curve(c,[7,37,-2,30,-13,31,-14,17],null,INK,8);glove(c,-15,17,-.25);
 curve(c,[39,38,52,28,53,16,64,25],null,INK,8);glove(c,63,25,.6);
 // wobbly hat and a little luminous bulb silhouette, not a cup character
 curve(c,[9,8,3,-22,13,-23,28,-20,48,-22,49,17,37,30,19,37,7,26,9,8],head,INK,5);
 oval(c,24,-19,24,11,'#de847d',INK,3);rounded(c,6,-36,36,14,6,'#44354d',INK,3);
 star(c,25,-43,10,'#f8dfa0',Math.sin(frames*.034)*.15);
 if(heroId===1){star(c,5,-26,8,'#ffaaa4',frames*.04);star(c,45,-24,8,'#ffdfab',frames*.04)}
 if(heroId===2){oval(c,-3,-24,15,8,'#93c089',INK,2,-.4);oval(c,43,-24,15,8,'#93c089',INK,2,.4)}
 if(heroId===3){rounded(c,10,-28,29,10,4,'#8580ab',INK,3);oval(c,14,-24,6,6,PAPER,INK,2);oval(c,38,-24,6,6,PAPER,INK,2)}
 if(heroId===4){oval(c,42,-31,12,8,'#a6dce3',INK,2);oval(c,2,-31,12,8,'#a6dce3',INK,2)}
 if(heroId===5){star(c,44,-28,11,'#ffd2a8',frames*.05)}
 // oval vintage eyes with independent pupils and blinking
 const blink=Math.sin(frames*.045+heroId)> .994?2:12;
 for(const ex of [18,34]){oval(c,ex,2,6.5,blink,'#fffbec',INK,2);oval(c,ex+2,3,3.1,Math.min(8,blink-1)||1,INK,null);oval(c,ex+1,-2,1.5,2,PAPER,null);}
 oval(c,13,19,6,3.4,'#df9a93',null);curve(c,[23,16,28,25,35,22,37,16],null,'#65404c',3.3);
 // a scarf traveling opposite direction, stretch while dashing
 if(run||dash>0){curve(c,[8,29,-7,25,-22,20,-32,29, -26,33,-10,33,8,35], '#ffdd9e',INK,2.3)}
 if(shield>0){c.save();c.globalAlpha=.38;oval(c,22,20,47,66,'#a8eff2','#fff5d3',5);c.restore()}
 if(flash>0)star(c,65,22,15,'#fff4bd',frames*.08);
 if(dash>0){c.save();c.globalAlpha=.45;for(let i=0;i<3;i++)oval(c,-17-i*13,30,21-i*4,13,'#ceece3',null);c.restore()}
 c.restore();
}
function mob(c,{x,y,frames=0,color='#c7a5a6',kind=0,hit=false}){const t=frames*.07+x*.02;c.save();c.translate(x,y+Math.sin(t)*2);
 // expressive jumping rubber-hose goons with unique small costumes
 oval(c,0,42,23,5,'#2c25304a',null);for(let s of [-1,1]){line(c,s*11,25,s*14+Math.sin(t+s)*4,37,INK,6);oval(c,s*15,38,10,5,kind%2?'#694c61':'#4e5873',INK,2)}
 oval(c,0,6,26,29,hit?'#fff8e2':color,INK,4.5);
 if(kind%3===0){rounded(c,-18,-27,36,9,4,'#654960',INK,3);rounded(c,-13,-48,26,27,3,'#3d304a',INK,3)}
 if(kind%3===1){for(let i=0;i<3;i++)oval(c,-18+i*18,-20,13,9,'#f4dbad',INK,2)}
 if(kind%3===2){star(c,0,-30,16,'#e6be93',t*.12)}
 for(const s of [-1,1]){line(c,s*25,5,s*34,19+Math.sin(t+s)*7,INK,5);glove(c,s*36,19+Math.sin(t+s)*7,s*.4)}
 for(const s of [-1,1]){oval(c,s*10,-1,7,11,'#fffae9',INK,2);oval(c,s*10+2,1,3,6,INK,null)}
 curve(c,[-10,15,0,23,4,24,13,14],null,'#805c6a',3);
 c.restore()}
function platform(c,x,y,w,h,frames=0){c.save();rounded(c,x,y,w,h,8,'#4b4258',INK,3.5);rounded(c,x+3,y+3,w-6,11,4,'#e9c18d',INK,1.5);for(let i=13;i<w-10;i+=24)line(c,x+i,y+18,x+i-6,y+23,'#90756d',1.5);for(let i=14;i<w-8;i+=40)oval(c,x+i,y+8,2,2,'#fff3ca',null);c.restore()}
function projectile(c,x,y,r,frames=0,kind=0){c.save();c.translate(x,y);c.rotate(frames*.09);for(let i=0;i<3;i++){c.globalAlpha=.14/(i+1);oval(c,-i*11,0,r+8+i*3,r*.6,'#ffe5af',null)}c.globalAlpha=1;star(c,0,0,r,'#f9de9c',frames*.1);oval(c,-3,-2,4,4,'#fffdf1',null);c.restore()}
function bossAura(c,{x=780,y=218,hp=100,phase=1,level=0,frames=0,W=960,H=540,attackWait=80}={}){
 c.save();const hue=palette[level%10],pulse=1+Math.sin(frames*.07)*.08;const grad=c.createRadialGradient(x,y,12,x,y,235);grad.addColorStop(0,hue[2]+'77');grad.addColorStop(.4,hue[1]+'38');grad.addColorStop(1,hue[1]+'00');c.fillStyle=grad;c.fillRect(x-245,y-245,490,490);
 for(let i=0;i<(phase===3?12:8);i++){const a=frames*.012+i*T/(phase===3?12:8),dist=120+(phase-1)*20;star(c,x+Math.cos(a)*dist,y+Math.sin(a)*dist*.75,5+i%3*2,hue[2],a)}
 // warning rings prior to the next volley, graphic and readable
 if(attackWait>0&&attackWait<27){c.globalAlpha=(27-attackWait)/60;c.strokeStyle='#fff2c3';c.lineWidth=4+(27-attackWait)*.05;c.beginPath();c.arc(x,y,125+Math.sin(frames*.3)*8,0,T);c.stroke();c.font='bold 18px Georgia';c.fillStyle='#fff0cb';c.textAlign='center';c.fillText('!',x-103,y-91);}
 c.restore()}
function film(c,{W=960,H=540,frames=0,quality=2}={}){c.save();c.globalAlpha=.11;const vig=c.createRadialGradient(W/2,H/2,100,W/2,H/2,650);vig.addColorStop(0,'#00000000');vig.addColorStop(1,'#231729');c.fillStyle=vig;c.fillRect(0,0,W,H);c.globalAlpha=.035;for(let y=0;y<H;y+=4){c.fillStyle='#2f2737';c.fillRect(0,y,W,1)}c.globalAlpha=.10;const tick=Math.floor(frames/4);for(let i=0;i<135;i++){const x=(i*151+tick*77)%W,y=(i*239+tick*43)%H;c.fillStyle=i%3?'#fff6e4':'#423441';c.fillRect(x,y,1,1+(i%4));}if(tick%89<2){c.globalAlpha=.11;c.fillStyle='#fff4d4';c.fillRect(0,0,W,H)}c.restore()}
window.PolyCinemaArt={stage,hero,mob,platform,projectile,bossAura,film,palette,star,flower};
})();
