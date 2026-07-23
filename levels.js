const YH={chapters:[
{name:'青玉章',jade:['#effff5','#a9dfc2','#4c9878'],bg:['#174d40','#082c29'],verse:'君子比德于玉，温润而泽。'},
{name:'羊脂章',jade:['#fffdf0','#eadfbe','#bba878'],bg:['#665d49','#27231c'],verse:'玉质如脂，光华内敛。'},
{name:'碧玉章',jade:['#e0f6d4','#79b873','#356f4b'],bg:['#28543f','#102b25'],verse:'碧色生春，万物含章。'},
{name:'翡翠章',jade:['#ddffeb','#53cf8e','#08714d'],bg:['#145340','#062a26'],verse:'翠色凝光，清而不寒。'},
{name:'黄玉章',jade:['#fff2ad','#d8aa47','#8a5a17'],bg:['#604923','#281f15'],verse:'黄玉承光，厚德载物。'},
{name:'紫玉章',jade:['#f3ddff','#ad7dca','#623d83'],bg:['#463555','#201829'],verse:'紫气含烟，静观万象。'},
{name:'墨玉章',jade:['#c3cfcc','#4d625f','#142d2b'],bg:['#2b3736','#0d1818'],verse:'墨玉藏锋，玄理自明。'},
{name:'赤玉章',jade:['#ffded4','#d57163','#8f302a'],bg:['#572d2b','#251617'],verse:'赤玉如心，明而有守。'}],levels:[]};
(function(){const names=['初见玉结','双环相扣','三星照月','四象回环','五星连珠','六合同心','七曜成阵','八方藏机','九宫叠翠','十全玉局','归一'];
function layout(n,seed){const out=[];const cx=.5,cy=.5; if(n===2)return [[.36,.5,.22,180],[.64,.5,.22,0]]; const rad=n<=4?.22:n<=6?.27:.31; for(let i=0;i<n;i++){const a=-Math.PI/2+i*Math.PI*2/n;out.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad,Math.max(.135,.20-n*.008),(seed*47+i*71)%360])}return out}
for(let c=0;c<8;c++)for(let j=0;j<11;j++){const idx=c*11+j,n=Math.min(2+Math.floor(j/2),7),rings=layout(n,idx+1);const links=[];for(let i=0;i<n;i++)links.push([i,(i+1)%n]);if(n>4&&j%2)links.push([0,Math.floor(n/2)]);const order=[...Array(n).keys()].sort((a,b)=>((a*7+idx)%n)-((b*7+idx)%n));YH.levels.push({chapter:c,name:names[j],rings,links,order,tolerance:20});}
})();