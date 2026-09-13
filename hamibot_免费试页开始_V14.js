// V14 2026-09-13 minimal: 手动进入免费试列表页后开始,不再找首页入口. 起手ensureMeishi,严校验.
auto.waitFor();
try{device.wakeUpIfNeeded();}catch(e){}
var LOG_CANDS=["/sdcard/hamibot_free_log.txt","./hamibot_free_log.txt","/sdcard/Download/hamibot_free_log.txt"];
var LOG_PATH="/sdcard/hamibot_free_log.txt";
var LOG_OK="";
for(var _li=0;_li<LOG_CANDS.length;_li++){try{files.write(LOG_CANDS[_li],"=== V13 start "+new Date().toLocaleString()+" ==="+"\n");LOG_PATH=LOG_CANDS[_li];LOG_OK=LOG_PATH;break;}catch(_le){}}
var _origLog=log;
log=function(m){try{_origLog(m);}catch(e){}try{if(LOG_OK)files.append(LOG_OK,"\n"+new Date().toLocaleTimeString()+" "+m);}catch(e2){}};
toast("V13 start log:"+LOG_OK);
log("V13 start log:"+LOG_OK);
function clickUpClickable(node){
  var p=node;
  for(var i=0;i<6;i++){
    try{if(!p)break;if(p.clickable()){p.click();return true;}p=p.parent();}catch(e){break;}
  }
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
  if(isMeishiTab()){toast("in meishi");return true;}
  for(var r=0;r<2;r++){
    toast("switch meishi try "+r);log("switch meishi try "+r);
    var c=null;try{c=text("全部分类").findOne(1500);}catch(e){}
    if(c){try{var cb=c.bounds();log("tap quanfenlei "+cb.centerX()+","+cb.centerY());click(cb.centerX(),cb.centerY());}catch(e){try{c.click();}catch(e2){}}}
    else{log("no quanfenlei,tap 481,1529");var sx=device.width/1280,sy=device.height/2772;click(481*sx,1529*sy);}
    sleep(2500);
    var raw=null;try{raw=text("美食").find();}catch(e){}
    var H=device.height;var list=[];
    try{for(var i=0;i<raw.length;i++){try{var y=raw[i].bounds().centerY();if(y>H*0.35)list.push(raw[i]);else{log("skip top meishi y="+y);}}catch(e){}}}catch(e){}
    try{var dd=descContains("美食").find();if(dd){for(var j=0;j<dd.length;j++){try{var y2=dd[j].bounds().centerY();if(y2>H*0.35)list.push(dd[j]);}catch(e){}}}}catch(e){}
    log("meishi popup cands="+list.length);
    if(list.length==0){log("no popup meishi,retry");sleep(1500);continue;}
    try{list.sort(function(a,b){return a.bounds().centerY()-b.bounds().centerY();});}catch(e){}
    for(var mi=0;mi<list.length;mi++){
      try{var m=list[mi];log("tap popup meishi y="+m.bounds().centerY());try{var mb=m.bounds();click(mb.centerX(),mb.centerY());}catch(e2){try{m.click();}catch(e3){}}}catch(e){}
      sleep(3000);
      if(isMeishiTab()){toast("to meishi ok");return true;}
      if(!inFreeList()){toast("jumped out,stop");log("jumped out of free list,stop no back");return false;}
    }
  }
  toast("not in meishi");log("not in meishi after 2 tries");return false;
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
  
  log("doBaoMing ok"); return "ok";
}
toast("V13:请确认已在免费试列表页");log("V13 wait in free list");var _inFree=false;for(var _wf=0;_wf<30;_wf++){try{if(textContains("免费抽").findOnce()||textContains("全部分类").findOnce()||textContains("智能排序").findOnce()){_inFree=true;break;}}catch(e){}sleep(1000);if(_wf%5==0){toast("等免费试列表 "+_wf+"s");log("wait free list "+_wf+"s pkg="+currentPackage());}}toast("inFree="+_inFree);log("inFree="+_inFree);if(!_inFree){toast("没看到免费试列表,先停");log("NOT IN FREE LIST,exit");exit();}
if(!ensureMeishi()){toast("no meishi,exit");exit();}

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






