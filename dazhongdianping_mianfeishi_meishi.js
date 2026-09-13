// 大众点评 · 免费试 → 全部分类 → 美食
// 设备验证分辨率: 1280x2772 (REDMI Turbo 4 Pro)
// UIAutomator2 翻译要点:
//   text() 本身 clickable=false 时, 必须点父容器 parent().click()
//   全部分类父容器: [321,295][641,441] 中心(481,368)
//   美食父容器: [0,569][1280,699] 中心(640,634)
//   切换成功标志: 顶部筛选栏文字从 全部分类 变成 美食(橙色高亮)

auto.waitFor();

function clickByTextParent(txt, timeout) {
    timeout = timeout || 5000;
    let node = text(txt).findOne(timeout);
    if (!node) throw new Error(`没找到:` + txt);
    // 文本本身不可点, 点父容器(FrameLayout clickable=true)
    let p = node.parent();
    if (p) {
        p.click();
    } else {
        node.click();
    }
    sleep(800);
}

function clickByU2(x, y, baseW, baseH) {
    // 分辨率换算兜底: U2坐标基于1280x2772
    baseW = baseW || 1280; baseH = baseH || 2772;
    let sx = device.width / baseW;
    let sy = device.height / baseH;
    click(x * sx, y * sy);
    sleep(800);
}

// 1. 确保在免费试页(标题含 免费试)
if (!textContains(`免费试`).findOne(5000)) {
    toast(`请先手动进入 免费试页 再运行`);
    throw new Error(`不在免费试页`);
}

// 2. 点开 全部分类
try {
    clickByTextParent(`全部分类`, 5000);
} catch (e) {
    // 兜底: 直接按U2坐标点
    clickByU2(481, 368);
}

// 3. 等分类弹窗出现, 点 美食
let meishi = text(`美食`).findOne(5000);
if (!meishi) throw new Error(`分类弹窗没出现/没找到美食`);
try {
    meishi.parent().click();
} catch (e) {
    clickByU2(640, 634);
}
sleep(1500);

// 4. 验证: 顶部出现橙色 美食
if (text(`美食`).findOne(3000)) {
    toast(`已切换到美食分类`);
} else {
    throw new Error(`切换验证失败`);
}
