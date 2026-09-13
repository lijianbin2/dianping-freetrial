// 大众点评 - 打开首页「免费试」卡片 (U2辅助生成)
// 测试设备: 1280x2772, 包名 com.dianping.v1
// 卡片特征: text="3万个活动在线" bounds [821,993][1084,1040], 可点击父容器 [648,957][1264,1247] 中心约(956,1102)

auto.waitFor();

function openMianFeiShi() {
    // 1. 确保在首页 (有 搜索 / 首页 tab)
    // 如果不在大众点评, 先启动
    // hamibot 侧用 app.launch:
    // app.launch("com.dianping.v1"); sleep(3000);

    // 2. 等「免费试」卡片关键词出现
    let tip = text("3万个活动在线").findOne(8000);
    if (!tip) {
        toast("没找到 3万个活动在线, 试试滑动找一找");
        // 向上滑一下再找
        swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.3, 500);
        tip = text("3万个活动在线").findOne(5000);
    }
    if (!tip) {
        toast("还是没找到免费试卡片");
        // 兜底: 直接点 dump 里的坐标 (按比例换算, 兼容不同分辨率)
        // 原始: 1280x2772 上 (956,1102)
        let x = Math.floor(device.width * 956 / 1280);
        let y = Math.floor(device.height * 1102 / 2772);
        click(x, y);
        return true;
    }

    // 3. 优先点可点击的父容器 (U2里是 ViewGroup clickable=true)
    try {
        let p1 = tip.parent();
        let p2 = p1 ? p1.parent() : null;
        if (p2 && p2.clickable()) {
            log("点免费试父容器");
            p2.click();
            return true;
        }
        if (p1 && p1.clickable()) {
            p1.click();
            return true;
        }
    } catch (e) { log(e); }

    // 4. 兜底: 点文本中心
    let b = tip.bounds();
    click(b.centerX(), b.centerY());
    return true;
}

openMianFeiShi();
sleep(3000);
// 验证是否进入免费试页
if (textContains("免费抽").findOne(3000) || text("免费试").findOne(3000) || textContains("高中奖率").findOne(3000)) {
    toast("已打开免费试");
} else {
    toast("可能没点中, 请看屏幕确认");
}
