# -*- coding: utf-8 -*-
"""
U2 Inspector for Hamibot dev
PC 端连设备 -> 截图 + dump hierarchy -> 输出可直接改写成 Hamibot 选择器的信息
用法:
  python u2_inspect.py                # 自动连第一台 adb 设备
  python u2_inspect.py --serial 127.0.0.1:62001
  python u2_inspect.py --out ./dump --no-screenshot
"""
import argparse
import os
import re
import time
import xml.etree.ElementTree as ET

import uiautomator2 as u2


def u2_selector_for(node: dict) -> str:
    """给单个节点生成最优先的 U2 selector 字符串"""
    attrs = node.get("attrs", node)
    text = (attrs.get("text") or "").strip()
    rid = (attrs.get("resource-id") or "").strip()
    desc = (attrs.get("content-desc") or "").strip()
    cls = (attrs.get("class") or "").strip()
    if text and len(text) <= 20:
        return f'd(text="{text}")'
    if desc and len(desc) <= 20:
        return f'd(description="{desc}")'
    if rid:
        short_rid = rid.split("/")[-1]
        return f'd(resourceId="{rid}")  # 简写: {short_rid}'
    if text:
        return f'd(textContains="{text[:20]}")'
    if cls:
        return f'd(className="{cls}")'
    return "d()  # 无特征, 用 bounds / xpath"


def hamibot_selector_for(node: dict) -> str:
    """把 U2 selector 映射成 Hamibot 写法"""
    attrs = node.get("attrs", node)
    text = (attrs.get("text") or "").strip()
    rid = (attrs.get("resource-id") or "").strip()
    desc = (attrs.get("content-desc") or "").strip()
    cls = (attrs.get("class") or "").strip()
    if text and len(text) <= 20:
        return f'text("{text}").findOne(3000).click()'
    if desc and len(desc) <= 20:
        return f'desc("{desc}").findOne(3000).click()'
    if rid:
        return f'id("{rid}").findOne(3000).click()'
    if text:
        return f'textContains("{text[:20]}").findOne(3000).click()'
    if cls:
        return f'className("{cls}").findOne(3000)'
    b = attrs.get("bounds", "")
    m = re.findall(r"\d+", b or "")
    if len(m) == 4:
        x = (int(m[0]) + int(m[2])) // 2
        y = (int(m[1]) + int(m[3])) // 2
        return f'click({x}, {y});  // bounds {b}'
    return "// 无特征, 建议用 swipe / 坐标"


def parse_hierarchy(xml_path: str):
    tree = ET.parse(xml_path)
    nodes = []
    for elem in tree.iter("node"):
        a = elem.attrib
        clickable = a.get("clickable") == "true"
        nodes.append({"attrs": {
            "text": a.get("text", ""),
            "resource-id": a.get("resource-id", ""),
            "class": a.get("class", ""),
            "content-desc": a.get("content-desc", ""),
            "bounds": a.get("bounds", ""),
            "clickable": a.get("clickable", ""),
            "enabled": a.get("enabled", ""),
            "package": a.get("package", ""),
        }, "clickable": clickable})
    return nodes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--serial", default=None, help="adb serial, 如 127.0.0.1:62001, 不传用第一台")
    ap.add_argument("--out", default="./dump", help="输出目录")
    ap.add_argument("--no-screenshot", action="store_true")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    print(f"[U2] 连接设备 serial={args.serial or '(auto)'} ...")
    d = u2.connect(args.serial) if args.serial else u2.connect()
    print(f"[U2] 已连接: {d.serial}, 屏幕: {d.window_size()}")

    ts = time.strftime("%Y%m%d_%H%M%S")
    xml_path = os.path.join(args.out, f"hierarchy_{ts}.xml")
    png_path = os.path.join(args.out, f"screenshot_{ts}.png")

    xml = d.dump_hierarchy()
    with open(xml_path, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"[U2] hierarchy 已保存: {xml_path}")

    if not args.no_screenshot:
        d.screenshot(png_path)
        print(f"[U2] 截图已保存: {png_path}")

    nodes = parse_hierarchy(xml_path)
    clickables = [n for n in nodes if n["clickable"]]
    # 过滤掉空文本+空desc+空rid 的容器节点, 只看有意义的
    meaningful = [n for n in clickables if (n["attrs"]["text"] or n["attrs"]["content-desc"] or n["attrs"]["resource-id"])]
    print(f"[U2] 共 {len(nodes)} 节点, clickable={len(clickables)}, 有特征={len(meaningful)}")
    print("=" * 100)
    print("Top 30 可点击节点 (U2 -> Hamibot):")
    for i, n in enumerate(meaningful[:30]):
        a = n["attrs"]
        print(f"[{i}] text={a['text']!r} desc={a['content-desc']!r} rid={a['resource-id']!r} cls={a['class']!r} bounds={a['bounds']!r}")
        print(f"     U2:      {u2_selector_for(n)}")
        print(f"     Hamibot: {hamibot_selector_for(n)}")
    print("=" * 100)
    print("下一步: 把上面 Hamibot 行拷进 template.js, 把 findOne(3000).click() 按流程串起来即可.")


if __name__ == "__main__":
    main()
