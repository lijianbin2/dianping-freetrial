// V12 2026-09-13: 手动进入免费试列表页后开始,不再找首页入口. 起手ensureMeishi,严校验.
auto.waitFor();
try{device.wakeUpIfNeeded();}catch(e){}
var LOG_CANDS=["/sdcard/hamibot_free_log.txt","./hamibot_free_log.txt","/sdcard/Download/hamibot_free_log.txt"];
var LOG_PATH="/sdcard/hamibot_free_log.txt";
var LOG_OK="";
for(var _li=0;_li<LOG_CANDS.length;_li++){try{files.write(LOG_CANDS[_li],"=== V12 start "+new Date().toLocaleString()+" ==="+"\n");LOG_PATH=LOG_CANDS[_li];LOG_OK=LOG_PATH;break;}catch(_le){}}
var _origLog=log;
log=function(m){try{_origLog(m);}catch(e){}try{if(LOG_OK)files.append(LOG_OK,"\n"+new Date().toLocaleTimeString()+" "+m);}catch(e2){}};
toast("V12 start log:"+LOG_OK);
log("V12 start log:"+LOG_OK);
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
    try{var _act="";try{_act=currentActivity();}catch(e){}log("pkg="+currentPackage()+" act="+_act);}catch(e){}
    if(hits.length>0){log("屏上("+all.length+")免费相关:"+hits.join("|"));toast("活动在线x"+n);}
    else{var _s=[];for(var _j=0;_j<Math.min(all.length,15);_j++){try{var _tt=all[_j].text()||"";if(_tt)_s.push(_tt.slice(0,12));}catch(e){}}log("无免费词,TextView="+all.length+" top15="+_s.join("/"));}
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
  toast("launch dzdp");log("launch dzdp");var _ok=false;for(var _r=0;_r<3;_r++){try{app.launch("com.dianping.v1");}catch(e){log("launch err:"+e);}try{app.launchApp("大众点评");}catch(e){}sleep(3500);var _pkg="";try{_pkg=currentPackage();}catch(e){}log("launch try"+_r+" pkg="+_pkg);toast("launch try"+_r+" "+_pkg);if(_pkg=="com.dianping.v1"){_ok=true;break;}}if(!_ok){toast("自动启动被拦:请手动打开大众点评首页");log("LAUNCH FAIL,stay="+currentPackage()+",等手动打开30s");for(var _m=0;_m<30;_m++){sleep(1000);var _mp="";try{_mp=currentPackage();}catch(e){}if(_m%5==0){log("等手动打开"+_m+"s pkg="+_mp);toast("等点评:"+_m+"s "+_mp);}if(_mp=="com.dianping.v1"){_ok=true;toast("看到点评了,继续");break;}}if(!_ok){toast("还没看到点评,先停");log("MANUAL WAIT FAIL");return false;}}
  toast("点右卡:免费试 2万个活动在线");
  toast("wait dzdp");for(var _w=0;_w<5;_w++){sleep(1000);log("wait"+_w);}closePopup();toast("wait done");
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

