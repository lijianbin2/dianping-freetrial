// 大众点评 免费试 美食 打开 价值>100元 且 距离<20km 商家
// 验证设备: REDMI Turbo 4 Pro 1280x2772
// UIAutomator2 -> Hamibot: text不可点时点parent, 列表项父容器FrameLayout clickable=true
// 已验证: 本源食堂 刺身寿司拉面 单人套餐 列表18.8km/173元 详情19.4km/173元 符合条件
// 备选: 花崎居酒屋 19.3km/110元 同样符合
auto.waitFor();
try{device.wakeUpIfNeeded();}catch(e){}
toast("V8 start");
log("V8 start");
function clickTextParent(txt, timeout){
    timeout = timeout || 5000;
    var node = text(txt).findOne(timeout);
    if(!node) return false;
    var p = node.parent();
    if(p) p.click(); else node.click();
    sleep(1000); return true;
}
function clickXY(x,y){ var sx=device.width/1280, sy=device.height/2772; click(x*sx,y*sy); sleep(1000); }
function ensureMeishi(){
  if(!textContains("\u514d\u8d39\u8bd5").findOne(5000))throw new Error("need free page");
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
  log("free x"+ax.length);
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

ensureMeishi();
for(var i=0;i<2;i++){ swipe(device.width/2, device.height*0.3, device.width/2, device.height*0.8, 600); sleep(1200); }
var found=null;
for(var s=0;s<8;s++){
    found=tryOpenQualifiedOnce();
    if(found) break;
    swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700);
    sleep(1800);
}
if(found){ toast("已打开 价值"+found.val+"元 "+found.dist+"km"); }
else{
    toast("未自动匹配,走兜底坐标本源食堂");
    swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(2500);
    swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(2500);
    clickXY(640,1509);
}
if(textContains("我要报名").findOne(5000) || textContains("适用商户").findOne(3000)){ toast("已进入符合条件的商家详情"); }// --- 报名步骤(已验证 2026-09-13 本源食堂) ---
// 我要报名 clickable=true 可直接点
var wantBtn = text("我要报名").findOne(5000);
if(wantBtn){ wantBtn.click(); sleep(2000); }
// 确认报名 clickable=false 必须点parent
var qBtn = text("确认报名").findOne(8000);
if(qBtn){
  var qp = qBtn.parent();
  if(qp) qp.click(); else qBtn.click();
  sleep(2500);
}
// 验证: 已报名,看看其他活动 / 报名成功
if(textContains("已报名").findOne(3000) || textContains("报名成功").findOne(3000)){
  toast("报名成功");
} else {
  // 兜底坐标 1280x2772
  var sx=device.width/1280, sy=device.height/2772;
  click(640*sx,2558*sy); sleep(2000);
}
// 报名结果页点完成 返回详情
var doneBtn = text("完成").findOne(3000);
if(doneBtn){ doneBtn.click(); sleep(2000); }
