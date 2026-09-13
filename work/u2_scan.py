# -*- coding: utf-8 -*-
import re, time
import xml.etree.ElementTree as ET
import uiautomator2 as u2
SERIAL = "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
def dump(d):
    return d.dump_hierarchy(compressed=True)
def parse(xml):
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
            if abs(dcy - vcy) < 350:
                if best is None or abs(dcy - vcy) < abs(best[0]-vcy):
                    best = (dcy, dd)
        if best:
            cards.append((vcy, vv, best[1]))
    cards.sort()
    uniq = []
    for c in cards:
        if not uniq or abs(c[0]-uniq[-1][0]) > 80:
            uniq.append(c)
    return uniq
d = u2.connect(SERIAL)
print("start scan", flush=True)
# 回顶
for i in range(6):
    d.swipe(640, 1200, 640, 2200, 0.6)
    time.sleep(1.2)
print("top reached", flush=True)
seen = set()
for i in range(15):
    xml = dump(d)
    cards = parse(xml)
    print("SCREEN %d: %s" % (i, [(v, dd) for (y, v, dd) in cards]), flush=True)
    for (y, v, dd) in cards:
        if (v, dd) not in seen:
            seen.add((v, dd))
            if v > 100 and dd < 20:
                print("QUALIFIED %s元 %skm" % (v, dd), flush=True)
    d.swipe(640, 2000, 640, 1200, 0.7)
    time.sleep(1.8)
print("ALL %s" % sorted(seen), flush=True)
