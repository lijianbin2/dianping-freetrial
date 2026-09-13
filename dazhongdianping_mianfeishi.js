// 大众点评 - 打开首页「免费试」卡片 (修复版 2026-09-13)
// 问题: 之前只认 text="3万个活动在线" 且只往上找2层, 首页没滑到顶就点不中
// 修复: 先回顶部 + 多关键词轮询 + 往上找4层可点击父容器 + 搜索框兜底
auto.waitFor();

function clickUpClickable(node){
  var p = node;
  for(var i=0;i<5;i++){
    try{
      if(!p) break;
      if(p.clickable()){ p.click(); return true; }
      p = p.parent();
    }catch(e){ break; }
  }
  return false;
}

function verifyInMianFeiShi(){
  return textContains("免费抽").findOne(2000) || text("免费试").findOne(2000) || textContains("高中奖率").findOne(2000) || textContains("免费试用").findOne(2000);
}

function openMianFeiShi(){
  try{ app.launch("com.dianping.v1"); }catch(e){}
  sleep(3500);

  // 0. 先回到顶部, 确保卡片在可视区 (首页下拉回顶)
  for(var t=0;t<2;t++){
    swipe(device.width/2, device.height*0.3, device.width/2, device.height*0.8, 600);
    sleep(1000);
  }

  var keywords = ["3万个活动在线", "免费试", "免费抽"];
  for(var round=0; round<4; round++){
    for(var k=0;k<keywords.length;k++){
      var kw = keywords[k];
      var tip = textContains(kw).findOne(2000);
      if(tip){
        log("找到关键词: "+kw);
        // 优先点上层可点击容器
        if(clickUpClickable(tip)){ sleep(3000); if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; } }
        // 兜底点文本中心
        try{ var b=tip.bounds(); click(b.centerX(), b.centerY()); sleep(3000); if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; } }catch(e){}
      }
      // desc 兜底
      var d = descContains(kw).findOne(1000);
      if(d){ if(clickUpClickable(d)){ sleep(3000); if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; } } }
    }
    // 没找到就往上滑找卡片
    if(round<3){
      swipe(device.width/2, device.height*0.7, device.width/2, device.height*0.3, 500);
      sleep(1500);
    }
  }

  // 1. 坐标兜底: dump卡片 [648,957][1264,1247] 中心(956,1102) 按比例换算
  toast("关键词没点中,走坐标兜底");
  var x = Math.floor(device.width*956/1280), y = Math.floor(device.height*1102/2772);
  click(x, y); sleep(3000);
  if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; }

  // 2. 搜索框兜底: 点搜索输"免费试"进
  try{
    var s = text("搜索").findOne(3000) || desc("搜索").findOne(3000);
    if(s){ s.click(); sleep(1500);
      var input = className("android.widget.EditText").findOne(3000);
      if(input){ input.setText("免费试"); sleep(1000);
        var btn = text("搜索").findOne(2000); if(btn) btn.click(); sleep(3000);
        if(verifyInMianFeiShi()){ toast("已打开免费试"); return true; }
      }
    }
  }catch(e){ log(e); }

  toast("可能没点中, 请看屏幕确认");
  return false;
}

openMianFeiShi();
