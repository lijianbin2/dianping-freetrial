import io
src = "..\\hamibot_freetrial_V23.js"
dst = "..\\hamibot_freetrial_V25.js"
s = io.open(src, encoding="utf-8").read()
assert "function tryOpenQualifiedOnce(){" in s
assert "function guardBack(tag){" in s
s = s.replace("V23", "V25")
lines = s.split("\n")
a = next(i for i,l in enumerate(lines) if l.startswith("function tryOpenQualifiedOnce(){"))
b = next(i for i,l in enumerate(lines) if l.startswith("function guardBack(tag){"))
new_fn = """var SAFE_TOP=700;
function tryOpenQualifiedOnce(){
  // V25: value-anchored (U2 parity). 禁点: 快筛芯片(高中奖率/附近/连锁餐厅/200元)一律不碰, 只认 y>=700 的价值数字卡.
  var tvs=className("android.widget.TextView").find();
  var vals=[];var dists=[];
  for(var i=0;i<tvs.length;i++){
    try{
      var o=tvs[i];var b=o.bounds();var cy=b.centerY();
      if(cy<650)continue;
      var t=(o.text()||"").split(String.fromCharCode(160)).join("").replace(/\\s+/g,"");
      if(!t)continue;
      if(/^[0-9]+$/.test(t)){vals.push({cy:cy,val:parseInt(t,10)});continue;}
      var dm=t.match(/^([0-9]+(\\.[0-9]+)?)km$/);
      if(dm){dists.push({cy:cy,dist:parseFloat(dm[1])});}
    }catch(e){}
  }
  L("value-scan vals="+vals.length+" dists="+dists.length);toast("扫卡 值x"+vals.length);
  var cards=[];
  for(var v=0;v<vals.length;v++){
    var bi=-1;var bd=1e9;
    for(var k=0;k<dists.length;k++){var dy=Math.abs(dists[k].cy-vals[v].cy);if(dy<200&&dy<bd){bd=dy;bi=k;}}
    if(bi>=0)cards.push({y:vals[v].cy,val:vals[v].val,dist:dists[bi].dist});
  }
  cards.sort(function(x,y){return x.y-y.y;});
  var uniq=[];
  for(var u=0;u<cards.length;u++){if(uniq.length==0||Math.abs(cards[u].y-uniq[uniq.length-1].y)>80)uniq.push(cards[u]);}
  for(var c=0;c<uniq.length;c++){
    var cd=uniq[c];
    L("cand"+c+":v"+cd.val+"d"+cd.dist+" y="+cd.y);
    if(cd.val>100&&cd.dist>=0&&cd.dist<20){
      if(cd.y<SAFE_TOP){L("skip y<700 疑似顶栏/快筛(连锁餐厅等)禁点");continue;}
      if(cd.y>device.height-100){L("skip bottom-tab guard");continue;}
      L("hit "+cd.val+"yuan "+cd.dist+"km y="+cd.y);
      try{click(device.width/2,cd.y);}catch(ee){}
      sleep(2500);
      var detail=false;
      try{if(text("我要报名").findOnce()!=null)detail=true;}catch(ee){}
      try{if(!detail&&!inFreeList())detail=true;}catch(ee){}
      if(detail){L("open ok");return{val:cd.val,dist:cd.dist,text:"v"+cd.val+"d"+cd.dist};}
      L("tap miss, 不做父容器盲点(防误点大容器), 看下一张");
      continue;
    }
  }
  return null;
}
"""
lines[a:b] = [new_fn]
io.open(dst, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("wrote", dst)
