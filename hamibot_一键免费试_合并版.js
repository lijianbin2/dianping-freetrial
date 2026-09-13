// 大众点评免费试 美食 一键版 (Hamibot直接粘贴运行)
// 流程: 启动大众点评 -> 打开免费试 -> 切美食 -> 循环: 价值>100且<20km -> 我要报名 -> 确认报名 -> 完成 -> 下一家, 遇到等级不够结束
// 基准分辨率 1280x2772, 已验证 REDMI Turbo 4 Pro
"ui";
auto.waitFor();
function clickXY(x,y){ var sx=device.width/1280, sy=device.height/2772; click(x*sx,y*sy); sleep(1000); }
function openMianFeiShi(){
  try{ app.launch("com.dianping.v1"); }catch(e){}
  sleep(3000);
  var tip = text("3\u4e07\u4e2a\u6d3b\u52a8\u5728\u7ebf").findOne(8000);
  if(!tip){
    swipe(device.width/2, device.height*0.7, device.width/2, device.height*0.3, 500);
    tip = text("3\u4e07\u4e2a\u6d3b\u52a8\u5728\u7ebf").findOne(5000);
  }
  if(!tip){ var x=Math.floor(device.width*956/1280), y=Math.floor(device.height*1102/2772); click(x,y); sleep(3000); return true; }
  try{
    var p1=tip.parent(), p2=p1?p1.parent():null;
    if(p2 && p2.clickable()){ p2.click(); sleep(3000); return true; }
    if(p1 && p1.clickable()){ p1.click(); sleep(3000); return true; }
  }catch(e){ log(e); }
  var b=tip.bounds(); click(b.centerX(), b.centerY()); sleep(3000); return true;
}
function ensureMeishi(){
  if(!textContains("\u514d\u8d39\u8bd5").findOne(5000)) throw new Error("请先进入免费试页");
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
