# 大众点评免费试 · 美食循环报名

Hamibot 脚本：大众点评 App「免费试」频道，自动筛选**价值 100 元以上、距离 20km 以内**的美食商家并循环报名，直到出现等级不够的提示为止。

## 环境

- 手机：REDMI Turbo 4 Pro，分辨率 1280x2772
- 运行：Hamibot（Auto.js 系 API）；PC 端用 UIAutomator2 / adb 辅助定位
- 包名：com.dianping.v1

## 脚本说明

| 文件 | 用途 |
|---|---|
| dazhongdianping_home.js | 大众点评首页 starter（搜索 / 分类入口坐标，模板） |
| dazhongdianping_mianfeishi.js | 首页 → 打开免费试频道 |
| dazhongdianping_mianfeishi_meishi.js | 免费试 → 全部分类 → 切换到美食 |
| dazhongdianping_meishi_filter100_20km.js | **主脚本**：筛选价值 >100 且 <20km 的商家，打开详情并报名 |

## 核心规则（UIAutomator2 → Hamibot 翻译）

- 文本控件本身 `clickable=false` 时，必须点父容器：`text("xxx").parent().click()`
- 例外：「我要报名」按钮 `clickable=true`，可直接点
- 坐标按 1280x2772 基准，换算到实际分辨率：`x * device.width / 1280`

## 关键坐标（1280x2772）

| 位置 | 坐标 |
|---|---|
| 首页免费试卡片 | (956, 1102) |
| 全部分类 | (481, 368) |
| 美食（弹窗） | (640, 634) |
| 我要报名 | (947, 2576) |
| 确认报名（y 极低，注意滑到可见） | (640, 2558) |
| 报名结果页「完成」 | (1183, 242) |
| 弹窗「我知道了」 | (640, 1330) |
| 左上返回 / keyevent 4 | (63, 139) |

## 报名流程

1. 免费试主页 → 全部分类 → 美食（顶栏变橙色即成功）
2. 遍历列表项文本，正则提取`价值\s*(\d+)\s*元`与`(\d+\.?\d*)\s*km`，只进 `价值>100 且 距离<20` 的店
3. 详情页点「我要报名」→ 确认页点「确认报名」（等 3 秒截图判断）
4. 成功（含「报名成功 / 已报名」）→ 点「完成」→ 返回列表 → 下一家
5. 出现「暂未满足报名要求 / 仅 Lv6 / 等级不够」→ 截图存档，循环结束

## 实测战绩（2026-09-13）

- 本源食堂 173 元 / 18.8km ✅
- 花崎居酒屋 110 元 / 19.3km ✅
- 赫小野·长沙大排档 122 元 / 17.8km ✅
- 傷心酒店·小酒馆 149 元 / 17.6km（橙 V 专享）✅
- 厝内潮汕卤水火锅 326 元 / 20.2km →「仅 Lv6-Lv8 且橙 V 可报」→ 结束（见 docs/level_buzu.png）

## 目录结构

- 根目录 *.js：可直接粘贴到 Hamibot 运行的脚本
- docs/：3 张代表截图（报名成功 / 本源食堂 / 等级不够结束页）
- work/hamibot-dev/：PC 辅助工具（u2 定位转 Hamibot、dump 解析）
- outputs/、*.png、*.xml：本地运行截图与调试产物，不进仓库（见 .gitignore）

## 注意

- 锁屏密码、手机号等敏感信息只口头传递，不落盘、不进脚本
- 大众点评改版后坐标可能漂移，先用 `adb shell uiautomator dump` 重抓再改脚本

仓库：https://github.com/lijianbin2/dianping-freetrial

## Git 代理推送
本仓库走本地代理推送 GitHub，代理 http://127.0.0.1:7890，已配 git http.proxy / https.proxy。
fetch / push 前确认代理可用，命令：git fetch origin；git push -u origin main。

## 清理说明
outputs/、work/hamibot-dev/dump/、截图 xml 均为本地调试产物，不进仓库（见 .gitignore）。
2026-09-13 已用 git clean -fdX 清理约 150MB，docs/ 仅保留 3 张代表截图。

## 运行顺序
1. dazhongdianping_home.js 首页模板；2. dazhongdianping_mianfeishi.js 打开免费试；3. dazhongdianping_mianfeishi_meishi.js 切美食；4. dazhongdianping_meishi_filter100_20km.js 主脚本筛选报名。全部直接粘贴到 Hamibot 运行。


## V9（2026-09-13）：修复进免费试后无动作
- 原因：免费试标题常是图片、无文本节点，	extContains(免费试) 扫不到就直接 throw，脚本在 V8 start 后直接退出，所以全程无 toast。
- 修复：nsureMeishi() 不再抛错，扫不到也继续扫卡；每次扫卡都 	oast 扫卡 free xN；合并版去掉重复的 openMianFeiShi() 调用。
- 必查：手机设置 → 无障碍 → 开 Hamibot；Hamibot App 内自动化/悬浮窗权限全开，否则 TextView 数量为 0，什么字都扫不到。


## V10: verify meishi tab before paging
- Fix: old ensureMeishi returned early on any text mei-shi, paging in wrong category.
- New: isMeishiTab checks y 1300-1750 (category bar); click all mei-shi candidates, verify, return true/false; exit if false.
- Expect toast: V10 start -> switch meishi try -> to meishi ok ->扫卡 free xN.


## V10.4（2026-09-13）：修吸顶后面食校验 + 价值空格数字兜底
- 根因：切美食成功后顶栏吸顶到 y~368，老 isMeishiTab 只认 y 1300-1750，永远 false，导致 ensureMeishi 空转 5 次 switch meishi try 后退出，看起来就是 进去免费试后不动。
- 修复1：isMeishiTab 改为 有美食且无全部分类即算成功（tab check mei=true quan=false），去掉 Y 区间判断。
- 修复2：美食候选按 centerY 排序，弹窗项优先点；点全部分类改用 bounds 中心 click 并打日志。
- 修复3：价值解析加兜底，clean 匹配不到时用 joined 宽松取 价值...元 再提数字，兼容 价值 1 5 9 元这种被拆成三段 TextView 的情况。
- 预期 toast：V10.4 start -> switch meishi try -> to meishi ok -> 扫卡 free xN -> hit...yuan...km。

## V10.5（2026-09-13）：日志落盘到手机 txt
- 需求：用户要求以后看日志直接看手机 txt，不用截图 Hamibot 日志页。
- 实现：LOG_PATH=/sdcard/hamibot_free_log.txt，启动时 files.write 覆盖写头，劫持 log() 双写（控制台+append 到 txt，带时间戳）。
- 验证：adb shell cat /sdcard/hamibot_free_log.txt，应看到 V10.5 start -> switch meishi try -> to meishi ok -> 扫卡 free xN。
- 注意：txt 不存在=新版还没跑过，先在 Hamibot 粘贴合并版重跑一次再拉取。


## V10.6（2026-09-13）：多路径日志兜底
- V10.5 只写 /sdcard，实测没文件（没跑新版或没存储权限），改试 3 个路径：/sdcard/hamibot_free_log.txt -> ./hamibot_free_log.txt -> /sdcard/Download/hamibot_free_log.txt，哪个能写用哪个。
- toast 直接报 V10.6 start log:实际路径，跑完凭 toast 就知道写到哪了。

