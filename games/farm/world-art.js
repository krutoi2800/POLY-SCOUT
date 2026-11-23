/* Clover Hollow / original, hand-built canvas pixel environment. No external sprites or copyrighted assets. */
(() => {
'use strict';
class PixelValley {
  constructor(ctx,width,height,tile,mw,mh){
    this.ctx=ctx;this.W=width;this.H=height;this.T=tile;this.MW=mw;this.MH=mh;this.lastSeason=-1;
    this.layer=document.createElement('canvas');this.layer.width=mw*tile;this.layer.height=mh*tile;this.p=this.layer.getContext('2d');this.p.imageSmoothingEnabled=false;
  }
  h(x,y,z=0){let q=Math.imul(x+17,1664525)^Math.imul(y+43,1013904223)^Math.imul(z+13,374761393);q=Math.imul(q^(q>>>13),1274126177);return (q^(q>>>16))>>>0;}
  rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  ell(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);c.fill();}
  poly(c,pts,color){c.fillStyle=color;c.beginPath();c.moveTo(Math.round(pts[0][0]),Math.round(pts[0][1]));for(const q of pts.slice(1))c.lineTo(Math.round(q[0]),Math.round(q[1]));c.closePath();c.fill();}
  line(c,x,y,w,h,col){this.rect(c,x,y,w,h,col);}
  tile(c,x,y,s){const palette=[['#77ae63','#7cb96c','#83bc71','#7baf65'],['#67ac60','#71b768','#7cb966','#70af65'],['#b6ad6a','#bcae6d','#aaa46b','#c0af6b'],['#d7dee0','#d4dce0','#dbe3e4','#cfd8d9']][s], px=x*32,py=y*32,h=this.h(x,y);
    this.rect(c,px,py,32,32,palette[h%4]);
    for(let i=0;i<4;i++){const tx=2+this.h(x,i,y)%28,ty=2+this.h(y,i,x)%28;
      this.rect(c,px+tx,py+ty,2,3,s===3?'#f4faf7':s===2?'#d4bd78':'#669d5c');
      if(i===1&&h%5===0)this.rect(c,px+tx+3,py+ty+1,3,2,s===3?'#eef8f3':'#99cb7b');
    }
    if(s!==3&&h%9===0)this.flower(c,px+11,py+16,h%3);
    if(s!==3&&h%19===0)this.tuft(c,px+19,py+23);
    if(s===3&&h%7===0){this.rect(c,px+5,py+13,7,2,'#edf5f6');this.rect(c,px+20,py+7,4,2,'#f8ffff');}
  }
  tuft(c,x,y){this.rect(c,x,y,2,5,'#3f8d52');this.rect(c,x+4,y-2,2,7,'#499452');this.rect(c,x+7,y+2,2,3,'#498b4d');}
  flower(c,x,y,n=0){const ps=['#fbe3aa','#f8b8cb','#f7f2df','#e9b8f0'],color=ps[n%ps.length];this.rect(c,x,y-1,2,5,'#367d4f');this.rect(c,x-3,y-4,3,3,color);this.rect(c,x+2,y-4,3,3,color);this.rect(c,x-1,y-7,3,3,color);this.rect(c,x-1,y-2,3,3,'#f8d46c');}
  path(c,x,y,s){const X=x*32,Y=y*32,h=this.h(x,y,11);this.rect(c,X,Y,32,32,s===3?'#bbcccf':h%2?'#d7bd87':'#d2b27e');
    for(let j=0;j<7;j++){const q=this.h(x,y,j),dx=2+(q%27),dy=2+((q>>>7)%26);this.rect(c,X+dx,Y+dy,3+(q%3),2,(j%2?'#b49362':'#e3cc9b'));}
    if(h%4===0){this.rect(c,X+9,Y+7,6,4,'#bba275');this.rect(c,X+10,Y+7,5,1,'#e9d3a5');}
  }
  setPond(c,s){let water=[];for(let y=14;y<=22;y++)for(let x=1;x<=10;x++){
      const dx=(x-5.5)/5.15,dy=(y-18.15)/4.5,rough=((this.h(x,y,4)%100)/100-.5)*.10;
      if(dx*dx+dy*dy<.87+rough)water.push([x,y]);
    }
    const ks=new Set(water.map(([x,y])=>x+':'+y));
    for(const [x,y] of water){const X=x*32,Y=y*32,shore=![[x-1,y],[x+1,y],[x,y-1],[x,y+1]].every(([xx,yy])=>ks.has(xx+':'+yy));
      this.rect(c,X,Y,32,32,s===3?'#8bafba':'#ceb78a');this.rect(c,X+2,Y+2,28,28,s===3?'#8ac5d5':shore?'#5b9c9c':'#4b9db1');this.rect(c,X+4,Y+5,24,20,s===3?'#a5d8e1':shore?'#5aa7b4':'#69b8c3');
      if(this.h(x,y)%3===0){this.rect(c,X+6,Y+12,12,2,'#b8e4da');this.rect(c,X+15,Y+23,8,2,'#79cbd0');}
    }
    // layered lily pads, rushes, soft banks, little stones
    for(const [x,y] of [[2,16],[3,20],[7,15],[9,20]]){
      const X=x*32+this.h(x,y)%18,Y=y*32+this.h(y,x)%14;
      this.ell(c,X+6,Y+10,10,5,'#337f6a');this.ell(c,X+4,Y+8,7,3,'#73ad60');this.flower(c,X+2,Y+8,2);
    }
    for(const [x,y] of [[1.6,16],[2.5,21],[10.1,17],[9.5,22]]){const X=x*32,Y=y*32;for(let j=0;j<5;j++){this.rect(c,X+j*5,Y-(j%3)*6,2,17,'#557c46');this.rect(c,X+j*5+2,Y-7,3,6,'#b69560');}}
    for(const [x,y] of [[2,15],[8,14],[10,18],[3,22]]){const X=x*32,Y=y*32;this.ell(c,X+7,Y+15,12,6,'#9e9c80');this.ell(c,X+5,Y+12,8,3,'#d6c8a3');}
    // wooden fishing deck
    this.rect(c,9*32,18*32,82,38,'#694a36');this.rect(c,9*32+5,18*32+4,77,28,'#b68255');
    for(let j=0;j<6;j++){this.rect(c,9*32+6+j*12,18*32+5,2,26,'#d6a472');this.rect(c,9*32+2+j*12,18*32+16,5,2,'#80563a');}
    for(let j=0;j<3;j++)this.rect(c,9*32+3+j*34,18*32-6,6,46,'#624932');
  }
  shrub(c,x,y,s=0){const col=s===2?'#b78f64':'#367b50',lit=s===2?'#c5a77a':'#4fa75d';this.ell(c,x+15,y+20,20,7,'#365c4052');
    for(const [dx,dy,rx,ry] of [[4,8,10,11],[20,6,13,12],[12,1,12,13]]){this.ell(c,x+dx,y+dy+10,rx,ry,col);this.ell(c,x+dx-3,y+dy+7,rx*.68,ry*.62,lit);}
    for(let q=0;q<6;q++){const a=this.h(Math.round(x),q)%27,b=this.h(Math.round(y),q)%19;
      this.rect(c,x+a,y+b+2,3,2,s===2?'#e9c18b':'#8dc078');}
  }
  tree(c,x,y,s,season,index){const X=x*32,Y=y*32;const orange=season===2,winter=season===3;
    this.ell(c,X+17,Y+28,25,7,'#2b5e4240');this.rect(c,X+11,Y-12,12,51,'#654637');this.rect(c,X+17,Y-7,5,43,'#b7885e');this.rect(c,X+7,Y+4,20,5,'#825a42');this.rect(c,X+11,Y-7,8,5,'#b78962');
    const base=orange?'#a76847':winter?'#b4c7c0':'#2e7047',mid=orange?'#c58a43':winter?'#e0eae3':'#438950',high=orange?'#dfae60':winter?'#fbffef':'#65ac5a';
    for(const [dx,dy,w,h] of [[-11,-34,59,33],[-17,-20,65,29],[-2,-52,45,33],[2,-60,36,25]]){
      this.rect(c,X+dx+2,Y+dy+5,w,h,'#245b4355');this.rect(c,X+dx,Y+dy,w,h,base);
      this.rect(c,X+dx+4,Y+dy+3,w-9,Math.max(6,h*.45),mid);
    }
    for(let q=0;q<24;q++){const v=this.h(Math.round(x*10),q,index),xx=X-12+v%60,yy=Y-51+(v>>>6)%37;
      if((xx-X-13)**2/1800+(yy-Y+27)**2/900<1)this.rect(c,xx,yy,3+(v%3),2+(v%3),q%4===0?high:mid);
    }
    if(!winter){for(let i=0;i<4;i++){const v=this.h(index,i,9);this.rect(c,X-6+v%37,Y-42+(v>>>5)%26,4,4,orange?'#e9c374':'#f2cf8d');}}
    if(winter){this.rect(c,X-8,Y-48,52,4,'#f7ffff');this.rect(c,X+2,Y-58,33,5,'#fafefa');}
  }
  roofShingles(c,x,y,w,color1,color2){for(let r=0;r<4;r++)for(let i=0;i<Math.ceil(w/22);i++){
    const X=x+i*22+(r%2)*9,Y=y+r*11;if(X>x+w-8)continue;this.rect(c,X,Y,18,3,r%2?color1:color2);
    this.rect(c,X+3,Y+4,2,3,color2);
  }}
  house(c){const X=4*32,Y=3*32,ww=192;
    this.ell(c,X+94,Y+157,108,16,'#36593b46');
    // stone foundation with mortared blocks
    this.rect(c,X+10,Y+102,ww-16,54,'#837a62');
    for(let xx=X+12;xx<X+180;xx+=22)for(let yy=Y+111;yy<Y+154;yy+=15){this.rect(c,xx+(yy%3)*3,yy,19,2,'#b1a48a');}
    this.rect(c,X+18,Y+72,155,71,'#e2b677');this.rect(c,X+24,Y+78,143,61,'#f2d39a');
    for(let i=0;i<9;i++){this.rect(c,X+26+i*16,Y+81,2,56,'#e9c48b');this.rect(c,X+27+i*16,Y+89,2,3,'#f9e5b5');}
    this.rect(c,X+14,Y+59,165,14,'#a36d4f');this.rect(c,X+24,Y+63,155,7,'#d7976a');
    // layered, chunky red pitched roof and ridge trim
    this.poly(c,[[X-1,Y+65],[X+24,Y+12],[X+110,Y-15],[X+181,Y+18],[X+193,Y+66]],'#693d3c');
    this.poly(c,[[X+5,Y+59],[X+32,Y+14],[X+111,Y-8],[X+177,Y+22],[X+187,Y+61]],'#b65349');
    this.poly(c,[[X+23,Y+25],[X+108,Y-3],[X+171,Y+23],[X+164,Y+31],[X+105,Y+8],[X+36,Y+34]],'#dc7961');
    this.roofShingles(c,X+16,Y+23,161,'#e08b68','#944844');
    for(let i=0;i<9;i++){this.rect(c,X+9+i*20,Y+58-(i%2)*3,17,6,'#8d443e');}
    // chimney
    this.rect(c,X+142,Y-18,25,36,'#8a5044');this.rect(c,X+147,Y-13,15,28,'#bb7461');this.rect(c,X+138,Y-20,31,6,'#5a4748');
    for(let y=Y-9;y<Y+11;y+=9)this.rect(c,X+147,Y-9+(y-(Y-9)),13,2,'#df9a71');
    // door, handle and porch
    this.rect(c,X+73,Y+89,38,55,'#79503e');this.rect(c,X+79,Y+95,26,49,'#a56e4b');
    this.rect(c,X+82,Y+103,19,12,'#714f44');this.rect(c,X+84,Y+105,15,8,'#83bdb9');this.rect(c,X+102,Y+127,3,4,'#fbe09b');
    this.rect(c,X+63,Y+143,62,9,'#aa7755');this.rect(c,X+57,Y+152,76,5,'#e1b477');
    // windows: blue glass, mullions, little flowerbox
    for(const xx of [X+31,X+132]){
      this.rect(c,xx-5,Y+88,35,36,'#986844');this.rect(c,xx,Y+92,25,27,'#e7e7bd');
      this.rect(c,xx+3,Y+95,19,21,'#72b4b6');this.rect(c,xx+11,Y+95,3,21,'#d5f2da');this.rect(c,xx+3,Y+104,19,3,'#f8e7bd');
      this.rect(c,xx-6,Y+121,38,7,'#987347');this.rect(c,xx-2,Y+120,31,6,'#b08452');
      for(let p=0;p<4;p++)this.flower(c,xx+p*7-1,Y+120,p%2);
    }
    // hanging wooden sign with custom name
    this.rect(c,X+48,Y+57,95,19,'#794d38');this.rect(c,X+52,Y+60,87,13,'#edc788');c.fillStyle='#73553e';c.font='bold 10px Georgia,serif';c.textAlign='center';c.fillText('CLOVER HOME',X+95,Y+70);
    // planted pots
    for(const xx of [X+15,X+159]){this.rect(c,xx,Y+129,16,15,'#ba7150');this.rect(c,xx+2,Y+131,12,11,'#d28e5c');this.tuft(c,xx+3,Y+129);this.flower(c,xx+9,Y+128,1);}
  }
  barn(c){const X=26*32,Y=3*32;
    this.ell(c,X+96,Y+158,110,17,'#375d3d48');this.rect(c,X+15,Y+68,168,87,'#b8845f');
    for(let i=0;i<12;i++)this.rect(c,X+18+i*14,Y+72,2,77,'#e0ab77');
    this.rect(c,X+8,Y+59,181,13,'#675746');this.poly(c,[[X,Y+61],[X+36,Y+14],[X+106,Y-5],[X+167,Y+19],[X+195,Y+62]],'#42594f');
    this.poly(c,[[X+6,Y+55],[X+43,Y+20],[X+108,Y+3],[X+161,Y+25],[X+189,Y+57]],'#75886c');
    this.roofShingles(c,X+22,Y+20,160,'#91a184','#475f5a');
    this.rect(c,X+79,Y+88,61,66,'#604f45');this.rect(c,X+85,Y+93,49,61,'#937657');
    this.rect(c,X+108,Y+93,4,61,'#594c3e');this.rect(c,X+84,Y+117,50,5,'#5d5143');
    this.rect(c,X+80,Y+90,58,6,'#c29e6b');this.rect(c,X+104,Y+40,34,28,'#d5b782');
    this.rect(c,X+109,Y+44,24,18,'#729d96');this.rect(c,X+120,Y+44,3,18,'#eef4cf');
    this.rect(c,X+31,Y+83,28,29,'#61594b');this.rect(c,X+35,Y+86,21,22,'#84b0a4');
    // haystack and watering trough
    this.rect(c,X+1,Y+133,37,20,'#d7b76e');this.rect(c,X+6,Y+128,27,7,'#e8ce86');this.rect(c,X+25,Y+135,4,11,'#ac925b');
    this.rect(c,X+155,Y+135,35,16,'#647f76');this.rect(c,X+159,Y+132,26,5,'#a8caca');
    this.rect(c,X+38,Y+73,52,15,'#6d5944');this.rect(c,X+41,Y+76,46,10,'#cfbd91');
    c.fillStyle='#584c40';c.textAlign='center';c.font='bold 10px Georgia,serif';c.fillText('MEADOW BARN',X+64,Y+85);
  }
  greenhouse(c){const X=26*32,Y=18*32;
    this.ell(c,X+79,Y+117,95,12,'#3c624548');this.rect(c,X+5,Y+42,155,73,'#6b7d62');
    this.poly(c,[[X+4,Y+45],[X+46,Y+1],[X+121,Y+1],[X+162,Y+45]],'#526c64');
    this.poly(c,[[X+13,Y+43],[X+52,Y+7],[X+115,Y+7],[X+153,Y+43]],'#aad3c4');
    this.rect(c,X+13,Y+45,140,67,'#94c6b8');for(let i=0;i<7;i++){this.rect(c,X+17+i*22,Y+47,4,63,'#e5e2af');this.rect(c,X+20+i*22,Y+57,2,52,'#779d83');}
    this.rect(c,X+12,Y+75,144,5,'#e4e7bf');this.rect(c,X+81,Y+44,4,69,'#f8eed0');this.rect(c,X+63,Y+73,41,42,'#577d6e');
    this.rect(c,X+68,Y+76,31,36,'#a0ccba');this.rect(c,X+84,Y+77,3,36,'#e2e4c1');this.rect(c,X+94,Y+93,3,3,'#f6e7ad');
    for(let i=0;i<6;i++)this.tuft(c,X+24+i*20,Y+103);
  }
  well(c){const X=11*32,Y=3*32;this.ell(c,X+15,Y+25,28,9,'#39643d46');this.rect(c,X-9,Y+6,47,21,'#786a59');this.rect(c,X-4,Y+7,36,16,'#a5a590');
    this.rect(c,X+2,Y+11,25,12,'#506c73');this.rect(c,X-14,Y-19,6,38,'#7e6048');this.rect(c,X+35,Y-19,6,38,'#7e6048');
    this.poly(c,[[X-19,Y-19],[X+13,Y-34],[X+45,Y-19]],'#a9524c');this.rect(c,X-18,Y-20,63,6,'#dd8f66');
    this.rect(c,X+11,Y-13,15,4,'#876846');this.rect(c,X+18,Y-16,3,15,'#b69665');
  }
  scarecrow(c){const X=22*32,Y=9*32;this.ell(c,X,Y+3,24,8,'#355a3b44');this.rect(c,X-3,Y-36,6,41,'#6c5945');this.rect(c,X-21,Y-31,43,5,'#a7784e');
    this.rect(c,X-14,Y-30,30,16,'#cc8055');this.rect(c,X-9,Y-53,19,20,'#ddc792');this.rect(c,X-14,Y-60,29,7,'#976649');this.rect(c,X-9,Y-67,19,10,'#be9554');this.rect(c,X-4,Y-47,3,3,'#493b32');this.rect(c,X+5,Y-47,3,3,'#493b32');}
  decor(c,s){
    // a living tree-lined lane and thick meadow borders
    const treePos=[[1,3,1],[2,7,2],[32,2,3],[33,9,4],[31,17,5],[3,23,6],[27,23,7],[1,11,8],[13,23,9],[28,15,10],[18,1,11],[22,3,12],[34,22,13],[4,1,14],[0,19,15],[35,14,16],[-1,4,17],[36,7,18]];
    for(const [x,y,n] of treePos)this.tree(c,x,y,1,s,n);
    // borders with bushes and pink blossoms
    for(let i=0;i<21;i++){const x=1+(i*11)%34,y=1+Math.round((i*13)%23);if((x>11&&x<26&&y>9&&y<19)||(x>=3&&x<11&&y>2&&y<9)||(x>25&&x<33&&y>2&&y<9)||(x<11&&y>14&&y<23)||(x>25&&y>17))continue;
      this.shrub(c,x*32,y*32,s);
    }
    // orchard, preserves, herb garden and rustic decor
    for(let i=0;i<5;i++){const X=(15+i*2)*32,Y=22*32;this.rect(c,X+1,Y+8,30,9,'#a57b50');this.rect(c,X+3,Y+1,27,11,'#c39b64');this.rect(c,X+4,Y+6,20,2,'#f3d392');this.tuft(c,X+12,Y+2);}
    for(let i=0;i<4;i++){const X=(11+i)*32,Y=19*32;this.rect(c,X+5,Y+8,23,20,'#986d4a');this.rect(c,X+4,Y+7,25,5,'#d8aa73');this.rect(c,X+11,Y+3,10,5,'#96704e');}
    // campfire picnic corner
    this.rect(c,14*32,2*32+12,94,29,'#a57e54');this.rect(c,14*32+4,2*32+14,86,7,'#dbb381');
    for(let i=0;i<4;i++)this.rect(c,14*32+11+i*24,2*32+13,3,25,'#7e5f45');
    this.rect(c,13*32+4,3*32+15,24,25,'#8a674a');this.rect(c,13*32+6,3*32+19,20,4,'#ddaf76');
    // farm namepost / bee house
    this.rect(c,23*32+13,7*32+4,6,37,'#8c6146');this.rect(c,23*32-7,7*32-5,47,21,'#76553f');this.rect(c,23*32-3,7*32-2,38,14,'#efcea0');
    c.font='bold 9px Georgia';c.fillStyle='#75533e';c.textAlign='center';c.fillText('YOUR FARM',23*32+16,7*32+8);
    for(let j=0;j<3;j++){const X=34*32-16,Y=(10+j*2)*32;this.rect(c,X,Y,26,31,'#c7a86a');this.rect(c,X+4,Y+4,19,20,'#f1ce86');this.rect(c,X+3,Y-4,21,8,'#9c744f');this.rect(c,X+11,Y+17,7,5,'#775946');}
    // scattered pebbles, clover, flowers, mushrooms outside paths
    for(let j=0;j<260;j++){
      const x=8+(this.h(j,1)%((this.MW*32)-18)),y=8+(this.h(j,2)%((this.MH*32)-18)),gx=x/32,gy=y/32;
      if((gx>3&&gx<10&&gy>3&&gy<8)||(gx>26&&gx<32&&gy>3&&gy<9)||(gx>12&&gx<24&&gy>10&&gy<18)||(gx<10&&gy>15&&gy<23))continue;
      if(j%9===0&&s!==3)this.flower(c,x,y,j);else if(j%7===0)this.tuft(c,x,y);else if(j%4===0)this.rect(c,x,y,4,2,s===3?'#f9ffff':'#d4c292');
    }
  }
  easternValley(c,season){
    const winter=season===3,autumn=season===2;
    // A new river beside the east garden, with lilypads and stones.
    for(let y=12;y<=20;y++)for(let x=42;x<=54;x++){
      const dx=(x-48)/6.4,dy=(y-16)/4.5,noise=(this.h(x,y,44)%10)/100;
      if(dx*dx+dy*dy>.91+noise)continue;
      const X=x*32,Y=y*32;
      this.rect(c,X,Y,32,32,'#c2b68c');this.rect(c,X+2,Y+2,29,28,winter?'#a2c1c8':'#5faba9');
      this.rect(c,X+5,Y+4,24,24,winter?'#bed9dc':(this.h(x,y)%2?'#6ac0bd':'#68b9c9'));
      if(this.h(x,y)%3===0)this.rect(c,X+10,Y+13,15,2,'#c0ebda');
    }
    // Wooden footbridge across the lake at its southern shore.
    this.rect(c,46*32,19*32-2,4*32,31,'#70523d');
    this.rect(c,46*32+5,19*32+2,4*32-10,24,'#bf9060');
    for(let x=0;x<10;x++){const X=46*32+x*13;this.rect(c,X+3,19*32+2,2,25,'#946e4a');}
    for(let x=0;x<2;x++)this.rect(c,46*32+6+x*126,19*32-13,6,44,'#76563f');
    // A flowering orchard with distinct apples, pears and peaches.
    for(let j=0;j<14;j++){
      const tx=43+(j%7)*2,ty=5+Math.floor(j/7)*3;
      const X=tx*32,Y=ty*32;
      this.ell(c,X+18,Y+28,26,7,'#345b4050');this.rect(c,X+11,Y-12,12,50,'#765840');this.rect(c,X+15,Y-12,4,46,'#ac8057');
      const base=winter?'#b8cecd':autumn?'#bc834e':'#3b814f';
      for(const [dx,dy,ww,hh] of [[-15,-37,52,32],[-5,-55,41,26],[-17,-24,56,20]]){
        this.rect(c,X+dx,Y+dy,ww,hh,base);this.rect(c,X+dx+4,Y+dy+3,ww-10,7,winter?'#e5eee6':autumn?'#d9a568':'#66a86b');
      }
      if(!winter)for(let q=0;q<5;q++){
        const x=X-10+this.h(j,q)%45,y=Y-42+(this.h(q,j)%25);
        this.rect(c,x,y,6,6,j%3===0?'#d6585c':j%3===1?'#e5bd78':'#f2ad88');
        this.rect(c,x+1,y,2,2,'#fae6be');
      }
    }
    // A windmill / bakery in the new meadow.
    const X=37*32,Y=3*32;
    this.ell(c,X+79,Y+142,96,16,'#40624344');
    this.rect(c,X+21,Y+43,109,95,'#c39a73');
    for(let i=0;i<9;i++)this.rect(c,X+25+i*12,Y+48,2,87,'#e6bc85');
    this.poly(c,[[X+13,Y+48],[X+76,Y-24],[X+141,Y+48]],'#855950');
    this.poly(c,[[X+24,Y+43],[X+75,Y-15],[X+128,Y+43]],'#b65e59');
    this.rect(c,X+63,Y+92,27,46,'#705345');this.rect(c,X+69,Y+98,16,40,'#9a7356');
    this.rect(c,X+39,Y+59,20,27,'#e8ce9e');this.rect(c,X+43,Y+63,12,19,'#7eb1ab');
    const cx=X+75,cy=Y+32;
    this.ell(c,cx,cy,14,14,'#dbc793');
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2;const ax=Math.cos(a),ay=Math.sin(a);
      this.poly(c,[[cx+ax*12-ay*5,cy+ay*12+ax*5],[cx+ax*77-ay*14,cy+ay*77+ax*14],[cx+ax*77+ay*14,cy+ay*77-ax*14],[cx+ax*12+ay*5,cy+ay*12-ax*5]],'#f1d9a4');
      for(let k=22;k<68;k+=10)this.rect(c,cx+ax*k-3,cy+ay*k-2,6,4,'#a87956');
    }
    this.ell(c,cx,cy,7,7,'#98694e');
    // Mountain cabin and mine with a stone mouth.
    const A=54*32,B=3*32;
    this.rect(c,A,B+24,182,111,'#83897f');
    for(let i=0;i<20;i++){
      const q=this.h(i,12),xx=A+(q%180),yy=B+20+((q>>>5)%112);
      this.rect(c,xx,yy,19,7,i%2?'#a3a99b':'#6f8b82');
    }
    this.poly(c,[[A-15,B+37],[A+85,B-38],[A+203,B+41]],'#6b7974');
    this.poly(c,[[A+10,B+33],[A+85,B-24],[A+181,B+35]],'#c3d5d1');
    this.ell(c,A+83,B+118,35,53,'#444e53');
    this.ell(c,A+83,B+127,21,42,'#1e363a');
    this.rect(c,A+63,B+73,43,6,'#a58c68');this.rect(c,A+58,B+74,8,58,'#8d745a');this.rect(c,A+108,B+74,8,58,'#8d745a');
    this.rect(c,A+60,B+40,49,24,'#846545');this.rect(c,A+65,B+45,39,14,'#e7cb93');
    c.fillStyle='#6a5141';c.textAlign='center';c.font='bold 10px Georgia,serif';c.fillText('ПЕЩЕРА',A+84,B+57);
    // Little farmhouse in the south woods.
    const a=15*32,b=33*32;
    this.rect(c,a,b+56,154,89,'#b78b68');this.poly(c,[[a-13,b+65],[a+74,b-3],[a+168,b+65]],'#81564b');
    this.poly(c,[[a,b+57],[a+76,b+8],[a+155,b+57]],'#a96655');
    this.rect(c,a+58,b+102,36,43,'#744e39');
    for(const q of [23,116]){this.rect(c,a+q,b+81,26,26,'#ead2a3');this.rect(c,a+q+3,b+85,20,17,'#7ebcb6');}
    this.rect(c,a+7,b+127,39,15,'#a6bd7e');
    // Hills, trail and trees at the new southern and eastern borders.
    for(let j=0;j<75;j++){
      const xx=36+(this.h(j,53)%27),yy=22+(this.h(35,j)%21),inPlot=xx>=39&&xx<=56&&yy>=21&&yy<=35;
      if(inPlot||(xx>=42&&xx<54&&yy<=27)||(xx>=51&&yy<=36)||(xx>13&&xx<24&&yy>30&&yy<39))continue;
      if(j%5===0)this.shrub(c,xx*32,yy*32,season);
      else this.tree(c,xx,yy,1,season,j+90);
    }
    for(let j=0;j<48;j++){
      const xx=1+(this.h(j,18)%33),yy=27+(this.h(19,j)%16);
      if(xx>13&&xx<23&&yy>=32&&yy<41)continue;
      if(j%3===0)this.shrub(c,xx*32,yy*32,season);else this.tree(c,xx,yy,1,season,j+167);
    }
    // market at east plot
    for(let j=0;j<3;j++){
      const ax=(38+j*5)*32,by=37*32;
      this.rect(c,ax,by+17,84,37,'#cba16b');
      this.poly(c,[[ax-3,by+19],[ax+15,by-11],[ax+70,by-11],[ax+86,by+19]],j%2?'#c87566':'#e9cf95');
      this.rect(c,ax+11,by+30,61,10,'#875d41');
      for(let q=0;q<4;q++)this.ell(c,ax+16+q*15,by+28,6,5,['#d86559','#e5c46e','#6a9d61'][q%3]);
    }
  }
  highlands(c,season){
    const snow=season===3,autumn=season===2;
    // Eastern river, winding into the distant summer forest.
    for(let y=25;y<=39;y++)for(let x=69;x<=78;x++){
      const dx=(x-(73+Math.sin(y*.35)*1.5))/4.1;if(Math.abs(dx)>1.05)continue;
      const X=x*32,Y=y*32;this.rect(c,X,Y,32,32,'#c6bb95');this.rect(c,X+3,Y+3,26,27,snow?'#a9cbd2':y%3?'#67b1b9':'#68bdc2');
      if((x+y)%5===0)this.rect(c,X+7,Y+17,13,2,'#d3eee1');
    }
    // A wooden bridge and lilac blossoms by the river.
    this.rect(c,68*32,32*32,9*32,39,'#795c48');this.rect(c,68*32+5,32*32+4,9*32-10,29,'#bf955e');
    for(let i=0;i<20;i++)this.rect(c,68*32+6+i*13,32*32+5,3,28,'#98724c');
    const X=66*32,Y=4*32;
    this.ell(c,X+100,Y+157,110,15,'#385c4345');this.rect(c,X+22,Y+44,145,108,'#b99470');
    this.poly(c,[[X+1,Y+48],[X+92,Y-28],[X+190,Y+48]],'#8b5f58');
    this.poly(c,[[X+20,Y+43],[X+93,Y-12],[X+170,Y+43]],'#ce8d78');
    this.rect(c,X+72,Y+96,37,55,'#795947');this.rect(c,X+80,Y+104,22,45,'#c5a074');
    this.rect(c,X+31,Y+81,28,28,'#d9e8ce');this.rect(c,X+35,Y+86,19,19,'#89bcba');
    this.rect(c,X+131,Y+81,25,28,'#d9e8ce');this.rect(c,X+135,Y+86,16,19,'#89bcba');
    for(let j=0;j<68;j++){let x=62+(this.h(j,70)%18),y=1+(this.h(j,71)%54);
       if((x>=63&&x<=77&&y>=13&&y<=26)||(x>=61&&x<=76&&y>=37&&y<=52)||(x>=65&&x<=73&&y<=10))continue;
       if(j%4===0)this.shrub(c,x*32,y*32,season);else this.tree(c,x,y,1,season,j+290);
    }
    // Tiny campfire at the southern crossing and flowering hedges.
    for(let j=0;j<14;j++)this.flower(c,(60+j)*32+9,36*32+13,j);
    this.rect(c,58*32,43*32,45,15,'#87684a');this.rect(c,58*32+6,43*32-11,32,13,'#d59c69');
  }
  farLands(c,s){
    const winter=s===3,autumn=s===2;
    // The distant highlands and tree-topped ridge, not a stretched empty lawn.
    for(let y=0;y<34;y++)for(let x=81;x<120;x++){
      if((x+y)%4===0&&x>101&&y<26){this.rect(c,x*32,y*32,32,32,winter?'#c9d7d2':autumn?'#a0a16e':'#85ac78');}
    }
    // Linked roads, wilderness pass and boardwalks.
    for(let x=78;x<118;x++)for(let y=28;y<=29;y++)this.path(c,x,y,s);
    for(let y=11;y<75;y++)for(let x=80;x<=81;x++)this.path(c,x,y,s);
    for(let x=60;x<=88;x++)for(let y=65;y<=66;y++)this.path(c,x,y,s);
    for(let x=81;x<110;x++)for(let y=47;y<=48;y++)this.path(c,x,y,s);
    for(let x=91;x<114;x++)for(let y=61;y<=62;y++)this.path(c,x,y,s);
    // Blue pond in the north and an extended south coast.
    for(let y=3;y<17;y++)for(let x=83;x<99;x++){
      const dx=(x-90)/8.4,dy=(y-10)/6.2;if(dx*dx+dy*dy>.93)continue;
      this.rect(c,x*32,y*32,32,32,winter?'#cce0da':'#8dbaa7');
      this.rect(c,x*32+3,y*32+3,27,26,winter?'#a6c7d2':(x+y)%3?'#5eafb9':'#6fc1b6');
      if((x+y)%5===0)this.rect(c,x*32+11,y*32+9,16,2,'#c8e9dd');
    }
    for(let y=58;y<88;y++)for(let x=95;x<120;x++){
      const dx=(x-108)/13.5,dy=(y-73)/17.3;
      if(dx*dx+dy*dy>.98){this.rect(c,x*32,y*32,32,32,winter?'#a4c9d0':'#72b7be');if((x+y)%4===0)this.rect(c,x*32+6,y*32+16,17,2,'#d8ebe5');}
      else if(dx*dx+dy*dy>.72){this.rect(c,x*32,y*32,32,32,'#d9c997');}
    }
    // Highland rocks beside the orchard and wooded hills.
    for(let i=0;i<130;i++){
      const x=82+(this.h(i,14)%37),y=1+(this.h(i,21)%32);
      if((x>=83&&x<=100&&y>=10&&y<=26)||(x>=101&&y>=9&&y<=29)||((x-90)**2/90+(y-10)**2/70<2))continue;
      if(i%6===0){this.ell(c,x*32+17,y*32+18,20,11,'#869485');this.ell(c,x*32+13,y*32+12,17,9,'#b8c0a4');}
      else if(i%2===0)this.shrub(c,x*32,y*32,s);
      else this.tree(c,x,y,1,s,400+i);
    }
    // Paddock fencing and a friendly red-roofed animal barn.
    for(let x=84;x<=111;x++){for(const y of [30,50]){this.rect(c,x*32+12,y*32+6,7,31,'#d6b182');this.rect(c,x*32,y*32+18,32,4,'#b18758');}}
    for(let y=31;y<50;y++){for(const x of [83,112]){this.rect(c,x*32+12,y*32+4,7,31,'#d6b182');this.rect(c,x*32,y*32+19,32,4,'#b18758');}}
    const X=88*32,Y=27*32;
    this.ell(c,X+90,Y+157,121,14,'#345c4844');this.rect(c,X+15,Y+65,186,98,'#c48c66');
    for(let i=0;i<13;i++)this.rect(c,X+19+i*14,Y+71,3,88,'#e6b27b');
    this.poly(c,[[X-3,Y+65],[X+40,Y+7],[X+102,Y-15],[X+169,Y+10],[X+220,Y+65]],'#875449');
    this.poly(c,[[X+11,Y+59],[X+43,Y+16],[X+103,Y-8],[X+168,Y+19],[X+202,Y+59]],'#b65c56');
    for(let i=0;i<8;i++)this.rect(c,X+23+i*23,Y+47-(i%2)*7,16,3,'#e08b6c');
    this.rect(c,X+73,Y+94,67,68,'#6d5342');this.rect(c,X+80,Y+103,53,59,'#92735b');
    this.rect(c,X+106,Y+101,4,59,'#5e4e43');this.rect(c,X+76,Y+127,61,5,'#4f4840');
    this.rect(c,X+153,Y+88,32,30,'#f4dcb7');this.rect(c,X+158,Y+93,22,21,'#81babb');
    // Hay bales, troughs, pumpkin baskets, berry hedges.
    for(let j=0;j<5;j++){const x=(86+j*5)*32,y=46*32;this.rect(c,x,y,42,23,'#c6a063');this.rect(c,x+5,y-7,32,12,'#e4ca7c');this.rect(c,x+10,y+10,4,12,'#8d7651');}
    for(let i=0;i<25;i++){const x=87+this.h(i,91)%22,y=32+this.h(91,i)%15;if((x>88&&x<97&&y<35))continue;
      if(i%4===0)this.flower(c,x*32+6,y*32+10,i);else this.tuft(c,x*32+10,y*32+12);}
    // Extensive southern flower valley and picnic spot.
    for(let j=0;j<120;j++){
      const x=16+(this.h(j,69)%67),y=57+(this.h(j,76)%30);
      if((x>=43&&x<=67&&y>=60&&y<=80)||(x>=69&&x<=85&&y>=61&&y<=79))continue;
      if(j%5===0)this.tree(c,x,y,1,s,700+j);else if(j%4===0)this.shrub(c,x*32,y*32,s);else if(!winter)this.flower(c,x*32+9,y*32+13,j);
    }
    // Massive mill and greenhouse by the southern fields.
    const M=39*32,N=59*32;
    this.ell(c,M+80,N+120,110,14,'#355b404c');this.rect(c,M+24,N+37,130,94,'#d7b483');
    this.poly(c,[[M+8,N+46],[M+78,N-25],[M+166,N+46]],'#9c6558');
    this.poly(c,[[M+21,N+42],[M+80,N-16],[M+154,N+42]],'#c57f6c');
    this.rect(c,M+67,N+82,42,50,'#795c4b');this.rect(c,M+76,N+90,25,42,'#ac7c5c');
    for(const x of [M+36,M+125]){this.rect(c,x,N+61,23,29,'#e8ebc9');this.rect(c,x+4,N+65,15,20,'#74b4b1');}
    // Distant ranch cabin, wood fences and signs.
    const K=71*32,L=69*32;this.rect(c,K,L+28,164,92,'#baa180');this.poly(c,[[K-8,L+38],[K+73,L-22],[K+177,L+38]],'#657a60');
    this.poly(c,[[K,L+29],[K+80,L-15],[K+165,L+29]],'#88a58a');this.rect(c,K+70,L+75,38,45,'#765a4c');
    this.rect(c,85*32,64*32,90,28,'#876146');this.rect(c,85*32+6,64*32+5,79,18,'#e6c88a');
    c.font='bold 15px Georgia';c.fillStyle='#795b45';c.textAlign='center';c.fillText('К О  М О Р Ю',85*32+45,64*32+21);
    // Island grove with ornamental trees; unlocked planting happens above it.
    for(let i=0;i<48;i++){
      const x=100+(this.h(i,203)%19),y=62+(this.h(203,i)%24);
      if(x>=99&&x<=118&&y>=64&&y<=81)continue;
      if(i%3===0)this.shrub(c,x*32,y*32,s);else this.tree(c,x,y,1,s,1000+i);
    }
  }
  newEast(c,s){
    const R=(x,y,w,h,col)=>this.rect(c,x,y,w,h,col),E=(x,y,rx,ry,col)=>this.ell(c,x,y,rx,ry,col);
    // East meadow paved lanes and new cooperative district (not a flat empty map).
    for(let x=120;x<145;x++)for(let y=35;y<=36;y++)this.path(c,x,y,s);
    for(let y=17;y<94;y++)for(let x=123;x<=124;x++)this.path(c,x,y,s);
    for(let x=74;x<126;x++)for(let y=91;y<=92;y++)this.path(c,x,y,s);
    for(let x=124;x<146;x++)for(let y=66;y<=67;y++)this.path(c,x,y,s);
    for(let x=103;x<127;x++)for(let y=107;y<=108;y++)this.path(c,x,y,s);
    // Garage, striped tin roof, open bay and yellow utility tractor.
    const X=128*32,Y=12*32;E(X+110,Y+172,100,19,'#425f4757');R(X+12,Y+68,200,103,'#9c9478');R(X+15,Y+73,194,95,'#d8c29a');this.poly(c,[[X-4,Y+75],[X+106,Y-8],[X+226,Y+75]],'#7b8a7b');this.poly(c,[[X+5,Y+67],[X+105,Y+1],[X+216,Y+67]],'#a8afa1');R(X+36,Y+103,108,68,'#596767');R(X+45,Y+113,90,58,'#a1adb0');R(X+51,Y+136,79,6,'#eef1df');R(X+160,Y+103,28,38,'#c2e2d5');R(X+166,Y+109,17,26,'#78adb2');
    c.font='bold 19px Georgia';c.textAlign='center';c.fillStyle='#fff2c8';c.fillText('Г А Р А Ж',X+112,Y+83);
    // Industrial hall, storage barrels, smokestacks and entrance.
    const A=124*32,B=38*32;E(A+122,B+200,122,19,'#49684454');R(A+8,B+57,248,137,'#c2a48a');R(A+17,B+69,231,118,'#edd0a4');this.poly(c,[[A-4,B+61],[A+80,B+4],[A+188,B+13],[A+265,B+61]],'#a47364');R(A+172,B-41,31,65,'#86685c');R(A+177,B-39,22,59,'#c7a88f');R(A+29,B+96,56,48,'#87bbc0');R(A+37,B+101,41,36,'#d6e5da');R(A+105,B+105,73,88,'#765949');R(A+119,B+112,48,80,'#bd9777');R(A+194,B+101,38,47,'#97bec3');
    for(let i=0;i<5;i++){const xx=A+19+i*46;R(xx,B+177,37,29,'#987958');R(xx+3,B+178,31,7,'#dfb77d');}c.font='bold 16px Georgia';c.fillStyle='#6a5245';c.fillText('КООПЕРАТИВ',A+126,B+83);
    // Orchard and meadow transitions around far fields.
    for(let i=0;i<135;i++){const x=120+(this.h(i,338)%27),y=3+(this.h(338,i)%106);if((x>=126&&x<=137&&y>=11&&y<=25)||(x>=123&&x<=135&&y>=37&&y<=47)||(x>=125&&x<=143&&y>=73&&y<=89))continue;if(i%4===0)this.tree(c,x,y,1,s,3000+i);else if(i%3===0)this.shrub(c,x*32,y*32,s);else if(s!==3)this.flower(c,x*32+13,y*32+16,i);}
    // Woodland river to the southern cooperative fields.
    for(let y=77;y<this.MH;y++)for(let x=127;x<=132;x++){const a=Math.sin(y*.28)*1.7;if(Math.abs(x-(129+a))>2.1)continue;R(x*32,y*32,32,32,'#baaa80');R(x*32+3,y*32+4,26,26,s===3?'#a5cbd0':'#70bcc0');}
    for(let i=0;i<8;i++){const xx=(108+i*4)*32,yy=68*32;R(xx,yy+13,90,21,'#ccb184');R(xx,yy+17,90,5,'#a18a5e');}
    // A tiny market stall near the eastern road.
    const C=137*32,D=57*32;R(C,D+34,146,57,'#e6bd87');this.poly(c,[[C-8,D+37],[C+77,D-5],[C+156,D+37]],'#cb7c70');for(let i=0;i<6;i++)R(C+10+i*22,D+13,15,18,i%2?'#e6e1bf':'#e8a596');R(C+17,D+60,50,17,'#78a35e');R(C+78,D+62,46,16,'#ca985a');
  }
  makeLayer(season){const c=this.p;const W=this.MW*32,H=this.MH*32;c.clearRect(0,0,W,H);
    for(let y=0;y<this.MH;y++)for(let x=0;x<this.MW;x++)this.tile(c,x,y,season);
    const walk=new Set();const add=(x,y)=>walk.add(x+','+y);
    for(let x=6;x<=30;x++)for(let y=8;y<=9;y++)add(x,y);
    for(let y=8;y<=24;y++)for(let x=10;x<=11;x++)add(x,y);
    for(let x=10;x<=27;x++)for(let y=19;y<=20;y++)add(x,y);
    for(let x=24;x<=27;x++)for(let y=9;y<=20;y++)add(x,y);
    for(let y=4;y<=10;y++)for(let x=11;x<=12;x++)add(x,y);
    // New trails to orchard, northern mine, second field and southern cottage.
    for(let x=31;x<=60;x++)for(let y=19;y<=20;y++)add(x,y);
    for(let x=34;x<=35;x++)for(let y=8;y<=38;y++)add(x,y);
    for(let x=34;x<=60;x++)for(let y=35;y<=36;y++)add(x,y);
    for(let x=40;x<=41;x++)for(let y=6;y<=32;y++)add(x,y);
    for(let x=38;x<=58;x++)for(let y=9;y<=10;y++)add(x,y);
    for(let x=10;x<=35;x++)for(let y=27;y<=28;y++)add(x,y);
    for(let y=27;y<=35;y++)for(let x=19;x<=20;x++)add(x,y);
    for(let x=61;x<=78;x++)for(let y=11;y<=12;y++)add(x,y);
    for(let y=10;y<=52;y++)for(let x=59;x<=60;x++)add(x,y);
    for(let x=37;x<=77;x++)for(let y=35;y<=36;y++)add(x,y);
    for(let y=38;y<=52;y++)for(let x=39;x<=40;x++)add(x,y);
    for(const p of walk){const [x,y]=p.split(',').map(Number);this.path(c,x,y,season);}
    this.setPond(c,season);
    this.decor(c,season);
    this.house(c);this.barn(c);this.greenhouse(c);this.well(c);this.scarecrow(c);this.easternValley(c,season);this.highlands(c,season);this.farLands(c,season);this.newEast(c,season);
    this.lastSeason=season;
  }
  background(cam,season,tick){if(season!==this.lastSeason)this.makeLayer(season);
    const left=Math.max(0,Math.floor(cam.x)),top=Math.max(0,Math.floor(cam.y));
    this.ctx.drawImage(this.layer,left,top,Math.min(this.W,this.layer.width-left),Math.min(this.H,this.layer.height-top),0,0,Math.min(this.W,this.layer.width-left),Math.min(this.H,this.layer.height-top));
    this.dynamic(cam,tick,season);
  }
  dynamic(cam,tick,season){const c=this.ctx;
    // water reflections and insects
    for(let j=0;j<14;j++){const X=3*32+(this.h(j,5)%220)-cam.x, Y=15*32+(this.h(j,6)%178)-cam.y;
      const drift=Math.sin(tick*.025+j)*7;c.globalAlpha=.2+Math.max(0,Math.sin(tick*.033+j))*.44;
      this.rect(c,X+drift,Y,10+(j%3)*4,2,'#e8f8de');c.globalAlpha=1;
    }
    for(let j=0;j<9;j++){const X=(this.h(j,10)%this.layer.width)-cam.x,Y=(this.h(j,13)%this.layer.height)-cam.y;
      const ix=Math.sin(tick*.023+j)*10,iy=Math.cos(tick*.017+j)*6;
      this.ell(c,X+ix,Y+iy,3,2,j%2?'#fbe79d':'#f8c4cf');this.rect(c,X+ix+4,Y+iy,3,1,'#f3d690');
    }
    // softly animated chimney smoke
    for(let i=0;i<5;i++){const X=4*32+152-cam.x+Math.sin(tick*.009+i)*8+i*5,Y=3*32-28-cam.y-i*13+((tick*.37)%14);
      c.globalAlpha=.28-i*.04;this.ell(c,X,Y,7+i*2,4+i,'#fff8e6');c.globalAlpha=1;
    }
  }
}
window.PixelValley=PixelValley;
})();
