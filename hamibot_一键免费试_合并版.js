// V4 2026-09-13 fix: homepage auto-scroll misses entry
// fix: wait settle + static 3x scan + back-to-top 2x + tiny 10pct steps + horiz swipe
auto.waitFor();
function clickUpClickable(node){
  var p=node;
  for(var i=0;i<5;i++){
    try{if(!p)break;if(p.clickable()){p.click();return true;}p=p.parent();}catch(e){break;}
  }
  return false;
}
function verifyIn(){
  return textContains("免费抽").findOne(2000)||text("免费试").findOne(2000)||textContains("高中奖率").findOne(2000)||textContains("免费试用").findOne(2000)||textContains("霸王餐").findOne(2000);
}
function closePopup(){
  var keys=["跳过","关闭","以后再说","我知道了","取消","知道了"];
  for(var i=0;i<keys.length;i++){
    try{var n=text(keys[i]).findOne(600)||desc(keys[i]).findOne(600);if(n){log("关弹窗:"+keys[i]);try{n.click();}catch(e){clickUpClickable(n);}sleep(600);}}catch(e){}
  }
}
function dumpKeys(){
  try{
    var all=className("android.widget.TextView").find();
    var hits=[];var sample=[];
    for(var i=0;i<all.length;i++){
      try{var t=all[i].text()||"";if(sample.length<8&&t)sample.push(t.slice(0,8));
      if(t.indexOf("免费")>=0||t.indexOf("霸王餐")>=0||t.indexOf("0元")>=0||t.indexOf("活动在线")>=0||t.indexOf("试用")>=0){hits.push(t+"@"+all[i].bounds().centerY());}}catch(e){}
    }
    if(hits.length>0){log("免费相关:"+hits.join("|"));toast("看到:"+hits.length+"个");}
    else{log("无免费词,TextView="+all.length+" 前8:"+sample.join(","));}
  }catch(e){log("dump失败:"+e);}
}
function tryKw(kw){
  var tip=null;try{tip=textContains(kw).findOne(1200);}catch(e){}
  if(tip){
    try{var b=tip.bounds();log("命中:"+kw+" y="+b.centerY());}catch(e){log("命中:"+kw);}
    if(clickUpClickable(tip)){sleep(3000);if(verifyIn())return true;}
    try{var b2=tip.bounds();click(b2.centerX(),b2.centerY());sleep(3000);if(verifyIn())return true;}catch(e){}
  }
  var d=null;try{d=descContains(kw).findOne(700);}catch(e){}
  if(d){if(clickUpClickable(d)){sleep(3000);if(verifyIn())return true;}}
  return false;
}
function tryAllKw(tag){
  var kws=["免费试","3万个活动在线","免费抽","霸王餐","免费试用"];
  for(var k=0;k<kws.length;k++){if(tryKw(kws[k])){toast("已打开免费试:"+tag);return true;}}
  return false;
}
function backToTop(){
  for(var i=0;i<2;i++){
    swipe(device.width/2,device.height*0.28,device.width/2,device.height*0.75,500);
    sleep(1500);closePopup();
  }
}
function openMianFeiShi(){
  try{app.launch("com.dianping.v1");}catch(e){}
  toast("不要手动滑,脚本在找免费试");
  sleep(6000);closePopup();
  dumpKeys();
  for(var s=0;s<3;s++){if(tryAllKw("原地"+s))return true;sleep(1500);if(s<2)dumpKeys();}
  backToTop();dumpKeys();
  if(tryAllKw("回顶"))return true;
  for(var r=0;r<7;r++){
    swipe(device.width/2,device.height*0.52,device.width/2,device.height*0.42,450);
    sleep(1600);closePopup();dumpKeys();
    if(tryAllKw("小步"+r))return true;
  }
  backToTop();
  var gy=Math.floor(device.height*0.38);
  for(var h=0;h<2;h++){
    swipe(device.width*0.8,gy,device.width*0.2,gy,450);
    sleep(1500);dumpKeys();
    if(tryAllKw("横滑"+h))return true;
  }
  backToTop();
  toast("关键词没中,走坐标");
  var x=Math.floor(device.width*956/1280),y=Math.floor(device.height*1102/2772);
  click(x,y);sleep(3000);
  if(verifyIn()){toast("已打开免费试");return true;}
  try{
    var my=text("我的").findOne(2000);
    if(my){clickUpClickable(my);sleep(2500);dumpKeys();if(tryAllKw("我的页"))return true;
      var home=text("首页").findOne(2000);if(home)clickUpClickable(home);sleep(2000);}
  }catch(e){log(e);}
  try{
    var s=text("搜索").findOne(3000)||desc("搜索").findOne(3000);
    if(s){s.click();sleep(1500);
      var input=className("android.widget.EditText").findOne(3000);
      if(input){input.setText("免费试");sleep(1000);
        var btn=text("搜索").findOne(2000);if(btn)btn.click();sleep(3000);
        if(verifyIn()){toast("已打开免费试");return true;}}}
  }catch(e){log(e);}
  toast("没找到入口,看log免费相关");
  return false;
}
openMianFeiShi();
function ensureMeishi(){
  if(!textContains("免费试").findOne(5000)) throw new Error("请先进入免费试页");
  if(text("美食").findOne(2000)){ toast("已在美食分类"); return; }
  var c=text("全部分类").findOne(5000);
  if(c){ try{ c.parent().click(); }catch(e){ c.click(); } } else { clickXY(481,368); }
  sleep(1200);
  var m=text("美食").findOne(5000);
  if(!m) throw new Error("没找到美食分类");
  try{ m.parent().click(); }catch(e){ clickXY(640,634); }
  sleep(1500);
  toast("已切换到美食分类");
}
function tryOpenQualifiedOnce(){
  var tvs=className("android.widget.TextView").find();
  var items={};
  tvs.forEach(function(o){
    try{ var b=o.bounds(); var key=Math.floor(b.top/280); if(!items[key]) items[key]=[]; items[key].push({t:(o.text()||""), top:b.top, obj:o}); }catch(e){}
  });
  var keys=Object.keys(items).sort(function(a,b){return a-b;});
  for(var i=0;i<keys.length;i++){
    var arr=items[keys[i]]; var joined=""; for(var j=0;j<arr.length;j++) joined+=arr[j].t+" ";
    var vM=joined.match(/价值\s*([0-9\s]+)\s*元/); var dM=joined.match(/([0-9]+(\.[0-9]+)?)\s*km/);
    if(vM && dM){
      var val=parseInt(vM[1].replace(/\s+/g,""),10); var dist=parseFloat(dM[1]);
      if(val>100 && dist<20){
        var anchor=arr.sort(function(a,b){return (b.t||"").length-(a.t||"").length;})[0].obj;
        var p=anchor; for(var k=0;k<4;k++){ try{ if(p.clickable()) break; p=p.parent(); }catch(e){break;} }
        try{ p.click(); }catch(e){ anchor.parent().click(); }
        sleep(2500); return {val:val, dist:dist, text:joined};
      }
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
  if(textContains("仅 Lv6").findOne(2000) || textContains("等级不够").findOne(2000) || textContains("暂未满足").findOne(2000) || textContains("橙V").findOne(2000)){
    return "level_buzu";
  }
  var done=text("完成").findOne(3000);
  if(done){ done.click(); sleep(2000); }
  back(); sleep(1500);
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
  sleep(1500);
}
toast("共处理"+count+"家,结束");

