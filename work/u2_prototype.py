# -*- coding: utf-8 -*-
# U2 原型: 起点=用户手动停在免费试列表页. 只做: 确认美食 -> 解析卡片(价值>100且距离<20) -> 开卡 -> 详情复核 -> 报名 -> 回列表
# 禁止: 点搜索栏/宝箱签到/底部橙V Tab/快筛芯片(高中奖率/附近3km/连锁餐厅/200元以上套餐). 分类阶段零back, back只允许 详情->列表.
import re, time, sys
import xml.etree.ElementTree as ET
import uiautomator2 as u2

SERIAL = "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
VAL_MIN = 100
DIST_MAX = 20.0

T_FREE = "免费抽"
T_WANT = "我要报名"
T_CONFIRM = "确认报名"
T_DONE = "完成"
T_ALREADY = "已报名"
LEVEL_KEYS = ["仅Lv6", "仅限Lv", "等级不够", "暂未满足", "当前等级", "仅 Lv6", "Lv6-Lv8"]

def log(s):
    print(s, flush=True)

def dump(d):
    return d.dump_hierarchy(compressed=True)

def texts(xml):
    root = ET.fromstring(xml)
    out = []
    for n in root.iter("node"):
        t = n.attrib.get("text") or ""
        if t.strip():
            out.append(t.strip())
    return out

def is_meishi(xml):
    # 顶栏第二筛显示 美食 且无 全部分类 => 已在美食
    return ("美食" in xml) and ("全部分类" not in xml)

def center_of(bounds):
    m = re.findall(r"\d+", bounds)
    if len(m) != 4:
        return None
    x1, y1, x2, y2 = map(int, m)
    return ((x1+x2)//2, (y1+y2)//2)

def find_nodes_by_text(xml, target):
    root = ET.fromstring(xml)
    res = []
    for n in root.iter("node"):
        if (n.attrib.get("text") or "") == target:
            c = center_of(n.attrib.get("bounds", ""))
            if c:
                res.append((c[1], c[0], c[1], n.attrib.get("bounds","")))
    return res

def ensure_meishi(d):
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
        mm = re.fullmatch(r"(\d+(?:\.\d+)?)km", tt)
        if mm:
            m = re.findall(r"\d+", n.attrib.get("bounds",""))
            if len(m) == 4:
                cy = (int(m[1])+int(m[3]))//2
                if cy > 600:
                    dists.append((cy, float(mm.group(1))))
    cards = []
    for vcy, vv in vals:
        best = None
        for dcy, dd in dists:
            if abs(dcy - vcy) < 200:
                if best is None or abs(dcy - vcy) < abs(best[0]-vcy):
                    best = (dcy, dd)
        if best:
            cards.append({"y": vcy, "val": vv, "dist": best[1]})
    cards.sort(key=lambda c: c["y"])
    uniq = []
    for c in cards:
        if not uniq or abs(c["y"]-uniq[-1]["y"]) > 80:
            uniq.append(c)
    return uniq

def detail_dist(xml):
    m = re.search(r"(\d+(?:\.\d+)?)km", xml)
    if m:
        try:
            return float(m.group(1))
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
        log("详情距离 %skm (列表%s)" % (dd, card["dist"]))
        if dd >= DIST_MAX:
            log("详情复核超距, back跳过")
            d.press("back")
            time.sleep(2)
            return "far"
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
        log("确认页等级不够: %s back" % blk)
        d.press("back"); time.sleep(1.5)
        d.press("back"); time.sleep(2)
        return "level_buzu"
    # 点 确认报名
    root2 = ET.fromstring(xml2)
    cb = None
    for n in root2.iter("node"):
        if (n.attrib.get("text") or "") == T_CONFIRM:
            cb = center_of(n.attrib.get("bounds",""))
            break
    if not cb:
        log("无确认报名, 双back")
        d.press("back"); time.sleep(1.5)
        d.press("back"); time.sleep(2)
        return "no_confirm"
    log("点确认报名 %s" % (cb,))
    d.click(cb[0], cb[1])
    time.sleep(3.5)
    xml3 = dump(d)
    blk = has_level_block(xml3)
    if blk:
        log("结果页等级不够: %s" % blk)
        d.press("back"); time.sleep(1.5)
        d.press("back"); time.sleep(2)
        return "level_buzu"
    log("报名结果片段: " + "|".join(texts(xml3)[:30]))
    # 点 完成 (若有)
    try:
        root3 = ET.fromstring(xml3)
        for n in root3.iter("node"):
            if (n.attrib.get("text") or "") == T_DONE:
                c = center_of(n.attrib.get("bounds",""))
                if c:
                    log("点完成 %s" % (c,))
                    d.click(c[0], c[1])
                    time.sleep(2)
                    break
    except Exception as e:
        log("完成点击异常 %s" % e)
    d.press("back")
    time.sleep(2)
    xml4 = dump(d)
    if T_FREE in xml4:
        log("已回列表")
        return "ok"
    d.press("back")
    time.sleep(2)
    xml5 = dump(d)
    if T_FREE in xml5:
        log("二次back回列表")
        return "ok"
    log("回列表失败")
    return "lost"

def main():
    d = u2.connect(SERIAL)
    log("连上 %s %s" % (d.info.get("productName"), d.app_current()))
    if not ensure_meishi(d):
        log("美食确认失败, 退出")
        return
    seen = set()
    empty = 0
    while True:
        xml = dump(d)
        cards = parse_cards(xml)
        log("本屏卡: %s" % (cards,))
        target = None
        for c in cards:
            key = (c["val"], c["dist"])
            if key in seen:
                continue
            if c["val"] > VAL_MIN and c["dist"] < DIST_MAX:
                target = c
                break
        if not target:
            empty += 1
            log("无合格 empty %d/8 上滑" % empty)
            if empty >= 8:
                log("到底结束")
                break
            d.swipe(640, 2000, 640, 1200, 0.7)
            time.sleep(1.8)
            continue
        empty = 0
        seen.add((target["val"], target["dist"]))
        log("开卡 %s x=640" % (target,))
        if target["y"] < 600:
            log("拒绝点卡: y<600 疑似快筛栏(连锁餐厅等), 跳过")
            seen.add((target["val"], target["dist"]))
            d.swipe(640, 1800, 640, 1200, 0.6)
            time.sleep(1.5)
            continue
        d.click(640, target["y"])
        time.sleep(3)
        r = do_one_detail(d, target)
        log("本单结果: %s" % r)
        if r == "level_buzu":
            log("等级不够, 全剧终")
            break
        if r == "lost":
            log("页面丢失, 停止")
            break
        if r == "tap_miss":
            d.swipe(640, 1800, 640, 1200, 0.6)
            time.sleep(1.5)
            continue
        # ok/already/far/no_entry/no_confirm 都继续下一家
        time.sleep(1.0)

if __name__ == "__main__":
    main()
