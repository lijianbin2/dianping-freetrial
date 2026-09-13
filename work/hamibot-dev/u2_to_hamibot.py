# -*- coding: utf-8 -*-
"""
U2 selector -> Hamibot selector 翻译器
用法:
  python u2_to_hamibot.py 'd(text="登录")'
  python u2_to_hamibot.py 'd(resourceId="com.x.y:id/btn", textContains="确定")'
  echo 'd(description="搜索")' | python u2_to_hamibot.py
"""
import re
import sys

PATTERNS = [
    (re.compile(r'text\s*=\s*"([^"]+)"'), lambda m: f'text("{m.group(1)}")'),
    (re.compile(r"textContains\s*=\s*\"([^\"]+)\""), lambda m: f'textContains("{m.group(1)}")'),
    (re.compile(r"textMatches\s*=\s*\"([^\"]+)\""), lambda m: f'textMatches("{m.group(1)}")'),
    (re.compile(r'resourceId\s*=\s*"([^"]+)"'), lambda m: f'id("{m.group(1)}")'),
    (re.compile(r'className\s*=\s*"([^"]+)"'), lambda m: f'className("{m.group(1)}")'),
    (re.compile(r'description\s*=\s*"([^"]+)"'), lambda m: f'desc("{m.group(1)}")'),
    (re.compile(r'descriptionContains\s*=\s*"([^"]+)"'), lambda m: f'descContains("{m.group(1)}")'),
    (re.compile(r'descriptionMatches\s*=\s*"([^"]+)"'), lambda m: f'descMatches("{m.group(1)}")'),
]

CLICK = re.compile(r'\.click\s*\(\s*\)')
LONG_CLICK = re.compile(r'\.long_click\s*\(\s*\)')


def translate(line: str) -> str:
    s = line.strip()
    if not s:
        return ""
    # d(...) -> 链式
    m = re.match(r"d\((.*)\)\s*(.*)$", s)
    if not m:
        return f"// 无法解析: {s}"
    inner, tail = m.group(1), (m.group(2) or "").strip()
    parts = []
    rest = inner
    # 简单按逗号切 (假设值内无逗号)
    for chunk in [c.strip() for c in rest.split(",") if c.strip()]:
        done = False
        for pat, fn in PATTERNS:
            mm = pat.search(chunk)
            if mm:
                parts.append(fn(mm))
                done = True
                break
        if not done:
            parts.append(f"// 未映射:{chunk}")
    base = ".".join(parts) if parts else "// 空选择器"
    if LONG_CLICK.search(tail):
        return f"{base}.findOne(3000).longClick();"
    if CLICK.search(tail):
        return f"{base}.findOne(3000).click();"
    if tail:
        return f"{base}  // 尾部 {tail} 需手动改写 (如 set_text -> setText)"
    return f"{base}.findOne(3000);"


def main():
    if len(sys.argv) > 1:
        print(translate(sys.argv[1]))
        return
    print("// 从 stdin 读取, 每行一个 U2 selector, Ctrl+C 退出")
    for line in sys.stdin:
        out = translate(line)
        if out:
            print(out)


if __name__ == "__main__":
    main()

