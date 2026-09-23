# -*- coding: utf-8 -*-
# U2 原型: 起点=用户手动停在免费试列表页. 只做: 确认美食 -> 解析卡片(价值>=100且距离<=30) -> 开卡 -> 详情复核 -> 报名 -> 回列表
# 禁止: 点搜索栏/宝箱签到/底部橙V Tab/快筛芯片(高中奖率/附近3km/连锁餐厅/200元以上套餐). 分类阶段零back, back只允许 详情->列表.
import re, time, sys
import xml.etree.ElementTree as ET
import uiautomator2 as u2

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

SERIAL = "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
VAL_MIN = 100
DIST_MAX = 30.0

T_FREE = "免费抽"
T_WANT = "我要报名"
T_CONFIRM = "确认报名"
T_ALREADY = "已报名"
BOTTOM_KEYS = ["\u6ca1\u6709\u66f4\u591a", "\u5230\u5e95\u4e86", "\u5df2\u663e\u793a\u5168\u90e8", "\u6682\u65e0\u66f4\u591a"]
LEVEL_KEYS = ["仅Lv6", "仅限Lv", "等级不够", "暂未满足", "当前等级", "仅 Lv6", "Lv6-Lv8"]

def _clean(s):
    return str(s).replace(chr(0xfffc), "?")

def log(s):
    try:
        print(_clean(s), flush=True)
    except Exception:
        pass

def dump(d):
    return d.dump_hierarchy(compressed=True)

def texts(xml):
    try:
        root = ET.fromstring(xml)
        out = []
        for n in root.iter("node"):
            t = n.attrib.get("text") or ""
            if t.strip():
                out.append(t.strip())
        return out
    except Exception:
        return []


def is_meishi(xml):
    # 顶栏第二筛显示 美食 且无 全部分类 => 已在美食
    return ("美食" in xml) and ("全部分类" not in xml)