function inFreeList(){try{if(textContains(String.fromCharCode(20813,36153,25277)).findOnce())return true;}catch(e){}try{if(textContains(String.fromCharCode(20840,37096,20998,31899)).findOnce())return true;}catch(e){}try{if(textContains(String.fromCharCode(26234,33021,25490,24207)).findOnce())return true;}catch(e){}try{if(textContains(String.fromCharCode(20813,36153,35797)).findOnce())return true;}catch(e){}return false;}function isMeishiTab(){if(!inFreeList())return false;
  try{
    var hasMei=text("\u7f8e\u98df").findOnce()!=null;
    var hasQuan=text("\u5168\u90e8\u5206\u7c7b").findOnce()!=null;
    log("tab check mei="+hasMei+" quan="+hasQuan);
    if(hasMei&&!hasQuan)return true;
  }catch(e){}
  return false;
}
function ensureMeishi(){
  if(!textContains("\u514d\u8d39\u8bd5").findOne(2000)){toast("in free list,switch meishi");log("in free list,switch meishi");}
  if(isMeishiTab()){toast("in meishi");return true;}
  for(var r=0;r<5;r++){
    toast("switch meishi try "+r);log("switch meishi try "+r);
    var c=null;try{c=text("\u5168\u90e8\u5206\u7c7b").findOne(1500);}catch(e){}
    if(c){try{var cb=c.bounds();log("tap quanfenlei "+cb.centerX()+","+cb.centerY());click(cb.centerX(),cb.centerY());}catch(e){try{c.click();}catch(e2){}}}
    else{log("no quanfenlei,tap 481,1529");var sx=device.width/1280,sy=device.height/2772;click(481*sx,1529*sy);}
    sleep(2500);
    var cands=null;try{cands=text("\u7f8e\u98df").find();}catch(e){}try{var dd=descContains("\u7f8e\u98df").find();if(dd&&dd.length>0){var tmp=[];for(var di=0;di<cands.length;di++)tmp.push(cands[di]);for(var dj=0;dj<dd.length;dj++)tmp.push(dd[dj]);cands=tmp;}}catch(e){}log("meishi cands="+(cands?cands.length:0));
    if(cands&&cands.length>0){
      try{cands.sort(function(a,b){return a.bounds().centerY()-b.bounds().centerY();});}catch(e){}
      for(var mi=0;mi<cands.length;mi++){
        try{var m=cands[mi];log("meishi cand y="+m.bounds().centerY());try{var mb=m.bounds();click(mb.centerX(),mb.centerY());}catch(e2){try{m.click();}catch(e3){}}}catch(e){}
        sleep(3000);
        if(isMeishiTab()){toast("to meishi ok");return true;}if(!inFreeList()){back();sleep(2500);}
      }
    }
  }
  toast("not in meishi");log("not in meishi after 5 tries");return false;
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
    if(val<0){try{var vm2=joined.match(/\u4ef7\u503c([\s\S]{1,12}?)\u5143/);if(vm2){var digits=vm2[1].replace(/\D/g,"");if(digits.length>0)val=parseInt(digits,10);}}catch(e){}}
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
  log("doBaoMing start pkg="+currentPackage());
  var want=text("我要报名").findOne(6000);
  if(!want){
    log("doBaoMing: no 我要报名,back");
    try{var w2=textContains("我要报名").findOne(2000); if(w2){log("found contains version"); clickUpClickable(w2);} else { back(); sleep(2000); return "no_entry"; }}catch(e){ back(); sleep(2000); return "no_entry"; }
  } else {
    log("doBaoMing: click 我要报名");
    if(!clickUpClickable(want)){ try{want.click();}catch(e){ try{var wb=want.bounds(); click(wb.centerX(),wb.centerY());}catch(e2){} } }
    sleep(3000);
  }
  var q=text("确认报名").findOne(8000);
  if(!q){ try{q=textContains("确认报名").findOne(2000);}catch(e){} }
  if(q){
    try{log("doBaoMing: click 确认报名 y="+q.bounds().centerY());}catch(e){log("doBaoMing: click 确认报名");}
    if(!clickUpClickable(q)){ try{q.click();}catch(e){ try{var qb=q.bounds(); click(qb.centerX(),qb.centerY());}catch(e2){} } }
    sleep(3500);
  } else {
    log("doBaoMing: NO 确认报名,不盲点底部坐标,直接back防误点橙V");
    toast("没找到确认报名,回退防误点");
    back(); sleep(2500); return "no_confirm";
  }
  if(textContains("仅 Lv6").findOnce()||textContains("仅限 Lv").findOnce()||textContains("等级不够").findOnce()||textContains("暂未满足").findOnce()||textContains("当前等级").findOnce()){
    log("doBaoMing: level_buzu true"); return "level_buzu";
  }
  log("doBaoMing: no level block,找完成");
  var done=text("完成").findOne(4000);
  if(done){ log("doBaoMing: click 完成"); try{done.click();}catch(e){clickUpClickable(done);} sleep(2000); }
  else { log("doBaoMing: no 完成"); }
  back(); sleep(2500);
  try{ if(!textContains("免费抽").findOnce()&&!textContains("免费试").findOnce()){ log("doBaoMing: 再back一次回列表"); back(); sleep(2500); } }catch(e){}
  log("doBaoMing ok"); return "ok";
}
toast("V12:请确认已在免费试列表页");log("V12 wait in free list");var _inFree=false;for(var _wf=0;_wf<30;_wf++){try{if(textContains("免费抽").findOnce()||textContains("全部分类").findOnce()||textContains("智能排序").findOnce()){_inFree=true;break;}}catch(e){}sleep(1000);if(_wf%5==0){toast("等免费试列表 "+_wf+"s");log("wait free list "+_wf+"s pkg="+currentPackage());}}toast("inFree="+_inFree);log("inFree="+_inFree);if(!_inFree){toast("没看到免费试列表,先停");log("NOT IN FREE LIST,exit");exit();}
if(!ensureMeishi()){toast("no meishi,exit");exit();}
for(var i=0;i<2;i++){ swipe(device.width/2, device.height*0.3, device.width/2, device.height*0.8, 600); sleep(1200); }
var count=0;
while(true){
  var found=null;
  for(var s=0;s<8;s++){ found=tryOpenQualifiedOnce(); if(found) break; swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(1800); }
  if(!found){ toast("没找到更多符合商家,结束"); break; }
  toast("已打开 价值"+found.val+"元 "+found.dist+"km");
  log("open done v="+found.val+" d="+found.dist+" call doBaoMing"); var r=doBaoMing(); log("doBaoMing ret="+r); count++;
  if(r=="level_buzu"){ toast("等级不够,结束"); break; }
  sleep(2500);
}
toast("共处理"+count+"家,结束");






