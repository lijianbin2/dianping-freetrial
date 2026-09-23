# 大众点评免费试：美食循环报名

这是一个基于 UIAutomator2 的本地自动化脚本。手机先手动进入大众点评的“免费试”列表，脚本从当前页面继续筛选美食商家，并尝试报名。

当前默认规则：

- 商家价值 **大于或等于 100 元**
- 列表距离 **小于或等于 30.0 km**
- 距离支持 `km` 和 `m`，米会自动换算为千米
- 列表中显示“已报名”的商家直接跳过
- 详情页出现“等级不够”“仅 Lv6”等限制时立即停止
- 遇到等级限制时保留当前页面，不再自动返回或继续点击

## 环境要求

- Windows 电脑
- Python 3.10 或更高版本
- Android 手机已开启“无线调试”或 USB 调试
- 电脑可以连接手机的 UIAutomator2 服务
- 手机停留在大众点评 App 内

主要依赖只有：

```text
uiautomator2>=3.0,<4
```

## 安装

在仓库根目录创建虚拟环境并安装依赖：

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

确认电脑能找到手机：

```powershell
adb devices
```

如果使用无线调试，需要先完成 `adb pair` 和 `adb connect`。UIAutomator2 的设备地址通常类似：

```text
adb-XXXXXXXX._adb-tls-connect._tcp
```

## 运行前准备

1. 打开大众点评 App。
2. 进入“免费试”列表页。
3. 确认当前是“美食”分类；如果不是，脚本会尝试打开“全部分类”并选择“美食”。
4. 让手机保持亮屏、解锁并停留在该列表页。
5. 在电脑运行脚本，不要同时手动操作手机。

脚本不会负责登录大众点评，也不会自动处理验证码、锁屏密码或系统权限弹窗。

## 日常运行

使用默认设备地址：

```powershell
.\.venv\Scripts\python.exe work\u2_continue25.py
```

指定设备地址：

```powershell
.\.venv\Scripts\python.exe work\u2_continue25.py --serial "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
```

也可以临时设置环境变量：

```powershell
$env:U2_SERIAL = "adb-你的设备地址"
.\.venv\Scripts\python.exe work\u2_continue25.py
```

运行过程中，脚本会持续把状态写到终端，例如：

```text
连上 <手机型号> ...
V25-continue start
筛选规则: 价值>=100, 距离<=30km
本屏卡: [...]
开卡 ...
本单结果: ok
```

终端输出是唯一的运行日志。需要保存时可以直接重定向：

```powershell
.\.venv\Scripts\python.exe work\u2_continue25.py *> work\u2_run.log
```

## 参数

```text
--serial          UIAutomator2 设备地址
--value-min       最低价值，默认 100
--distance-max    最远距离（km），默认 30
--max-minutes     最长运行分钟数，默认 100
--max-empty       连续无新合格卡次数，默认 80
```

例如只跑价值 150 元及以上、距离 20 km 以内：

```powershell
.\.venv\Scripts\python.exe work\u2_continue25.py `
  --value-min 150 `
  --distance-max 20
```

## 工作流程

1. 确认当前页面是免费试列表，并确保分类为美食。
2. 解析当前屏幕的商家名称、价值和距离。
3. 跳过已报名商家，选择第一个满足阈值的未处理商家。
4. 打开详情页，检查等级限制、已报名状态和“我要报名”入口。
5. 点击“我要报名”和“确认报名”。
6. 报名结果页只返回一次；如果没有回到列表，脚本会停止，不会继续盲点。
7. 回到列表后继续处理下一家，直到触底、达到超时、页面丢失或遇到等级限制。

详情页显示的距离只用于记录，报名资格以列表页距离为准。脚本不会因为详情页距离略有差异而误跳过商家。

## 停止条件

脚本会在以下情况停止：

- 看到“等级不够”“仅 Lv6”“暂未满足报名要求”等等级限制
- 页面已经离开免费试列表，无法确认安全返回
- 报名结果页返回后仍未回到列表
- 找不到“全部分类”或“美食”入口
- 连续 80 次没有新的合格商家，或列表出现“到底了”等文案
- 达到默认 100 分钟运行上限

停止时终端会打印 `漏网清单`，其中列出已经发现但没有得到明确结果的商家，方便人工复查。

## 目录结构

```text
.
├── README.md
├── requirements.txt
├── docs/                       # 调试截图
├── tests/
│   └── test_u2_continue25.py
└── work/
    ├── u2_continue25.py         # 当前主力脚本
    ├── debug_one.py            # 只读查看当前屏幕解析结果
    └── ...                      # 历史实验脚本，不作为日常入口
```

`docs/` 中的截图用于记录历史实测状态：

- [报名成功](docs/baoming_chenggong.png)
- [等级不足](docs/level_buzu.png)
- [价值 100 元、距离约 20 km 的商家](docs/value100_dist20_shangjia_benyuan.png)

## 只读检查

不执行点击或滑动，只打印当前页面解析出的商家卡片：

```powershell
.\.venv\Scripts\python.exe work\debug_one.py --serial "你的设备地址"
```

## 开发验证

运行测试不需要连接手机：

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

编译检查：

```powershell
.\.venv\Scripts\python.exe -m compileall -q work tests
```

## 注意事项

- 大众点评页面改版后，控件文字和层级结构可能变化，脚本应先用 `debug_one.py` 和单元测试验证。
- 不要把锁屏密码、手机号或其他敏感信息写进脚本、日志或提交记录。
- 运行时不要切换分类、搜索、返回桌面或操作手机；脚本依赖当前页面状态。
- 历史脚本保留在 `work/` 中用于复现实验，不建议直接运行。
