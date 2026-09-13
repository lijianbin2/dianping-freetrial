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
