export const CHAPTER = {
  name: '桃天草莓晶',
  subtitle: '粉晶映花，金扣成结。'
};

export const LEVELS = [
  {
    name: '桃花初结',
    rings: [
      { id:'A', x:0, y:1.72, radius:.91, opening:230, hue:0.96, freeAtEnd:true },
      { id:'B', x:-1.18, y:.28, radius:.91, opening:186, hue:0.97 },
      { id:'C', x:1.18, y:.28, radius:.91, opening:354, hue:0.95 },
      { id:'D', x:-.72, y:-1.28, radius:.91, opening:135, hue:0.98 },
      { id:'E', x:.72, y:-1.28, radius:.91, opening:45, hue:0.96 }
    ],
    clasps: [
      { id:'L1', host:'A', guest:'B', x:-.54, y:1.02, angle:46, order:0, tilt:-42 },
      { id:'L2', host:'A', guest:'C', x:.54, y:1.02, angle:134, order:1, tilt:42 },
      { id:'L3', host:'B', guest:'D', x:-.94, y:-.46, angle:29, order:2, tilt:-25 },
      { id:'L4', host:'C', guest:'E', x:.94, y:-.46, angle:151, order:3, tilt:25 },
      { id:'L5', host:'D', guest:'E', x:0, y:-1.28, angle:180, order:4, tilt:0 }
    ]
  },
  {
    name: '双燕衔环',
    rings: [
      {id:'A',x:-1.03,y:1.15,radius:.86,opening:215,hue:.97},
      {id:'B',x:1.03,y:1.15,radius:.86,opening:325,hue:.95},
      {id:'C',x:0,y:.05,radius:.94,opening:90,hue:.98,freeAtEnd:true},
      {id:'D',x:-1.03,y:-1.18,radius:.86,opening:150,hue:.96},
      {id:'E',x:1.03,y:-1.18,radius:.86,opening:30,hue:.97}
    ],
    clasps: [
      {id:'L1',host:'C',guest:'A',x:-.52,y:.68,angle:315,order:0,tilt:-35},
      {id:'L2',host:'C',guest:'B',x:.52,y:.68,angle:225,order:1,tilt:35},
      {id:'L3',host:'A',guest:'D',x:-1.03,y:0,angle:90,order:2,tilt:0},
      {id:'L4',host:'B',guest:'E',x:1.03,y:0,angle:90,order:3,tilt:0},
      {id:'L5',host:'D',guest:'E',x:0,y:-1.18,angle:180,order:4,tilt:0}
    ]
  },
  {
    name: '九华连绮',
    rings: [
      {id:'A',x:0,y:2.03,radius:.73,opening:180,hue:.96,freeAtEnd:true},
      {id:'B',x:-1.08,y:1.04,radius:.73,opening:240,hue:.97},
      {id:'C',x:1.08,y:1.04,radius:.73,opening:300,hue:.95},
      {id:'D',x:-1.46,y:-.16,radius:.73,opening:180,hue:.98},
      {id:'E',x:0,y:-.14,radius:.73,opening:90,hue:.96},
      {id:'F',x:1.46,y:-.16,radius:.73,opening:0,hue:.97},
      {id:'G',x:-.88,y:-1.34,radius:.73,opening:130,hue:.95},
      {id:'H',x:.88,y:-1.34,radius:.73,opening:50,hue:.98}
    ],
    clasps: [
      {id:'L1',host:'A',guest:'B',x:-.50,y:1.57,angle:45,order:0,tilt:-35},
      {id:'L2',host:'A',guest:'C',x:.50,y:1.57,angle:135,order:1,tilt:35},
      {id:'L3',host:'B',guest:'D',x:-1.28,y:.43,angle:15,order:2,tilt:-20},
      {id:'L4',host:'B',guest:'E',x:-.52,y:.38,angle:165,order:3,tilt:20},
      {id:'L5',host:'C',guest:'E',x:.52,y:.38,angle:15,order:4,tilt:-20},
      {id:'L6',host:'C',guest:'F',x:1.28,y:.43,angle:165,order:5,tilt:20},
      {id:'L7',host:'D',guest:'G',x:-1.16,y:-.75,angle:90,order:6,tilt:0},
      {id:'L8',host:'F',guest:'H',x:1.16,y:-.75,angle:90,order:7,tilt:0},
      {id:'L9',host:'G',guest:'H',x:0,y:-1.34,angle:180,order:8,tilt:0}
    ]
  }
];
