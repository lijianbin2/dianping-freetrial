// V5 2026-09-13: 首页直达、无需翻页，卡片动态变但“免费试”三字稳定，原地死磕
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
    try{var n=text(keys[i]).findOne(500)||desc(keys[i]).findOne(500);if(n){log("关弹窗:"+keys[i]);try{n.click();}catch(e){clickUpClickable(n);}sleep(500);}}catch(e){}
  }
}
function dumpKeys(){
  try{
    var all=className("android.widget.TextView").find();
    var hits=[];var n=0;
    for(var i=0;i<all.length;i++){
      try{var t=all[i].text()||"";if(!t)continue;
      if(t.indexOf("免费试")>=0){hits.push("【免费试】"+t+"@y="+all[i].bounds().centerY());n++;}
      else if(t.indexOf("免费")>=0||t.indexOf("霸王餐")>=0||t.indexOf("活动在线")>=0){hits.push(t+"@y="+all[i].bounds().centerY());}
      }catch(e){}
    }
    if(hits.length>0){log("屏上("+all.length+")免费相关:"+hits.join("|"));toast("看到免费试x"+n);}
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
function tryAllKw(tag){
  var e1=null;try{e1=text("免费试").findOne(1000);}catch(e){}
  if(e1&&tryOne(e1,tag+":exact免费试"))return true;
  var kws=["免费试","3万个活动在线","免费抽","霸王餐","免费试用"];
  for(var k=0;k<kws.length;k++){
    var tip=null;try{tip=textContains(kws[k]).findOne(800);}catch(e){}
    if(tip&&tryOne(tip,tag+":"+kws[k]))return true;
  }
  var d=null;try{d=descContains("免费试").findOne(700);}catch(e){}
  if(d&&tryOne(d,tag+":desc"))return true;
  return false;
}
function openMianFeiShi(){
  try{app.launch("com.dianping.v1");}catch(e){}
  toast("入口首页直达，无需翻页，盯住免费试三字");
  sleep(5000);closePopup();
  for(var s=0;s<10;s++){
    dumpKeys();
    if(tryAllKw("原地"+s)){toast("已打开免费试");return true;}
    sleep(1500);
    if(s==4||s==7)closePopup();
  }
  toast("还没中，回顶一次再原地找");
  swipe(device.width/2,device.height*0.28,device.width/2,device.height*0.75,500);
  sleep(1500);closePopup();dumpKeys();
  for(var t=0;t<3;t++){
    if(tryAllKw("回顶"+t)){toast("已打开免费试");return true;}
    sleep(1200);
  }
  toast("走坐标兜底(首页可见位置)");
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
