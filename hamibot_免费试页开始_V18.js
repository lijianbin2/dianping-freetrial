// V18 2026-09-13 minimal: 手动进入免费试列表页后开始,不再找首页入口. 起手ensureMeishi,严校验.
toast("V18 start");auto.waitFor();toast("V18 auto ok");
try{device.wakeUpIfNeeded();}catch(e){}
var LOG_CANDS=["/sdcard/hamibot_free_log.txt","./hamibot_free_log.txt","/sdcard/Download/hamibot_free_log.txt"];
var LOG_PATH="/sdcard/hamibot_free_log.txt";
var LOG_OK="";
for(var _li=0;_li<LOG_CANDS.length;_li++){try{files.write(LOG_CANDS[_li],"=== V18 start "+new Date().toLocaleString()+" ==="+"\n");LOG_PATH=LOG_CANDS[_li];LOG_OK=LOG_PATH;break;}catch(_le){}}
var _origLog=null;try{_origLog=log;}catch(_e0){}
function L(m){try{if(_origLog)_origLog(m);}catch(_e1){}try{if(LOG_OK)files.append(LOG_OK,"\n"+new Date().toLocaleTimeString()+" "+m);}catch(_e2){}}
toast("V18 start log:"+LOG_OK);
L("V18 start log:"+LOG_OK);
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
    L("tab check mei="+hasMei+" quan="+hasQuan);
    if(hasMei&&!hasQuan)return true;
  }catch(e){}
  return false;
}
function ensureMeishi(){
  if(isMeishiTab()){toast("in meishi");return true;}
  for(var r=0;r<3;r++){
    toast("switch meishi try "+r);L("switch meishi try "+r);
    var list=[];
    try{var raw=text("美食").find();if(raw){for(var i=0;i<raw.length;i++)list.push(raw[i]);}}catch(e){}
    try{var dd=descContains("美食").find();if(dd){for(var j=0;j<dd.length;j++)list.push(dd[j]);}}catch(e){}
    if(list.length==0){
      L("popup closed, tap quanfenlei tab");
      var qs=null;try{qs=text("全部分类").find();}catch(e){}
      if(qs&&qs.length>0){
        try{qs.sort(function(x,y){return x.bounds().centerY()-y.bounds().centerY();});}catch(e){}
        try{var q0=qs[0];L("tap quanfenlei y="+q0.bounds().centerY());try{var qb=q0.bounds();click(qb.centerX(),qb.centerY());}catch(e2){try{q0.click();}catch(e3){}}}catch(e){}
      } else { L("no quanfenlei text, tap 481,1529"); var sx=device.width/1280,sy=device.height/2772; click(481*sx,1529*sy); }
      sleep(2500);
      list=[];
      try{var raw2=text("美食").find();if(raw2){for(var k=0;k<raw2.length;k++)list.push(raw2[k]);}}catch(e){}
      try{var dd2=descContains("美食").find();if(dd2){for(var l=0;l<dd2.length;l++)list.push(dd2[l]);}}catch(e){}
    }
    L("meishi cands="+list.length);
    if(list.length==0){L("no meishi, retry");sleep(1500);continue;}
    try{list.sort(function(x,y){return y.bounds().centerY()-x.bounds().centerY();});}catch(e){}
    for(var mi=0;mi<list.length;mi++){
      try{var m=list[mi];L("tap meishi y="+m.bounds().centerY());try{var mb=m.bounds();click(mb.centerX(),mb.centerY());}catch(e2){try{m.click();}catch(e3){}}}catch(e){}
      sleep(3000);
      if(isMeishiTab()){toast("to meishi ok");return true;}
      if(!inFreeList()){toast("jumped out,stop");L("jumped out, stop no back");return false;}
    }
  }
  toast("not in meishi");L("not in meishi after 3 tries");return false;
}
function tryOpenQualifiedOnce(){
  var tvs=className("android.widget.TextView").find();
  var all=[];
  for(var i=0;i<tvs.length;i++){try{var o=tvs[i];var b=o.bounds();all.push({t:o.text()||"",top:b.top,cy:b.centerY(),obj:o});}catch(e){}}
  var ax=[];
  for(var i=0;i<all.length;i++){if(all[i].t.indexOf("\u514d\u8d39\u62bd")>=0)ax.push(all[i]);}
  L("free x"+ax.length);toast("扫卡 free x"+ax.length);
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
    L("cand"+a+":v"+val+"d"+dist);
    if(val>100&&dist>=0&&dist<20){
      L("hit"+val+"yuan"+dist+"km");
      var opened=false;
      var p=ax[a].obj;
      for(var k=0;k<6;k++){try{if(!p)break;if(p.clickable()){p.click();opened=true;break;}p=p.parent();}catch(e){break;}}
      if(!opened){try{var b2=ax[a].obj.bounds();click(b2.centerX(),b2.centerY());opened=true;}catch(e){}}
      sleep(2500);
      if(inFreeList()){L("open fail still in list, try next");continue;}
      return{val:val,dist:dist,text:clean};
    }
  }
  return null;
}

