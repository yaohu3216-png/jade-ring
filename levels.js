(function(){
  'use strict';
  const THEMES=[
    {id:'strawberry',no:'第一章',title:'桃天草莓晶',short:'草莓晶',bg:'assets/bg-pink-blur.webp',hero:'assets/bg-pink.webp',colors:['#fff6fb','#ffd4e3','#f49aba','#d65886','#8e355d'],gem:'#ffd4e7',vein:'#d85d8c',plate:['#f7f0df','#dbe4d2'],note:'桃花入水，粉晶生辉。'},
    {id:'white',no:'第二章',title:'月华白玉髓',short:'白玉髓',bg:'assets/bg-pink-blur.webp',hero:'assets/bg-pink.webp',colors:['#ffffff','#f8f3e7','#e7dfcf','#c8bca7','#968a7a'],gem:'#dff7ff',vein:'#d7c7ae',plate:['#f7f3e9','#e1e4d8'],note:'月色凝脂，清辉如雪。'},
    {id:'jade',no:'第三章',title:'青岚翡翠',short:'翡翠',bg:'assets/bg-green-blur.webp',hero:'assets/bg-green.webp',colors:['#f0fff4','#bcefc9','#69c98f','#24935f','#0b5c3e'],gem:'#e6fff0',vein:'#18724a',plate:['#eff5e7','#cbdcc8'],note:'青岚入佩，碧水生光。'},
    {id:'amethyst',no:'第四章',title:'紫露星晶',short:'紫晶',bg:'assets/bg-purple-blur.webp',hero:'assets/bg-purple.webp',colors:['#fff5ff','#e7c7ff','#b785e8','#7d49b7','#4d276f'],gem:'#f0d8ff',vein:'#8150b8',plate:['#f5eff7','#d8cfe1'],note:'紫露含星，月照花影。'},
    {id:'rose',no:'第五章',title:'流霞粉玉',short:'粉玉',bg:'assets/bg-pink-blur.webp',hero:'assets/bg-pink.webp',colors:['#fff7fa','#ffc8dc','#ef88b0','#cc4f82','#7d3153'],gem:'#ffe1eb',vein:'#bd4f7a',plate:['#f7efe7','#e1d8d0'],note:'流霞映水，花影摇风。'},
    {id:'blue',no:'第六章',title:'雨后天青',short:'天青',bg:'assets/bg-green-blur.webp',hero:'assets/bg-green.webp',colors:['#f4fdff','#c5efff','#7fd3ee','#3b9fc8','#1d617c'],gem:'#dff9ff',vein:'#367f9c',plate:['#edf3eb','#cadbd7'],note:'雨过天青，云破月来。'},
    {id:'amber',no:'第七章',title:'琥珀金珀',short:'琥珀',bg:'assets/bg-pink-blur.webp',hero:'assets/bg-pink.webp',colors:['#fff8dd','#ffe4a5','#f2b550','#d17b1f','#7c4210'],gem:'#fff2b8',vein:'#b16c20',plate:['#f5eedf','#ded4c1'],note:'琥珀流光，秋水长天。'},
    {id:'onyx',no:'第八章',title:'玄夜墨玉',short:'墨玉',bg:'assets/bg-purple-blur.webp',hero:'assets/bg-purple.webp',colors:['#e7f0ec','#87938e','#3e4845','#1d2422','#070a09'],gem:'#dcefff',vein:'#9bb2ab',plate:['#e8ece7','#cbd1cc'],note:'玄夜藏辉，墨玉含光。'}
  ];

  const LAYOUTS=[
    {
      name:'初见玉结',
      rings:[
        ['A',330,300,105,14],['B',570,300,105,14],['C',205,515,100,9],['D',450,500,108,20],['E',695,515,100,9],['F',330,735,103,5],['G',570,735,103,5]
      ],
      edges:[
        ['A','D',[],2],['B','D',[],2],
        ['C','A',['D'],1],['E','B',['D'],1],
        ['F','C',['A'],2],['G','E',['B'],2],
        ['board','F',['C'],1,{x:270,y:835,angle:65}],['board','G',['E'],1,{x:630,y:835,angle:115}]
      ]
    },
    {
      name:'双燕衔环',
      rings:[
        ['A',450,285,100,18],['B',285,430,102,14],['C',615,430,102,14],['D',210,650,98,8],['E',450,600,106,20],['F',690,650,98,8],['G',335,820,94,4],['H',565,820,94,4]
      ],
      edges:[
        ['B','E',[],2],['C','E',[],2],
        ['A','B',['E'],1],['A','C',['E'],1],
        ['D','A',['B','C'],2],
        ['G','D',['A'],1],['H','F',['A'],1],['F','C',['E'],2],
        ['board','G',['D'],1,{x:280,y:920,angle:70}],['board','H',['F'],1,{x:620,y:920,angle:110}]
      ]
    },
    {
      name:'三星照水',
      rings:[
        ['A',450,255,92,10],['B',285,380,98,13],['C',615,380,98,13],['D',180,560,94,7],['E',450,545,105,20],['F',720,560,94,7],['G',290,740,96,4],['H',610,740,96,4],['I',450,870,90,2]
      ],
      edges:[
        ['A','E',[],1],['B','E',[],2],['C','E',[],2],
        ['D','B',['E'],1],['F','C',['E'],1],
        ['G','D',['B'],2],['H','F',['C'],2],
        ['I','G',['D'],1],['I','H',['F'],1],
        ['board','I',['G','H'],2,{x:450,y:970,angle:90}]
      ]
    },
    {
      name:'流云锁',
      rings:[
        ['A',320,250,88,11],['B',580,250,88,11],['C',205,430,93,8],['D',450,430,102,20],['E',695,430,93,8],['F',205,650,93,6],['G',450,650,102,17],['H',695,650,93,6],['I',320,835,88,3],['J',580,835,88,3]
      ],
      edges:[
        ['A','D',[],1],['B','D',[],1],['C','D',[],2],['E','D',[],2],
        ['F','C',['D'],1],['H','E',['D'],1],['G','F',['C'],2],['G','H',['E'],2],
        ['I','G',['F','H'],1],['J','G',['F','H'],1],
        ['board','I',['G'],1,{x:270,y:930,angle:70}],['board','J',['G'],1,{x:630,y:930,angle:110}]
      ]
    },
    {
      name:'五星连珠',
      rings:[
        ['A',450,225,84,8],['B',280,345,90,11],['C',620,345,90,11],['D',160,510,88,6],['E',450,510,100,20],['F',740,510,88,6],['G',245,690,90,5],['H',655,690,90,5],['I',360,850,84,2],['J',540,850,84,2]
      ],
      edges:[
        ['A','E',[],1],['B','E',[],2],['C','E',[],2],
        ['D','B',['E'],1],['F','C',['E'],1],['G','D',['B'],2],['H','F',['C'],2],
        ['I','G',['D'],1],['J','H',['F'],1],
        ['board','I',['G'],1,{x:310,y:940,angle:70}],['board','J',['H'],1,{x:590,y:940,angle:110}]
      ]
    },
    {
      name:'回纹玉扣',
      rings:[
        ['A',320,220,78,7],['B',580,220,78,7],['C',205,370,84,9],['D',450,365,96,18],['E',695,370,84,9],['F',150,555,82,5],['G',365,550,90,14],['H',535,550,90,14],['I',750,555,82,5],['J',260,755,84,3],['K',640,755,84,3],['L',450,885,78,2]
      ],
      edges:[
        ['A','D',[],1],['B','D',[],1],['C','D',[],2],['E','D',[],2],
        ['F','C',['D'],1],['G','C',['D'],2],['H','E',['D'],2],['I','E',['D'],1],
        ['J','F',['C'],1],['J','G',['C'],1],['K','H',['E'],1],['K','I',['E'],1],
        ['L','J',['F','G'],2],['L','K',['H','I'],2],['board','L',['J','K'],1,{x:450,y:975,angle:90}]
      ]
    },
    {
      name:'七曜同辉',
      rings:[
        ['A',450,185,74,6],['B',290,275,78,8],['C',610,275,78,8],['D',170,430,80,5],['E',450,420,94,18],['F',730,430,80,5],['G',225,610,82,4],['H',450,610,92,15],['I',675,610,82,4],['J',285,790,78,3],['K',615,790,78,3],['L',450,910,72,2]
      ],
      edges:[
        ['A','E',[],1],['B','E',[],1],['C','E',[],1],
        ['D','B',['E'],2],['F','C',['E'],2],['G','D',['B'],1],['I','F',['C'],1],
        ['H','G',['D'],2],['H','I',['F'],2],['J','H',['G','I'],1],['K','H',['G','I'],1],
        ['L','J',['H'],1],['L','K',['H'],1],['board','L',['J','K'],2,{x:450,y:990,angle:90}]
      ]
    },
    {
      name:'八方玲珑',
      rings:[
        ['A',300,200,72,6],['B',600,200,72,6],['C',180,350,78,5],['D',450,340,90,18],['E',720,350,78,5],['F',145,540,76,4],['G',350,520,84,12],['H',550,520,84,12],['I',755,540,76,4],['J',245,715,78,3],['K',450,715,86,10],['L',655,715,78,3],['M',350,885,72,2],['N',550,885,72,2]
      ],
      edges:[
        ['A','D',[],1],['B','D',[],1],['C','D',[],2],['E','D',[],2],
        ['F','C',['D'],1],['G','C',['D'],1],['H','E',['D'],1],['I','E',['D'],1],
        ['J','F',['C'],2],['K','G',['C'],2],['K','H',['E'],2],['L','I',['E'],2],
        ['M','J',['F'],1],['M','K',['G','H'],1],['N','K',['G','H'],1],['N','L',['I'],1],
        ['board','M',['J','K'],1,{x:315,y:975,angle:70}],['board','N',['K','L'],1,{x:585,y:975,angle:110}]
      ]
    },
    {
      name:'九曲盘长',
      rings:[
        ['A',450,160,68,5],['B',280,245,72,6],['C',620,245,72,6],['D',155,385,74,4],['E',450,370,88,18],['F',745,385,74,4],['G',140,560,72,3],['H',350,545,80,11],['I',550,545,80,11],['J',760,560,72,3],['K',245,720,74,2],['L',450,720,82,9],['M',655,720,74,2],['N',350,875,68,1],['O',550,875,68,1]
      ],
      edges:[
        ['A','E',[],1],['B','E',[],1],['C','E',[],1],['D','E',[],2],['F','E',[],2],
        ['G','D',['E'],1],['H','D',['E'],1],['I','F',['E'],1],['J','F',['E'],1],
        ['K','G',['D'],2],['L','H',['D'],2],['L','I',['F'],2],['M','J',['F'],2],
        ['N','K',['G'],1],['N','L',['H','I'],1],['O','L',['H','I'],1],['O','M',['J'],1],
        ['board','N',['K','L'],1,{x:310,y:965,angle:70}],['board','O',['L','M'],1,{x:590,y:965,angle:110}]
      ]
    },
    {
      name:'十全玉阵',
      rings:[
        ['A',300,150,64,4],['B',600,150,64,4],['C',180,285,68,5],['D',450,275,84,18],['E',720,285,68,5],['F',120,445,68,3],['G',330,430,76,10],['H',570,430,76,10],['I',780,445,68,3],['J',145,615,68,2],['K',350,605,76,8],['L',550,605,76,8],['M',755,615,68,2],['N',250,780,70,1],['O',450,780,78,7],['P',650,780,70,1],['Q',350,925,62,1],['R',550,925,62,1]
      ],
      edges:[
        ['A','D',[],1],['B','D',[],1],['C','D',[],1],['E','D',[],1],
        ['F','C',['D'],2],['G','C',['D'],1],['H','E',['D'],1],['I','E',['D'],2],
        ['J','F',['C'],1],['K','G',['C'],2],['L','H',['E'],2],['M','I',['E'],1],
        ['N','J',['F'],1],['O','K',['G'],1],['O','L',['H'],1],['P','M',['I'],1],
        ['Q','N',['J'],1],['Q','O',['K','L'],1],['R','O',['K','L'],1],['R','P',['M'],1],
        ['board','Q',['N','O'],2,{x:315,y:1005,angle:70}],['board','R',['O','P'],2,{x:585,y:1005,angle:110}]
      ]
    },
    {
      name:'万象归环',
      rings:[
        ['A',450,130,60,4],['B',270,210,64,5],['C',630,210,64,5],['D',145,335,66,3],['E',450,320,82,18],['F',755,335,66,3],['G',95,490,64,2],['H',300,475,72,9],['I',600,475,72,9],['J',805,490,64,2],['K',120,650,64,2],['L',330,635,72,8],['M',570,635,72,8],['N',780,650,64,2],['O',240,795,66,1],['P',450,790,74,7],['Q',660,795,66,1],['R',350,925,60,1],['S',550,925,60,1]
      ],
      edges:[
        ['A','E',[],1],['B','E',[],1],['C','E',[],1],['D','E',[],2],['F','E',[],2],
        ['G','D',['E'],1],['H','D',['E'],1],['I','F',['E'],1],['J','F',['E'],1],
        ['K','G',['D'],2],['L','H',['D'],2],['M','I',['F'],2],['N','J',['F'],2],
        ['O','K',['G'],1],['P','L',['H'],1],['P','M',['I'],1],['Q','N',['J'],1],
        ['R','O',['K'],1],['R','P',['L','M'],1],['S','P',['L','M'],1],['S','Q',['N'],1],
        ['board','R',['O','P'],2,{x:315,y:1005,angle:70}],['board','S',['P','Q'],2,{x:585,y:1005,angle:110}]
      ]
    }
  ];

  function seeded(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
  function ringMap(layout){return Object.fromEntries(layout.rings.map(r=>[r[0],{id:r[0],x:r[1],y:r[2],r:r[3],z:r[4]}]))}
  function makeClasp(edge,index,map){
    const [host,guest,blockers,gems,manual]=edge; const g=map[guest];
    let x,y,angle;
    if(manual){x=manual.x;y=manual.y;angle=manual.angle||0}
    else{
      const h=map[host]; const dx=h.x-g.x,dy=h.y-g.y,dist=Math.hypot(dx,dy)||1;
      x=g.x+dx/dist*g.r*.84; y=g.y+dy/dist*g.r*.84; angle=Math.atan2(dy,dx)*180/Math.PI;
    }
    return {id:`C${index}`,host,guest,x,y,angle,gems:gems||1,blockers:[...(blockers||[])],released:false};
  }
  function buildLevel(chapterIndex,levelIndex){
    const layout=LAYOUTS[levelIndex%LAYOUTS.length]; const rand=seeded((chapterIndex+1)*10007+(levelIndex+1)*997);
    const map=ringMap(layout);
    const rings=layout.rings.map(([id,x,y,r,z],i)=>{
      let rotation=(rand()*Math.PI*2)-Math.PI;
      return {id,x,y,r,z,rotation,gapSize:(56+rand()*10)*Math.PI/180,seed:Math.floor(rand()*100000),removed:false};
    });
    const clasps=layout.edges.map((e,i)=>makeClasp(e,i,map));
    // Prevent the initial opening from already sitting on an immediately releasable clasp.
    for(const ring of rings){
      const incoming=clasps.filter(c=>c.guest===ring.id && c.blockers.length===0);
      for(let guard=0;guard<12 && incoming.some(c=>Math.abs(norm(ring.rotation-Math.atan2(c.y-ring.y,c.x-ring.x)))<.48);guard++) ring.rotation+=.73;
    }
    return {id:chapterIndex*11+levelIndex+1,name:layout.name,chapterIndex,levelIndex,rings,clasps};
  }
  function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}

  window.YH_DATA={THEMES,LAYOUTS,buildLevel};
})();
