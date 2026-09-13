// V6 2026-09-13: 右卡=入口(免费试 2万个活动在线).标题是图片无文本节点,盯活动在线整卡
auto.waitFor();
try{device.wakeUpIfNeeded();}catch(e){}
toast("V9 start");
log("V9 start");
function clickUpClickable(node){
  var p=node;
  for(var i=0;i<6;i++){
    try{if(!p)break;if(p.clickable()){p.click();return true;}p=p.parent();}catch(e){break;}
  }
  return false;
}
function verifyIn(){
  return textContains("免费抽").findOnce()||text("免费试").findOnce()||textContains("高中奖率").findOnce()||textContains("免费试用").findOnce()||textContains("霸王餐").findOnce();
}
function closePopup(){
  var keys=["跳过","关闭","以后再说","我知道了","取消","知道了"];
  for(var i=0;i<keys.length;i++){
    try{var n=text(keys[i]).findOne(500)||desc(keys[i]).findOne(500);if(n){log("关弹窗:"+keys[i]);try{n.click();}catch(e){clickUpClickable(n);}sleep(500);}}catch(e){}
  }
}
function dumpKeys(){
  try{
    var all=className("android.widget.TextView").find();
    var hits=[];var n=0;
    for(var i=0;i<all.length;i++){
      try{var t=all[i].text()||"";if(!t)continue;
      if(t.indexOf("活动在线")>=0){hits.push("【活动在线】"+t+"@y="+all[i].bounds().centerY());n++;}
      else if(t.indexOf("免费试")>=0){hits.push("【免费试】"+t+"@y="+all[i].bounds().centerY());n++;}
      else if(t.indexOf("免费")>=0||t.indexOf("霸王餐")>=0){hits.push(t+"@y="+all[i].bounds().centerY());}
      }catch(e){}
    }
    if(hits.length>0){log("屏上("+all.length+")免费相关:"+hits.join("|"));toast("活动在线x"+n);}
    else{log("无免费词,TextView="+all.length);}
  }catch(e){log("dump失败:"+e);}
}
function tryOne(node,tag){
  if(!node)return false;
  try{log("命中:"+tag+" y="+node.bounds().centerY());}catch(e){log("命中:"+tag);}
  if(clickUpClickable(node)){sleep(3000);if(verifyIn())return true;}
  try{var b=node.bounds();click(b.centerX(),b.centerY());sleep(3000);if(verifyIn())return true;}catch(e){}
  return false;
}
function tapScale(x1280,y2772,tag){
  var x=Math.floor(device.width*x1280/1280),y=Math.floor(device.height*y2772/2772);
  log("坐标:"+tag+" "+x+","+y);click(x,y);sleep(3000);
  return verifyIn();
}
function tryAllKw(tag){
  var h=null;try{h=textContains("活动在线").findOne(1000);}catch(e){}
  if(h&&tryOne(h,tag+":活动在线整卡"))return true;
  var e1=null;try{e1=text("免费试").findOne(800);}catch(e){}
  if(e1&&tryOne(e1,tag+":exact免费试"))return true;
  var kws=["免费试","免费抽","霸王餐","免费试用"];
  for(var k=0;k<kws.length;k++){
    var tip=null;try{tip=textContains(kws[k]).findOne(600);}catch(e){}
    if(tip&&tryOne(tip,tag+":"+kws[k]))return true;
  }
  var d=null;try{d=descContains("免费试").findOne(600);}catch(e){}
  if(d&&tryOne(d,tag+":desc"))return true;
  return false;
}
function openMianFeiShi(){
  try{app.launch("com.dianping.v1");}catch(e){}
  toast("点右卡:免费试 2万个活动在线");
  sleep(5000);closePopup();
  for(var s=0;s<10;s++){
    dumpKeys();
    if(tryAllKw("原地"+s)){toast("已打开免费试");return true;}
    sleep(2500);
    if(s==4||s==7)closePopup();
  }
  toast("还没中,回顶一次再找整卡");
  swipe(device.width/2,device.height*0.28,device.width/2,device.height*0.75,500);
  sleep(2500);closePopup();dumpKeys();
  for(var t=0;t<3;t++){
    if(tryAllKw("回顶"+t)){toast("已打开免费试");return true;}
    sleep(1200);
  }
  toast("走坐标:先点图片再点整卡");
  if(tapScale(744,1014,"ImageView免费试")){toast("已打开免费试");return true;}
  if(tapScale(956,1102,"右卡中心")){toast("已打开免费试");return true;}
  try{
    var my=text("我的").findOnce();
    if(my){clickUpClickable(my);sleep(2500);dumpKeys();if(tryAllKw("我的页"))return true;
      var home=text("首页").findOnce();if(home)clickUpClickable(home);sleep(2000);}
  }catch(e){log(e);}
  toast("没找到入口,看log活动在线");
  return false;
}