function guardBack(tag){if(inFreeList()){L(tag+": still in free list,skip back");return true;}back();sleep(2500);if(inFreeList()){L(tag+": back to list ok");return true;}L(tag+": 2nd back");back();sleep(2500);var ok=inFreeList();L(tag+": after 2nd back inFree="+ok);return ok;}function doBaoMing(){
  L("doBaoMing start pkg="+currentPackage());
  var want=text("我要报名").findOne(6000);
  if(!want){
    L("doBaoMing: no 我要报名,back");
    try{var w2=textContains("我要报名").findOne(2000); if(w2){L("found contains version"); clickUpClickable(w2);} else { if(inFreeList()){L("tap missed,NO back");return "no_entry";} if(!guardBack("no_entry"))return "lost"; return "no_entry"; }}catch(e){ if(inFreeList()){L("tap missed,NO back");return "no_entry";} if(!guardBack("no_entry"))return "lost"; return "no_entry"; }
  } else {
    L("doBaoMing: click 我要报名");
    if(!clickUpClickable(want)){ try{want.click();}catch(e){ try{var wb=want.bounds(); click(wb.centerX(),wb.centerY());}catch(e2){} } }
    sleep(3000);
  }
  var q=text("确认报名").findOne(8000);
  if(!q){ try{q=textContains("确认报名").findOne(2000);}catch(e){} }
  if(q){
    try{L("doBaoMing: click 确认报名 y="+q.bounds().centerY());}catch(e){L("doBaoMing: click 确认报名");}
    if(!clickUpClickable(q)){ try{q.click();}catch(e){ try{var qb=q.bounds(); click(qb.centerX(),qb.centerY());}catch(e2){} } }
    sleep(3500);
  } else {
    L("doBaoMing: NO 确认报名,不盲点底部坐标,直接back防误点橙V");
    toast("没找到确认报名,回退防误点");
    if(!guardBack("no_confirm"))return "lost"; return "no_confirm";
  }
  if(textContains("仅 Lv6").findOnce()||textContains("仅限 Lv").findOnce()||textContains("等级不够").findOnce()||textContains("暂未满足").findOnce()||textContains("当前等级").findOnce()){
    L("doBaoMing: level_buzu true"); return "level_buzu";
  }
  L("doBaoMing: no level block,找完成");
  var done=text("完成").findOne(4000);
  if(done){ L("doBaoMing: click 完成"); try{done.click();}catch(e){clickUpClickable(done);} sleep(2000); }
  else { L("doBaoMing: no 完成"); }
  if(!guardBack("done"))return "lost";
  
  L("doBaoMing ok"); return "ok";
}
toast("V18:请确认已在免费试列表页");L("V18 wait in free list");var _inFree=false;for(var _wf=0;_wf<30;_wf++){try{if(textContains("免费抽").findOnce()||textContains("全部分类").findOnce()||textContains("智能排序").findOnce()){_inFree=true;break;}}catch(e){}sleep(1000);if(_wf%5==0){toast("等免费试列表 "+_wf+"s");L("wait free list "+_wf+"s pkg="+currentPackage());}}toast("inFree="+_inFree);L("inFree="+_inFree);if(!_inFree){toast("没看到免费试列表,先停");L("NOT IN FREE LIST,exit");exit();}
if(!ensureMeishi()){toast("no meishi,exit");exit();}

var count=0;var failStreak=0;
while(true){
  var found=null;
  for(var s=0;s<8;s++){ found=tryOpenQualifiedOnce(); if(found) break; swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(1800); }
  if(!found){ toast("没找到更多符合商家,结束"); break; }
  toast("已打开 价值"+found.val+"元 "+found.dist+"km");
  L("open done v="+found.val+" d="+found.dist+" call doBaoMing"); var r=doBaoMing(); L("doBaoMing ret="+r); count++;
  if(r=="lost"){ toast("page lost,stop"); L("LOST,stop"); break; } if(r=="level_buzu"){ toast("等级不够,结束"); break; }
  if(r=="no_entry"||r=="no_confirm"){failStreak++;L("failStreak="+failStreak+" swipe past bad card");swipe(device.width/2,device.height*0.72,device.width/2,device.height*0.28,700);sleep(1800);if(failStreak>=3){swipe(device.width/2,device.height*0.75,device.width/2,device.height*0.25,800);sleep(1800);}}else{failStreak=0;}
  sleep(1500);
}
toast("共处理"+count+"家,结束");






