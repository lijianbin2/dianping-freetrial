// Hamibot 通用模板 (由 U2 辅助生成)
// 把 u2_inspect.py 输出的 Hamibot 行填到 STEP 区即可, 直接粘贴到 Hamibot 运行

"ui";

// 1. 等无障碍就绪
auto.waitFor();

// 2. 工具函数
function clickS(sel, timeout) {
    timeout = timeout || 3000;
    var el = sel.findOne(timeout);
    if (!el) {
        toast("没找到: " + sel);
        return false;
    }
    click(el.bounds().centerX(), el.bounds().centerY());
    return true;
}

function inputS(sel, txt, timeout) {
    timeout = timeout || 3000;
    var el = sel.findOne(timeout);
    if (!el) { toast("输入框没找到"); return false; }
    el.click();
    sleep(500);
    el.setText(txt);
    return true;
}

// ===== STEP 区: 在这里按流程编排 (示例) =====
// 示例1: 点击"登录"
// var btn = text("登录").findOne(3000);
// if (btn) btn.click(); else toast("没找到登录按钮");

// 示例2: id 点击 (U2 resourceId -> Hamibot id)
// id("com.example:id/btn_ok").findOne(3000).click();

// 示例3: 输入
// var s = desc("搜索").findOne(3000);
// if (s) { s.click(); sleep(500); s.setText("hamibot"); }

// 示例4: 滑动
// swipe(500, 1500, 500, 500, 500);
// sleep(1000);

// ===== 你的流程从这里写 =====
toast("脚本启动, 请把 u2_inspect 输出填到 STEP 区");
sleep(1000);

// TODO: 1.
// TODO: 2.
// TODO: 3.
