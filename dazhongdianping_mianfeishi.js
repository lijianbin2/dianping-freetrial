// 大众点评 - 打开首页「免费试」卡片 (V3 2026-09-13)
// V2问题: 进首页后自动下翻, 错过顶部卡片, 关键词单一
// V3: 先关弹窗 + 打印含"免费"文本方便定位 + 小幅度双向扫描 + 我的页/搜索兜底
auto.waitFor();

function clickUpClickable(node){
  var p = node;
  for(var i=0;i<5;i++){
    try{ if(!p) break; if(p.clickable()){ p.click(); return true; } p=p.parent(); }catch(e){ break; }
  }
  return false;
}
function verifyInMianFeiShi(){
  return textContains("免费抽").findOne(2000) || text("免费试").findOne(2000) || textContains("高中奖率").findOne(2000) || textContains("免费试用").findOne(2000) || textContains("霸王餐").findOne(2000);
}
function closePopup(){
  var keys=["跳过","关闭","以后再说","我知道了","取消","X","x","知道了"];
  for(var i=0;i<keys.length;i++){
    try{
      var n=text(keys[i]).findOne(800) || desc(keys[i]).findOne(800);
      if(n){ log("关弹窗:"+keys[i]); try{ n.click(); }catch(e){ clickUpClickable(n); } sleep(800); }
    }catch(e){}
  }
}
function dumpFreeKeys(){
  try{
    var all=className("android.widget.TextView").find();
    var hits=[];
    for(var i=0;i<all.length && hits.length<20;i++){
      try{ var t=all[i].text()||""; if(t.indexOf("免费")>=0||t.indexOf("霸王餐")>=0||t.indexOf("0元")>=0||t.indexOf("活动在线")>=0){ hits.push(t); } }catch(e){}
    }
    if(hits.length>0){ log("屏上免费相关:"+hits.join("|")); toast("看到:"+hits.slice(0,2).join(",")); }
    else { log("屏上无免费关键词,总数TextView="+all.length); }
  }catch(e){ log("dump失败:"+e); }
}
function tryClickKw(kw){
  var tip=textContains(kw).findOne(1500);
  if(tip){
    log("命中:"+kw);
    if(clickUpClickable(tip)){ sleep(3000); if(verifyInMianFeiShi()) return true; }
    try{ var b=tip.bounds(); click(b.centerX(),b.centerY()); sleep(3000); if(verifyInMianFeiShi()) return true; }catch(e){}
  }
  var d=null;
  try{ d=descContains(kw).findOne(800); }catch(e){}
  if(d){ if(clickUpClickable(d)){ sleep(3000); if(verifyInMianFeiShi()) return true; } }
  return false;
}

function openMianFeiShi(){
  try{ app.launch("com.dianping.v1"); }catch(e){}
  sleep(4000);
  closePopup();

  var keywords=["免费试","3万个活动在线","免费抽","霸王餐","免费试用"];
  // 0. 原地先扫一遍, 不乱滑
  dumpFreeKeys();
  for(var k=0;k<keywords.length;k++){ if(tryClickKw(keywords[k])){ toast("已打开免费试"); return true; } }

  // 1. 回到顶部 (下拉一次即可, 别翻过头)
  swipe(device.width/2, device.height*0.25, device.width/2, device.height*0.75, 500);
  sleep(1500); closePopup(); dumpFreeKeys();
  for(var k2=0;k2<keywords.length;k2++){ if(tryClickKw(keywords[k2])){ toast("已打开免费试"); return true; } }

  // 2. 小步下翻找卡片 (原来0.7->0.3步太大, 改0.6->0.4, 5次)
  for(var r=0;r<5;r++){
    swipe(device.width/2, device.height*0.6, device.width/2, device.height*0.4, 500);
    sleep(1500); dumpFreeKeys();
    for(var k3=0;k3<keywords.length;k3++){ if(tryClickKw(keywords[k3])){ toast("已打开免费试"); return true; } }
  }

  // 3. 回顶后坐标兜底
  toast("关键词没点中,回顶走坐标");
  swipe(device.width/2, device.height*0.25, device.width/2, device.height*0.75, 500);
  sleep(1500);
  var x=Math.floor(device.width*956/1280), y=Math.floor(device.height*1102/2772);
  click(x,y); sleep(3000);
  if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; }

  // 4a. 我的页兜底 (免费试常在我的资产里)
  try{
    var my=text("我的").findOne(2000);
    if(my){ clickUpClickable(my); sleep(2500); dumpFreeKeys();
      for(var k4=0;k4<keywords.length;k4++){ if(tryClickKw(keywords[k4])){ toast("已打开免费试"); return true; } }
      // 回首页
      var home=text("首页").findOne(2000); if(home) clickUpClickable(home); sleep(2000);
    }
  }catch(e){ log(e); }

  // 4b. 搜索兜底
  try{
    var s=text("搜索").findOne(3000)||desc("搜索").findOne(3000);
    if(s){ s.click(); sleep(1500);
      var input=className("android.widget.EditText").findOne(3000);
      if(input){ input.setText("免费试"); sleep(1000);
        var btn=text("搜索").findOne(2000); if(btn) btn.click(); sleep(3000);
        if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; }
      }
    }
  }catch(e){ log(e); }

  toast("没找到免费试入口,看log里屏上免费相关");
  return false;
}
openMianFeiShi();
