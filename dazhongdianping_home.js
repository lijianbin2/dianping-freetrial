// Hamibot - 大众点评首页 starter (由 UIAutomator2 dump 生成 2026-09-13)
// 机型: REDMI Turbo 4 Pro 1280x2772, 当前页: 广州首页

"ui";
auto.waitFor();

function clickS(sel, timeout) {
    timeout = timeout || 3000;
    var el = sel.findOne(timeout);
    if (!el) { toast("没找到: " + sel); return false; }
    click(el.bounds().centerX(), el.bounds().centerY());
    return true;
}

// 1. 点搜索 (U2: d(text="搜索"))
// clickS(text("搜索"));

// 2. 得金币/签到 (U2: d(resourceId="com.dianping.v1:id/iv_check_in"))
// clickS(id("com.dianping.v1:id/iv_check_in"));

// 3. 分类图标 (U2 全是 iv_category_icon, 要按坐标区分, 别直接用 id)
// 首页第一排 5 个: 美食 / 休闲玩乐 / 酒店民宿 / 景点游玩 / 电影演出
// U2 bounds: [59,438][223,602] 等, 中心点约:
// click(141, 520); // 美食
// click(390, 520); // 休闲玩乐
// click(640, 520); // 酒店民宿

// 4. 点赞按钮 (U2: d(description="reculike_like"))
// var like = desc("reculike_like").findOne(3000);
// if (like) like.click();

// 5. 底部 Tab
// clickS(id("com.dianping.v1:id/home_tab_home_container")); // 首页
// clickS(text("地图")); // 地图
// clickS(text("消息")); // 消息
// clickS(text("我的")); // 我的

// ==== 示例流程: 搜索指定店 ====
var keyword = "勇记手工竹升面";
var s = text("搜索").findOne(3000);
if (s) {
    s.click();
    sleep(1500);
    var input = className("android.widget.EditText").findOne(3000);
    if (input) {
        input.setText(keyword);
        sleep(800);
        // 点搜索按钮 - 按文本
        var btn = text("搜索").findOne(3000);
        if (btn) btn.click();
    } else {
        toast("没找到搜索输入框, 需重抓搜索页");
    }
} else {
    toast("首页搜索入口没找到");
}
