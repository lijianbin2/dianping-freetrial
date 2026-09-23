# -*- coding: utf-8 -*-
"""UIAutomator2 client for the Dianping free-trial food listing.

Start on the free-trial food list. The script keeps the current list
position, opens eligible merchants, registers when possible, and stops as
soon as the account-level gate is shown.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Iterable, Sequence


DEFAULT_SERIAL = "adb-41db6aed-hUrFEI._adb-tls-connect._tcp"
VAL_MIN = 100
DIST_MAX = 30.0

T_FREE = "免费抽"
T_WANT = "我要报名"
T_CONFIRM = "确认报名"
T_ALREADY = "已报名"
BOTTOM_KEYS = ("没有更多", "到底了", "已显示全部", "暂无更多")
LEVEL_KEYS = (
    "仅Lv6",
    "仅限Lv",
    "等级不够",
    "暂未满足",
    "当前等级",
    "仅 Lv6",
    "Lv6-Lv8",
)

BASE_WIDTH = 1280
BASE_HEIGHT = 2772
CARD_VALUE_MIN_Y = 600
CARD_CLICK_MAX_Y = 2100


def _clean(value: object) -> str:
    return str(value).replace(chr(0xFFFC), "?")


def log(message: object) -> None:
    print(_clean(message), flush=True)


def dump(device: Any) -> str:
    return device.dump_hierarchy(compressed=True)


def texts(xml: str) -> list[str]:
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return []

    result: list[str] = []
    for node in root.iter("node"):
        text = (node.attrib.get("text") or "").strip()
        if text:
            result.append(text)
    return result


def has_text(xml: str, expected: str) -> bool:
    return expected in texts(xml)


def is_free_list(xml: str) -> bool:
    return has_text(xml, T_FREE)


def is_meishi(xml: str) -> bool:
    return has_text(xml, "美食") and not has_text(xml, "全部分类")


def center_of(bounds: str) -> tuple[int, int] | None:
    """Return the center of a non-empty Android bounds rectangle."""
    match = re.fullmatch(
        r"\s*\[(-?\d+),(-?\d+)\]\s*\[\s*(-?\d+),(-?\d+)\s*\]\s*",
        bounds,
    )
    if not match:
        return None
    x1, y1, x2, y2 = map(int, match.groups())
    if x2 <= x1 or y2 <= y1:
        return None
    return ((x1 + x2) // 2, (y1 + y2) // 2)


def _node_center(node: ET.Element) -> tuple[int, int] | None:
    return center_of(node.attrib.get("bounds", ""))


def _node_middle_y(node: ET.Element) -> int | None:
    match = re.findall(r"-?\d+", node.attrib.get("bounds", ""))
    if len(match) != 4:
        return None
    y1, y2 = int(match[1]), int(match[3])
    if y2 <= y1:
        return None
    return (y1 + y2) // 2


def find_node_center(xml: str, expected: str) -> tuple[int, int] | None:
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return None
    for node in root.iter("node"):
        if (node.attrib.get("text") or "") == expected:
            center = _node_center(node)
            if center:
                return center
    return None


def parse_distance(text: str) -> float | None:
    match = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(km|m)", text.strip(), re.I)
    if not match:
        return None
    distance = float(match.group(1))
    if match.group(2).lower() == "m":
        distance /= 1000.0
    return distance


def detail_dist(xml: str) -> float | None:
    for text in texts(xml):
        distance = parse_distance(text)
        if distance is not None:
            return distance
    return None


def has_level_block(xml: str) -> str | None:
    visible_text = "\n".join(texts(xml))
    for keyword in LEVEL_KEYS:
        if keyword in visible_text:
            return keyword
    return None


@dataclass(frozen=True)
class Config:
    serial: str = DEFAULT_SERIAL
    value_min: int = VAL_MIN
    distance_max: float = DIST_MAX
    max_minutes: int = 100
    max_empty: int = 80


@dataclass(frozen=True)
class Layout:
    width: int
    height: int

    @classmethod
    def from_device(cls, device: Any) -> "Layout":
        width, height = device.window_size()
        return cls(max(int(width), 1), max(int(height), 1))

    def x(self, base_x: int) -> int:
        return round(base_x * self.width / BASE_WIDTH)

    def y(self, base_y: int) -> int:
        return round(base_y * self.height / BASE_HEIGHT)

    @property
    def center_x(self) -> int:
        return self.width // 2

    @property
    def card_value_min_y(self) -> int:
        return self.y(CARD_VALUE_MIN_Y)

    @property
    def card_click_max_y(self) -> int:
        return self.y(CARD_CLICK_MAX_Y)

    def swipe(self, device: Any, start_y: int, end_y: int, duration: float = 0.7) -> None:
        device.swipe(self.center_x, self.y(start_y), self.center_x, self.y(end_y), duration)


def wait_for_first_dump(device: Any, attempts: int = 3, delay: float = 5.0) -> str:
    xml = ""
    for attempt in range(attempts):
        xml = dump(device)
        if is_free_list(xml) or has_text(xml, "免费试"):
            return xml
        if attempt + 1 < attempts:
            log(f"首抓无页面文字(可能锁屏/加载中), 等{delay:g}秒重抓")
            time.sleep(delay)
    return xml


def ensure_meishi(device: Any) -> bool:
    xml = wait_for_first_dump(device)
    if is_meishi(xml):
        log("已在美食, 直接开工")
        return True

    category = find_node_center(xml, "全部分类")
    if not category:
        log("找不到全部分类, 停止(不做盲点)")
        return False

    log(f"点全部分类 {category}")
    device.click(*category)
    time.sleep(2.5)
    xml = dump(device)

    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        log("分类弹窗层级损坏, 停止(不点未知位置)")
        return False

    if not any((node.attrib.get("text") or "") == "全部分类" for node in root.iter("node")):
        log("全部分类弹窗未打开, 停止(不点可能误入频道的文字)")
        return False

    candidates = []
    for node in root.iter("node"):
        if (node.attrib.get("text") or "") == "美食":
            center = _node_center(node)
            if center:
                candidates.append(center)
    candidates.sort(key=lambda point: -point[1])
    log(f"美食候选 {candidates}")

    for point in candidates:
        device.click(*point)
        time.sleep(3)
        after = dump(device)
        if is_meishi(after):
            log("切到美食 OK")
            return True
        if not is_free_list(after):
            log("点完跳出免费试, 停止(不返回)")
            return False
    return False


def _parse_values(xml: str, min_y: int) -> list[tuple[int, int]]:
    values: list[tuple[int, int]] = []
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return values

    for node in root.iter("node"):
        text = node.attrib.get("text") or ""
        if not re.fullmatch(r"[\d\xa0 ]+", text) or not text.strip():
            continue
        middle_y = _node_middle_y(node)
        if middle_y is None or middle_y <= min_y:
            continue
        digits = re.sub(r"\D", "", text)
        if digits:
            values.append((middle_y, int(digits)))
    return values


def _parse_distances(xml: str, min_y: int) -> list[tuple[int, float]]:
    distances: list[tuple[int, float]] = []
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return distances

    for node in root.iter("node"):
        distance = parse_distance(node.attrib.get("text") or "")
        middle_y = _node_middle_y(node)
        if distance is not None and middle_y is not None and middle_y > min_y:
            distances.append((middle_y, distance))
    return distances


def _parse_titles(xml: str, min_y: int) -> list[tuple[int, str]]:
    titles: list[tuple[int, str]] = []
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return titles

    for node in root.iter("node"):
        text = (node.attrib.get("text") or "").strip()
        if len(text) < 4 or ("|" not in text and "·" not in text):
            continue
        if "km" in text.lower() or parse_distance(text) is not None:
            continue
        middle_y = _node_middle_y(node)
        if middle_y is not None and middle_y > min_y:
            titles.append((middle_y, text))
    return titles


def _applied_rows(xml: str) -> list[int]:
    rows: list[int] = []
    try:
        root = ET.fromstring(xml)
    except (ET.ParseError, TypeError):
        return rows

    for node in root.iter("node"):
        if "已报名" in (node.attrib.get("text") or ""):
            middle_y = _node_middle_y(node)
            if middle_y is not None:
                rows.append(middle_y)
    return rows


def parse_cards(xml: str, min_y: int = CARD_VALUE_MIN_Y) -> list[dict[str, object]]:
    values = _parse_values(xml, min_y)
    distances = _parse_distances(xml, min_y)
    titles = _parse_titles(xml, min_y - 200)
    applied_rows = _applied_rows(xml)

    cards: list[dict[str, object]] = []
    for value_y, value in values:
        nearest = min(
            ((abs(distance_y - value_y), distance_y, distance) for distance_y, distance in distances),
            key=lambda item: item[0],
            default=None,
        )
        if nearest is None or nearest[0] >= 200:
            continue

        name = ""
        name_distance = 450
        for title_y, title in titles:
            delta = value_y - title_y
            if 0 < delta < name_distance:
                name = title
                name_distance = delta

        cards.append(
            {
                "y": value_y,
                "val": value,
                "dist": nearest[2],
                "name": name,
                "applied": any(abs(applied_y - value_y) < 180 for applied_y in applied_rows),
            }
        )

    cards.sort(key=lambda card: int(card["y"]))
    unique: list[dict[str, object]] = []
    for card in cards:
        if not unique or abs(int(card["y"]) - int(unique[-1]["y"])) > 80:
            unique.append(card)
    return unique


def card_key(card: dict[str, object]) -> tuple[object, ...]:
    name = str(card.get("name") or "").strip()
    if name:
        return (name, card["val"], card["dist"])
    return ("anonymous", int(card["y"]), card["val"], card["dist"])


def is_eligible(card: dict[str, object], config: Config) -> bool:
    return int(card["val"]) >= config.value_min and float(card["dist"]) <= config.distance_max


def select_target(
    cards: Iterable[dict[str, object]], seen: set[tuple[object, ...]], config: Config
) -> tuple[dict[str, object] | None, list[dict[str, object]]]:
    skipped_applied: list[dict[str, object]] = []
    for card in cards:
        if card_key(card) in seen:
            continue
        if card.get("applied"):
            seen.add(card_key(card))
            skipped_applied.append(card)
            continue
        if is_eligible(card, config):
            return card, skipped_applied
    return None, skipped_applied


def _back_and_report(device: Any, context: str) -> bool:
    log(f"{context}, 单次返回")
    device.press("back")
    time.sleep(2)
    current = dump(device)
    if is_free_list(current):
        log("已回列表")
        return True
    log("未回列表, 就地停止")
    return False


def do_one_detail(device: Any, card: dict[str, object]) -> str:
    time.sleep(1)
    xml = dump(device)
    if is_free_list(xml) and not has_text(xml, T_WANT):
        log("还在列表, 卡点没进去")
        return "tap_miss"

    level_keyword = has_level_block(xml)
    if level_keyword:
        log(f"详情直接等级不够: {level_keyword}, 就地停止")
        return "level_buzu"

    detail_distance = detail_dist(xml)
    if detail_distance is not None:
        log(
            f"详情距离 {detail_distance:g}km "
            f"(列表{card['dist']}, 以列表为准不跳过)"
        )

    if has_text(xml, T_ALREADY) and not has_text(xml, T_WANT):
        _back_and_report(device, "已报名")
        return "already"
    if not has_text(xml, T_WANT):
        _back_and_report(device, "详情无入口")
        return "no_entry"

    button = find_node_center(xml, T_WANT)
    if not button:
        _back_and_report(device, "报名按钮坐标无效")
        return "no_entry"

    log(f"点我要报名 {button}")
    device.click(*button)
    time.sleep(3)
    confirm_xml = dump(device)

    level_keyword = has_level_block(confirm_xml)
    if level_keyword:
        log(f"确认页等级不够: {level_keyword}, 就地停止")
        return "level_buzu"

    confirm = find_node_center(confirm_xml, T_CONFIRM)
    if not confirm:
        _back_and_report(device, "无有效确认报名按钮")
        return "no_confirm"

    log(f"点确认报名 {confirm}")
    device.click(*confirm)
    time.sleep(3.5)
    result_xml = dump(device)

    level_keyword = has_level_block(result_xml)
    if level_keyword:
        log(f"结果页等级不够: {level_keyword}, 就地停止")
        return "level_buzu"

    log("报名结果片段: " + "|".join(texts(result_xml)[:30]))
    if _back_and_report(device, "报名结果页"):
        return "ok"
    return "lost"


def _connect(serial: str) -> Any:
    try:
        import uiautomator2 as u2
    except ImportError as exc:
        raise RuntimeError("缺少 uiautomator2，请先执行: python -m pip install -r requirements.txt") from exc
    return u2.connect(serial)


def run(config: Config) -> int:
    try:
        device = _connect(config.serial)
        layout = Layout.from_device(device)
    except Exception as exc:
        log(f"连接或设备信息读取失败, 退出: {exc}")
        return 2

    log(f"连上 {device.info.get('productName')} {device.app_current()}")
    log("V25-continue start")
    log(f"continue mode, keep position; screen={layout.width}x{layout.height}")
    log(f"筛选规则: 价值>={config.value_min}, 距离<={config.distance_max:g}km")

    try:
        if not ensure_meishi(device):
            log("美食确认失败, 退出")
            return 3
    except Exception as exc:
        log(f"美食确认异常, 退出: {exc}")
        return 3

    seen: set[tuple[object, ...]] = set()
    spotted: dict[tuple[object, ...], str] = {}
    done: set[tuple[object, ...]] = set()
    empty = 0
    started_at = time.monotonic()
    top_repeat: tuple[object, ...] | None = None
    top_repeat_count = 0

    def report_missed() -> None:
        missed = [(key, name) for key, name in spotted.items() if key not in done]
        log(f"漏网清单共{len(missed)}家: {missed}")

    while True:
        if time.monotonic() - started_at > config.max_minutes * 60:
            report_missed()
            log(f"运行超过{config.max_minutes}分钟, 就地停止")
            return 0

        try:
            xml = dump(device)
            cards = parse_cards(xml, layout.card_value_min_y)
        except Exception as exc:
            log(f"dump/parse fail wait: {exc}")
            time.sleep(2)
            continue

        if not is_free_list(xml):
            report_missed()
            log("不在免费试列表(可能残留详情/确认页), 就地停止")
            return 0

        log(f"本屏卡: {cards}")
        target, skipped_applied = select_target(cards, seen, config)
        for card in skipped_applied:
            log(
                "跳过已报名不点 "
                f"val={card['val']} dist={card['dist']} y={card['y']}"
            )
        if target is None:
            empty += 1
            log(f"无合格 empty {empty}/{config.max_empty} 上滑")
            if any(has_text(xml, key) for key in BOTTOM_KEYS):
                report_missed()
                log("看到触底文案, 结束")
                return 0
            if empty >= config.max_empty:
                report_missed()
                log("连续无新合格卡, 结束")
                return 0
            if empty % 10 == 0:
                log(f"仍在翻页 empty={empty}")
            if empty > 10:
                layout.swipe(device, 2000, 800)
            else:
                layout.swipe(device, 2000, 1200)
            time.sleep(2.2)
            continue

        empty = 0
        log(f"开卡 {target} x={layout.center_x}")
        key = card_key(target)

        if int(target["y"]) < layout.card_value_min_y:
            log("顶部卡疑似快筛/半遮挡, 下滑带回可点区重扫(不记DONE)")
            spotted.setdefault(key, str(target.get("name") or ""))
            if key == top_repeat:
                top_repeat_count += 1
            else:
                top_repeat = key
                top_repeat_count = 1
            if top_repeat_count >= 3:
                log("顶部卡3次带不回, 记DONE翻过")
                seen.add(key)
                done.add(key)
                top_repeat = None
                top_repeat_count = 0
                layout.swipe(device, 1800, 1200, 0.6)
                time.sleep(1.5)
                continue
            device.swipe(
                layout.center_x,
                layout.y(1200),
                layout.center_x,
                layout.y(1700),
                0.6,
            )
            time.sleep(1.5)
            continue

        if int(target["y"]) > layout.card_click_max_y:
            log("目标太靠底, 先上滑再重扫")
            layout.swipe(device, 2000, 1000)
            time.sleep(1.8)
            continue

        spotted.setdefault(key, str(target.get("name") or ""))
        seen.add(key)
        device.click(layout.center_x, int(target["y"]))
        time.sleep(3)

        try:
            result = do_one_detail(device, target)
        except Exception as exc:
            report_missed()
            log(f"详情异常, 就地停止: {exc}")
            return 0

        log(f"本单结果: {result}")
        if result in ("ok", "already", "no_entry", "no_confirm"):
            done.add(key)
        elif result == "level_buzu":
            report_missed()
            log("等级不够, 全剧终")
            return 0
        elif result == "lost":
            report_missed()
            log("页面丢失, 停止")
            return 0
        elif result == "tap_miss":
            layout.swipe(device, 1800, 1200, 0.6)
            time.sleep(1.5)
            continue

        layout.swipe(device, 1800, 1400, 0.5)
        time.sleep(1.5)


def parse_args(argv: Sequence[str] | None = None) -> Config:
    default_serial = os.environ.get("U2_SERIAL", DEFAULT_SERIAL)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--serial",
        default=default_serial,
        help=f"UIAutomator2 设备地址 (默认: {DEFAULT_SERIAL}; 也可用 U2_SERIAL)",
    )
    parser.add_argument("--value-min", type=int, default=VAL_MIN, help="最低价值，包含边界")
    parser.add_argument("--distance-max", type=float, default=DIST_MAX, help="最远距离 km，包含边界")
    parser.add_argument("--max-minutes", type=int, default=100, help="最长运行分钟数")
    parser.add_argument("--max-empty", type=int, default=80, help="连续无新合格卡次数")
    args = parser.parse_args(argv)
    if args.value_min < 0 or args.distance_max < 0:
        parser.error("value-min 和 distance-max 不能为负数")
    if args.max_minutes <= 0 or args.max_empty <= 0:
        parser.error("max-minutes 和 max-empty 必须大于 0")
    return Config(
        serial=args.serial,
        value_min=args.value_min,
        distance_max=args.distance_max,
        max_minutes=args.max_minutes,
        max_empty=args.max_empty,
    )


def main(argv: Sequence[str] | None = None) -> int:
    try:
        return run(parse_args(argv))
    except KeyboardInterrupt:
        log("用户中断, 已停止; 未执行额外返回操作")
        return 130


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    raise SystemExit(main())