def center_of(bounds):
    m = re.findall(r"\d+", bounds)
    if len(m) != 4:
        return None
    x1, y1, x2, y2 = map(int, m)
    return ((x1+x2)//2, (y1+y2)//2)

def ensure_meishi(d):
    xml = dump(d)
    for _ in range(3):
        if ("\u7f8e\u98df" in xml) or ("\u514d\u8d39\u62bd" in xml):
            break
        log("首抓无页面文字(可能锁屏/加载中), 等5秒重抓")
        time.sleep(5)
        xml = dump(d)
    if is_meishi(xml):
        log("已在美食, 直接开工")
        return True
    log("不在美食, 点一次分类弹窗")
    # 1) 点 全部分类 打开弹窗
    root = ET.fromstring(xml)
    quan = None
    for n in root.iter("node"):
        if (n.attrib.get("text") or "") == "全部分类":
            quan = center_of(n.attrib.get("bounds",""))
            break
    if quan:
        log("点全部分类 %s" % (quan,))
        d.click(quan[0], quan[1])
        time.sleep(2.5)
        xml = dump(d)
    # 2) 点 美食 (弹窗项优先: cy大的优先)
    root = ET.fromstring(xml)
    cands = []
    for n in root.iter("node"):
        if (n.attrib.get("text") or "") == "美食":
            c = center_of(n.attrib.get("bounds",""))
            if c:
                cands.append(c)
    cands.sort(key=lambda c: -c[1])
    log("美食候选 %s" % (cands,))
    for (x, y) in cands:
        d.click(x, y)
        time.sleep(3)
        xml2 = dump(d)
        if is_meishi(xml2):
            log("切到美食 OK")
            return True
        if T_FREE not in xml2:
            log("点完跳出免费试, 停止(不back)")
            return False
    xml3 = dump(d)
    ok = is_meishi(xml3)
    log("ensure结果 %s" % ok)
    return ok

def parse_cards(xml):
    root = ET.fromstring(xml)
    vals = []
    for n in root.iter("node"):
        t = n.attrib.get("text") or ""
        if re.fullmatch(r"[\d\xa0 ]+", t) and t.strip():
            m = re.findall(r"\d+", n.attrib.get("bounds",""))
            if len(m) == 4:
                digits = re.sub(r"\D", "", t)
                if digits:
                    cy = (int(m[1])+int(m[3]))//2
                    if cy > 600:
                        vals.append((cy, int(digits)))
    dists = []
    for n in root.iter("node"):
        tt = (n.attrib.get("text") or "").strip()
        mm = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(km|m)", tt)
        if mm:
            m = re.findall(r"\d+", n.attrib.get("bounds",""))
            if len(m) == 4:
                cy = (int(m[1])+int(m[3]))//2
                if cy > 600:
                    dd = float(mm.group(1))
                    if mm.group(2) == "m":
                        dd = dd / 1000.0
                    dists.append((cy, dd))
    titles = []
    for n in root.iter("node"):
        tt = (n.attrib.get("text") or "").strip()
        if len(tt) >= 4 and ("|" in tt or "\u00b7" in tt) and "km" not in tt and not re.fullmatch(r"(\d+(?:\.\d+)?)\s*(km|m)", tt):
            m = re.findall(r"\d+", n.attrib.get("bounds",""))
            if len(m) == 4:
                cy = (int(m[1])+int(m[3]))//2
                if cy > 400:
                    titles.append((cy, tt))
    applied_ys = []
    for n in root.iter("node"):
        tt = (n.attrib.get("text") or "").strip()
        if "\u5df2\u62a5\u540d" in tt:
            m = re.findall(r"\d+", n.attrib.get("bounds",""))
            if len(m) == 4:
                applied_ys.append((int(m[1])+int(m[3]))//2)
    cards = []
    for vcy, vv in vals:
        best = None
        for dcy, dd in dists:
            if abs(dcy - vcy) < 200:
                if best is None or abs(dcy - vcy) < abs(best[0]-vcy):
                    best = (dcy, dd)
        if best:
            nm = ""
            nd = 9999
            for tcy, tt in titles:
                d = vcy - tcy
                if 0 < d < 450 and d < nd:
                    nd = d
                    nm = tt
            cards.append({"y": vcy, "val": vv, "dist": best[1], "name": nm, "applied": any(abs(ay - vcy) < 180 for ay in applied_ys)})
    cards.sort(key=lambda c: c["y"])
    uniq = []
    for c in cards:
        if not uniq or abs(c["y"]-uniq[-1]["y"]) > 80:
            uniq.append(c)
    return uniq

def detail_dist(xml):
    m = re.search(r"(\d+(?:\.\d+)?)\s*(km|m)", xml)
    if m:
        try:
            v = float(m.group(1))
            if m.group(2) == "m":
                v = v / 1000.0
            return v
        except:
            return None
    return None

def has_level_block(xml):
    for k in LEVEL_KEYS:
        if k in xml:
            return k
    return None

def do_one_detail(d, card):
    # 已在详情页, 返回 ok/already/level_buzu/no_entry/lost
    time.sleep(1.0)
    xml = dump(d)
    if T_FREE in xml and T_WANT not in xml:
        log("还在列表, 卡点没进去")
        return "tap_miss"
    blk = has_level_block(xml)
    if blk:
        log("详情直接等级不够: %s" % blk)
        d.press("back")
        time.sleep(2)
        return "level_buzu"
    dd = detail_dist(xml)
    if dd is not None:
        log("详情距离 %skm (列表%s, 以列表为准不跳过)" % (dd, card["dist"]))
    if T_ALREADY in xml and T_WANT not in xml:
        log("已报名过, back")
        d.press("back")
        time.sleep(2)
        return "already"
    if T_WANT not in xml:
        log("详情无入口, back")
        d.press("back")
        time.sleep(2)
        return "no_entry"
    # 点 我要报名
    root = ET.fromstring(xml)
    btn = None
    for n in root.iter("node"):
        if (n.attrib.get("text") or "") == T_WANT:
            btn = center_of(n.attrib.get("bounds",""))
            break
    if not btn:
        log("按钮坐标找不到, back")
        d.press("back")
        time.sleep(2)
        return "no_entry"
    log("点我要报名 %s" % (btn,))
    d.click(btn[0], btn[1])
    time.sleep(3)
    xml2 = dump(d)
    blk = has_level_block(xml2)
    if blk:
        log("确认页等级不够 stop_where_you_are")
        d.press("back"); time.sleep(2)
        _xml=dump(d)
        if T_FREE in _xml:
            log("已回列表,就地停")
        else:
            log("仍在详情页,就地停不再按第二次")
        return "level_buzu"
    # 点 确认报名
    root2 = ET.fromstring(xml2)
    cb = None
    for n in root2.iter("node"):
        if (n.attrib.get("text") or "") == T_CONFIRM:
            cb = center_of(n.attrib.get("bounds",""))
            break
    if not cb:
        log("无确认报名,单back")
        d.press("back"); time.sleep(2)
        _xml=dump(d)
        if T_FREE in _xml:
            log("已回列表")
        else:
            log("未回列表就地停")
        return "no_confirm"
    log("点确认报名 %s" % (cb,))
    d.click(cb[0], cb[1])
    time.sleep(3.5)
    xml3 = dump(d)
    blk = has_level_block(xml3)
    if blk:
        log("结果页等级不够 stop_where_you_are")
        d.press("back"); time.sleep(2)
        _xml=dump(d)
        if T_FREE in _xml:
            log("已回列表,就地停")
        else:
            log("仍在详情页,就地停不再按第二次")
        return "level_buzu"
    log("报名结果片段: " + "|".join(texts(xml3)[:30]))
    # 成功页单back回列表(不用点完成, 二次back有退首页风险, 宁可lost就地停)
    d.press("back")
    time.sleep(2)
    xml4 = dump(d)
    if T_FREE in xml4:
        log("已回列表")
        return "ok"
    log("回列表失败,就地停")
    return "lost"

TRACK_SPOTTED = {}
TRACK_DONE = set()
def report_missed():
    try:
        miss=[(k,v) for k,v in TRACK_SPOTTED.items() if k not in TRACK_DONE]
        log("漏网清单共%d家: %s" % (len(miss), miss))
    except Exception as e:
        log("report异常 %s" % e)
def main():
    try:
        d = u2.connect(SERIAL)
    except Exception as e:
        log("主连接失败, 试备用 %s" % e)
        try:
            d = u2.connect("192.168.1.2:39127")
        except Exception as e2:
            log("连接都失败, 退出 %s" % e2)
            return
    log("连上 %s %s" % (d.info.get("productName"), d.app_current()))
    log("V25-continue start")
    log("continue mode, keep position")
    try:
        ok_first = ensure_meishi(d)
    except Exception as e:
        log("美食确认异常, 退出 %s" % e)
        return
    if not ok_first:
        log("美食确认失败, 退出")
        return
    seen = set()
    empty = 0
    t0 = time.time()
    top_repeat = None
    top_n = 0
    MAX_MIN = 100
    while True:
        try:
            xml = dump(d)
            cards = parse_cards(xml)
        except Exception as e:
            log("dump/parse fail wait %s" % e)
            time.sleep(2)
            continue
        if T_FREE not in xml:
            log("不在免费试列表(可能残留详情/确认页), 就地停不乱滑")
            report_missed()
            break
        log("本屏卡: %s" % (cards,))
        target = None
        for c in cards:
            key = (c.get("name",""), c["val"], c["dist"])
            if key in seen:
                continue
            if c.get("applied"):
                log("跳过已报名不点 val=%s dist=%s y=%s" % (c["val"], c["dist"], c["y"]))
                seen.add(key)
                continue
            if c["val"] >= VAL_MIN and c["dist"] <= DIST_MAX:
                target = c
                break
        if not target:
            empty += 1
            log("无合格 empty %d/80 上滑" % empty)
            if True in [k in xml for k in BOTTOM_KEYS]:
                log("看到触底文案, 结束")
                break
            if empty >= 80:
                log("到底结束")
                break
            if empty % 10 == 0:
                log("仍在翻页 empty=%d" % empty)
            if time.time()-t0 > MAX_MIN*60:
                log("超时100分钟, 就地停")
                report_missed()
                break
            if empty > 10:
                d.swipe(640, 2000, 640, 800, 0.7)
            else:
                d.swipe(640, 2000, 640, 1200, 0.7)
            time.sleep(2.2)
            continue
        empty = 0
        log("开卡 %s x=640" % (target,))
        if target["y"] < 600:
            log("顶部卡 y<600: 疑似快筛/半遮挡, 下滑带回可点区重扫(不记DONE)")
            _k=(target.get("name",""), target["val"], target["dist"]); TRACK_SPOTTED[_k]=target.get("name","")
            if _k == top_repeat:
                top_n += 1
            else:
                top_repeat = _k; top_n = 1
            if top_n >= 3:
                log("顶部卡3次带不回, 记DONE翻过")
                seen.add(_k); TRACK_DONE.add(_k); top_n = 0
                d.swipe(640, 1800, 640, 1200, 0.6)
                time.sleep(1.5)
                continue
            d.swipe(640, 1200, 640, 1700, 0.6)
            time.sleep(1.5)
            continue
        if target["y"] > 2100:
            log("目标太靠底(y>2100, 接近底部导航), 先上滑再重扫" )
            d.swipe(640, 2000, 640, 1000, 0.7)
            time.sleep(1.8)
            continue
        _k=(target.get("name",""), target["val"], target["dist"]); TRACK_SPOTTED[_k]=target.get("name",""); seen.add(_k)
        d.click(640, target["y"])
        time.sleep(3)
        try:
            r = do_one_detail(d, target)
        except Exception as e:
            log("详情异常就地停 %s" % e)
            report_missed()
            break
        log("本单结果: %s" % r)
        if r in ("ok", "already", "no_entry", "no_confirm"):
            TRACK_DONE.add(_k)
        if r == "level_buzu":
            report_missed()
            log("等级不够, 全剧终")
            break
        if r == "lost":
            report_missed()
            log("页面丢失, 停止")
            break
        if r == "tap_miss":
            d.swipe(640, 1800, 640, 1200, 0.6)
            time.sleep(1.5)
            continue
        # ok/already/no_entry/no_confirm: 小步进避免原屏重扫
        d.swipe(640, 1800, 640, 1400, 0.5)
        time.sleep(1.5)

if __name__ == "__main__":
    main()
    log("STOP_HERE_NO_HOME")





