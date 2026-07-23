window.YH_DATA = {
  chapters: [
    {id:'strawberry',name:'桃天草莓晶',sub:'粉晶流光 · 桃花仙境',bg:['#f5b8cc','#8f4369'],gem:['#ffe9f2','#f595b8','#d85f91'],glow:'rgba(255,150,195,.75)'},
    {id:'white',name:'太初白玉',sub:'凝脂若雪 · 水墨云境',bg:['#eee8db','#8f887a'],gem:['#fffef4','#e9dec6','#c8b58f'],glow:'rgba(255,245,215,.6)'},
    {id:'purple',name:'紫微星辉',sub:'紫晶星轨 · 夜空流霞',bg:['#9d73cc','#2e214a'],gem:['#f0d9ff','#b783df','#7444ad'],glow:'rgba(180,110,255,.65)'},
    {id:'green',name:'青龙翡翠',sub:'冰种翠色 · 竹影云山',bg:['#76b696','#244e3c'],gem:['#e3ffef','#66c891','#18805b'],glow:'rgba(91,222,151,.6)'},
    {id:'moon',name:'月华玉髓',sub:'月光晕彩 · 桂影清辉',bg:['#7f91cb','#27345c'],gem:['#f8fbff','#a9c9ff','#718ad4'],glow:'rgba(160,200,255,.7)'},
    {id:'sea',name:'琉璃海境',sub:'海蓝宝光 · 潮汐浮梦',bg:['#68c1d0','#25526d'],gem:['#e5fdff','#72d8ea','#248ca8'],glow:'rgba(82,220,255,.66)'},
    {id:'red',name:'凤栖赤玉',sub:'南红流火 · 金凤祥云',bg:['#d66b5c','#642b31'],gem:['#ffe2d7','#e96e58','#a62f2f'],glow:'rgba(255,107,84,.64)'},
    {id:'black',name:'玄天墨玉',sub:'墨玉星河 · 玄夜金辉',bg:['#4d5558','#12191c'],gem:['#9eafab','#344742','#101b19'],glow:'rgba(160,220,205,.35)'}
  ],
  levels: [
    {
      name:'桃花初结',
      rings:[
        {id:'A',x:450,y:220,r:112,gap:-1.45,z:5},{id:'B',x:255,y:425,r:116,gap:2.85,z:4},{id:'C',x:645,y:425,r:116,gap:.25,z:3},{id:'D',x:330,y:690,r:120,gap:-2.2,z:2},{id:'E',x:570,y:690,r:120,gap:-.85,z:1}
      ],
      clasps:[
        {id:'AB',a:'A',b:'B',unlock:'A'},{id:'AC',a:'A',b:'C',unlock:'A',offset:.05},
        {id:'BD',a:'B',b:'D',unlock:'B',after:['A']},{id:'CE',a:'C',b:'E',unlock:'C',after:['A']},
        {id:'DE',a:'D',b:'E',unlock:'D',after:['B','C'],diamond:true}
      ]
    },
    {
      name:'双环相照',
      rings:[{id:'A',x:320,y:500,r:155,gap:2.6,z:2},{id:'B',x:580,y:500,r:155,gap:.48,z:1}],
      clasps:[{id:'AB1',a:'A',b:'B',unlock:'A',offset:-.12},{id:'AB2',a:'A',b:'B',unlock:'B',offset:.24,after:['A'],diamond:true}]
    },
    {
      name:'流霞三叠',
      rings:[{id:'A',x:450,y:250,r:126,gap:-1.25,z:3},{id:'B',x:305,y:590,r:142,gap:2.5,z:2},{id:'C',x:595,y:590,r:142,gap:.65,z:1}],
      clasps:[{id:'AB',a:'A',b:'B',unlock:'A'},{id:'AC',a:'A',b:'C',unlock:'A'},{id:'BC',a:'B',b:'C',unlock:'B',after:['A'],diamond:true}]
    },
    {
      name:'四方连佩',
      rings:[{id:'A',x:300,y:340,r:122,gap:2.9,z:4},{id:'B',x:600,y:340,r:122,gap:.18,z:3},{id:'C',x:300,y:710,r:122,gap:-2.35,z:2},{id:'D',x:600,y:710,r:122,gap:-.7,z:1}],
      clasps:[{id:'AB',a:'A',b:'B',unlock:'A'},{id:'AC',a:'A',b:'C',unlock:'A'},{id:'BD',a:'B',b:'D',unlock:'B',after:['A']},{id:'CD',a:'C',b:'D',unlock:'C',after:['A','B'],diamond:true}]
    },
    {
      name:'七环玲珑',
      rings:[{id:'A',x:450,y:155,r:92,gap:-1.25,z:7},{id:'B',x:245,y:320,r:98,gap:2.7,z:6},{id:'C',x:655,y:320,r:98,gap:.42,z:5},{id:'D',x:300,y:545,r:102,gap:2.95,z:4},{id:'E',x:600,y:545,r:102,gap:.12,z:3},{id:'F',x:345,y:780,r:106,gap:-2.05,z:2},{id:'G',x:555,y:780,r:106,gap:-.9,z:1}],
      clasps:[{id:'AB',a:'A',b:'B',unlock:'A'},{id:'AC',a:'A',b:'C',unlock:'A'},{id:'BD',a:'B',b:'D',unlock:'B',after:['A']},{id:'CE',a:'C',b:'E',unlock:'C',after:['A']},{id:'DF',a:'D',b:'F',unlock:'D',after:['B']},{id:'EG',a:'E',b:'G',unlock:'E',after:['C']},{id:'FG',a:'F',b:'G',unlock:'F',after:['D','E'],diamond:true}]
    }
  ]
};
