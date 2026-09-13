// 大众点评 免费试 美食 打开 价值>100元 且 距离<20km 商家
// 验证设备: REDMI Turbo 4 Pro 1280x2772
// UIAutomator2 -> Hamibot: text不可点时点parent, 列表项父容器FrameLayout clickable=true
// 已验证: 本源食堂 刺身寿司拉面 单人套餐 列表18.8km/173元 详情19.4km/173元 符合条件
// 备选: 花崎居酒屋 19.3km/110元 同样符合
auto.waitFor();
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
    if(!textContains("免费试").findOne(5000)) throw new Error("请先进入免费试页");
    if(!text("美食").findOne(2000)){
        try{ clickTextParent("全部分类",5000); }catch(e){ clickXY(481,368); }
        sleep(1200);
        var m = text("美食").findOne(5000);
        if(!m) throw new Error("没找到美食分类");
        try{ m.parent().click(); }catch(e){ clickXY(640,634); }
        sleep(1500);
    }
    toast("已在美食分类");
}
function tryOpenQualifiedOnce(){
    var tvs = className("android.widget.TextView").find();
    var items = {};
    tvs.forEach(function(o){
        try{
            var b=o.bounds(); var top=b.top;
            var key=Math.floor(top/280);
            if(!items[key]) items[key]=[];
            items[key].push({t:(o.text()||""), top:top, obj:o});
        }catch(e){}
    });
    var keys = Object.keys(items).sort(function(a,b){return a-b;});
    for(var i=0;i<keys.length;i++){
        var arr=items[keys[i]];
        var joined=""; for(var j=0;j<arr.length;j++) joined+=arr[j].t+" ";
        var vMatch=joined.match(/价值\s*([0-9\s]+)\s*元/);
        var dMatch=joined.match(/([0-9]+(\.[0-9]+)?)\s*km/);
        if(vMatch && dMatch){
            var val=parseInt(vMatch[1].replace(/\s+/g,""),10);
            var dist=parseFloat(dMatch[1]);
            if(val>100 && dist<20){
                var anchor=arr.sort(function(a,b){return (b.t||"").length-(a.t||"").length;})[0].obj;
                var p=anchor;
                for(var k=0;k<4;k++){ try{ if(p.clickable()) break; p=p.parent(); }catch(e){break;} }
                try{ p.click(); }catch(e){ anchor.parent().click(); }
                sleep(2500);
                return {val:val, dist:dist, text:joined};
            }
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
    swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(1500);
    swipe(device.width/2, device.height*0.75, device.width/2, device.height*0.30, 700); sleep(1500);
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