function ensureMeishi(){
  if(!textContains("\u514d\u8d39\u8bd5").findOne(2000)){toast("V9:没扫到免费试字样,继续");log("V9 no free marker, go on");}
  if(text("\u7f8e\u98df").findOnce()){toast("in meishi");return;}
  for(var r=0;r<5;r++){
 toast("switch meishi try "+r);log("switch meishi try "+r);
    var c=null;try{c=text("\u5168\u90e8\u5206\u7c7b").findOnce();}catch(e){}
    if(c){try{var pp=c.parent();if(pp)pp.click();else c.click();}catch(e){try{c.click();}catch(e2){}}}
    else{var sx=device.width/1280,sy=device.height/2772;click(481*sx,1529*sy);}
    sleep(2500);
    try{var ms=className("android.widget.TextView").find();var ks="";for(var i=0;i<Math.min(ms.length,30);i++){ks+=(ms[i].text()||"")+",";}log("menu:"+ks.slice(0,100));}catch(e){}
    var m=null;try{m=text("\u7f8e\u98df").findOnce();}catch(e){}
    if(m){try{var mp=m.parent();if(mp)mp.click();else m.click();}catch(e){var sx2=device.width/1280,sy2=device.height/2772;click(640*sx2,634*sy2);}sleep(2500);toast("to meishi");return;}
  }
  toast("keep list");
}

function tryOpenQualifiedOnce(){
  var tvs=className("android.widget.TextView").find();
  var all=[];
  for(var i=0;i<tvs.length;i++){try{var o=tvs[i];var b=o.bounds();all.push({t:o.text()||"",top:b.top,cy:b.centerY(),obj:o});}catch(e){}}
  var ax=[];
  for(var i=0;i<all.length;i++){if(all[i].t.indexOf("\u514d\u8d39\u62bd")>=0)ax.push(all[i]);}
  log("free x"+ax.length);toast("扫卡 free x"+ax.length);
  ax.sort(function(a,b){return a.cy-b.cy;});
  for(var a=0;a<ax.length;a++){
    var y=ax[a].cy;
    var win=[];
    for(var i=0;i<all.length;i++){if(Math.abs(all[i].cy-y)<350)win.push(all[i]);}
    win.sort(function(x,y){return x.top-y.top;});
    var joined="";for(var j=0;j<win.length;j++)joined+=win[j].t+"|";
    var clean=joined.split(String.fromCharCode(160)).join("").replace(/\s+/g,"");
    var vM=clean.match(/\u4ef7\u503c([0-9]+)\u5143/);
    var dM=clean.match(/([0-9]+(\.[0-9]+)?)km/);
    var val=vM?parseInt(vM[1],10):-1;
    var dist=dM?parseFloat(dM[1]):-1;
    log("cand"+a+":v"+val+"d"+dist);
    if(val>100&&dist>=0&&dist<20){
      log("hit"+val+"yuan"+dist+"km");
      var p=ax[a].obj;
      for(var k=0;k<6;k++){try{if(!p)break;if(p.clickable()){p.click();sleep(2500);return{val:val,dist:dist,text:clean};}p=p.parent();}catch(e){break;}}
      try{var b2=ax[a].obj.bounds();click(b2.centerX(),b2.centerY());sleep(2500);return{val:val,dist:dist,text:clean};}catch(e){}
    }
  }
  return null;
}

function doBaoMing(){
  var want=text("我要报名").findOne(5000);
  if(want){ want.click(); sleep(2000); }
  var q=text("确认报名").findOne(8000);
  if(q){ var qp=null; try{ qp=q.parent(); }catch(e){} if(qp) qp.click(); else q.click(); sleep(2500); }
  else { var sx=device.width/1280, sy=device.height/2772; click(640*sx,2558*sy); sleep(2000); }
  if(textContains("仅 Lv6").findOnce() || textContains("等级不够").findOnce() || textContains("暂未满足").findOnce() || textContains("橙V").findOnce()){
    return "level_buzu";
  }
  var done=text("完成").findOne(3000);
  if(done){ done.click(); sleep(2000); }
  back(); sleep(2500);
  return "ok";
}
openMianFeiShi();
ensureMeishi();
for(var i=0;i<2;i++){ swipe(device.width/2, device.height*0.3, device.width/2, device.height*0.8, 600); sleep(1200); }
var count=0;
while(true){
  var found=null;
  for(var s=0;s<8;s++){ found=tryOpenQualifiedOnce(); if(found) break; swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(1800); }
  if(!found){ toast("没找到更多符合商家,结束"); break; }
  toast("已打开 价值"+found.val+"元 "+found.dist+"km");
  var r=doBaoMing(); count++;
  if(r=="level_buzu"){ toast("等级不够,结束"); break; }
  sleep(2500);
}
toast("共处理"+count+"家,结束");


