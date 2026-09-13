// V6 2026-09-13: 右卡=入口(免费试 2万个活动在线).标题是图片无文本节点,盯活动在线整卡
auto.waitFor();
function clickUpClickable(node){
  var p=node;
  for(var i=0;i<6;i++){
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
    sleep(1500);
    if(s==4||s==7)closePopup();
  }
  toast("还没中,回顶一次再找整卡");
  swipe(device.width/2,device.height*0.28,device.width/2,device.height*0.75,500);
  sleep(1500);closePopup();dumpKeys();
  for(var t=0;t<3;t++){
    if(tryAllKw("回顶"+t)){toast("已打开免费试");return true;}
    sleep(1200);
  }
  toast("走坐标:先点图片再点整卡");
  if(tapScale(744,1014,"ImageView免费试")){toast("已打开免费试");return true;}
  if(tapScale(956,1102,"右卡中心")){toast("已打开免费试");return true;}
  try{
    var my=text("我的").findOne(2000);
    if(my){clickUpClickable(my);sleep(2500);dumpKeys();if(tryAllKw("我的页"))return true;
      var home=text("首页").findOne(2000);if(home)clickUpClickable(home);sleep(2000);}
  }catch(e){log(e);}
  toast("没找到入口,看log活动在线");
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

