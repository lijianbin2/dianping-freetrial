# -*- coding: utf-8 -*-
# U2 prototype: free-trial list -> value>100 & dist<20 -> signup. Start: manual in free list.
import re, time
import uiautomator2 as u2
SERIAL = "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
VAL_MIN = 100
DIST_MAX = 20.0
T_FREE = "FREE抽"
T_WANT = "WANT报名"
T_CONFIRM = "CONFIRM报名"
T_DONE = "WANCHENG"
T_MEI = "MEI食"
T_ALL = "QUAN部分类"
def dump(d):
    return d.dump_hierarchy(compressed=True)
def parse_cards(xml):
    import xml.etree.ElementTree as ET
    root = ET.fromstring(xml)
    vals = []
    for n in root.iter("node"):
        t = n.attrib.get("text") or ""
        if re.fullmatch(r"[\d\xa0 ]+", t) and t.strip():
            b = n.attrib.get("bounds", "")
            m = re.findall(r"\d+", b)
            if len(m) == 4:
                digits = re.sub(r"\D", "", t)
                if digits:
                    cy = (int(m[1]) + int(m[3])) // 2
                    if cy > 600:
                        vals.append((cy, int(digits)))
    dists = []
    for n in root.iter("node"):
        tt = (n.attrib.get("text") or "").strip()
        mm = re.fullmatch(r"(\d+(?:\.\d+)?)km", tt)
        if mm:
            b = n.attrib.get("bounds", "")
            m = re.findall(r"\d+", b)
            if len(m) == 4:
                cy = (int(m[1]) + int(m[3])) // 2
                if cy > 600:
                    dists.append((cy, float(mm.group(1))))
    cards = []
    for vcy, vv in vals:
        best = None
        for dcy, dd in dists:
            if abs(dcy - vcy) < 120:
                if best is None or abs(dcy - vcy) < abs(best[0] - vcy):
                    best = (dcy, dd)
        if best:
            cards.append({"y": vcy, "val": vv, "dist": best[1]})
    cards.sort(key=lambda c: c["y"])
    uniq = []
    for c in cards:
        if not uniq or abs(c["y"] - uniq[-1]["y"]) > 80:
            uniq.append(c)
    return uniq
def main():
    d = u2.connect(SERIAL)
    print("connected", d.info.get("productName"), d.app_current(), flush=True)
    seen = set()
    done = 0
    empty = 0
    while True:
        xml = dump(d)
        cards = parse_cards(xml)
        print("cards:", cards, flush=True)
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
            print("no qualified empty %d/8 swipe" % empty, flush=True)
            if empty >= 8:
                print("bottom stop", flush=True)
                break
            d.swipe(640, 2000, 640, 1200, 0.7)
            time.sleep(1.8)
            continue
        empty = 0
        print("open", target, flush=True)
        seen.add((target["val"], target["dist"]))
        d.click(640, target["y"])
        time.sleep(3)
        xml2 = dump(d)
        if T_FREE in xml2:
            print("tap missed still list, swipe past", flush=True)
            d.swipe(640, 1800, 640, 1200, 0.6)
            time.sleep(1.5)
            continue
        if "YIBAOMING" in xml2 and T_WANT not in xml2:
            print("already applied, back", flush=True)
            d.press("back")
            time.sleep(2)
            continue
        if T_WANT not in xml2:
            print("no entry, back", flush=True)
            d.press("back")
            time.sleep(2)
            continue
        import xml.etree.ElementTree as ET
        root = ET.fromstring(xml2)
        btn = None
        for n in root.iter("node"):
            if (n.attrib.get("text") or "") == T_WANT:
                m = re.findall(r"\d+", n.attrib.get("bounds", ""))
                if len(m) == 4:
                    btn = ((int(m[0])+int(m[2]))//2, (int(m[1])+int(m[3]))//2)
        if btn:
            print("click signup", btn, flush=True)
            d.click(btn[0], btn[1])
            time.sleep(3)
        else:
            print("btn missing back", flush=True)
            d.press("back")
            time.sleep(2)
            continue
        xml3 = dump(d)
        root3 = ET.fromstring(xml3)
        cb = None
        for n in root3.iter("node"):
            if (n.attrib.get("text") or "") == T_CONFIRM:
                m = re.findall(r"\d+", n.attrib.get("bounds", ""))
                if len(m) == 4:
                    cb = ((int(m[0])+int(m[2]))//2, (int(m[1])+int(m[3]))//2)
        if cb:
            print("click confirm", cb, flush=True)
            d.click(cb[0], cb[1])
            time.sleep(3.5)
        else:
            print("no confirm back", flush=True)
            d.press("back")
            time.sleep(2)
            continue
        xml4 = dump(d)
        if T_DONE in xml4:
            root4 = ET.fromstring(xml4)
            for n in root4.iter("node"):
                if (n.attrib.get("text") or "") == T_DONE:
                    m = re.findall(r"\d+", n.attrib.get("bounds", ""))
                    if len(m) == 4:
                        print("click finish", flush=True)
                        d.click((int(m[0])+int(m[2]))//2, (int(m[1])+int(m[3]))//2)
                        time.sleep(2)
                        break
        for i in range(2):
            xmlb = dump(d)
            if T_FREE in xmlb:
                break
            d.press("back")
            time.sleep(2)
        done += 1
        print("done count", done, flush=True)
        time.sleep(1.5)
    print("FINISH done=", done, flush=True)
if __name__ == "__main__":
    main()
