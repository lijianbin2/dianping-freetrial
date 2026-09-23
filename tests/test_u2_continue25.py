import unittest
from unittest.mock import Mock

from work.u2_continue25 import (
    Config,
    Layout,
    card_key,
    center_of,
    detail_dist,
    has_level_block,
    is_eligible,
    is_meishi,
    parse_cards,
    parse_distance,
    select_target,
    do_one_detail,
)


def node(text="", bounds="[0,0][0,0]"):
    escaped = text.replace("&", "&amp;").replace('"', "&quot;")
    return f'<node text="{escaped}" bounds="{bounds}" />'


class LayoutTests(unittest.TestCase):
    def test_scales_from_reference_screen(self):
        layout = Layout(640, 1386)
        self.assertEqual(layout.center_x, 320)
        self.assertEqual(layout.y(2000), 1000)
        self.assertEqual(layout.card_value_min_y, 300)
        self.assertEqual(layout.card_click_max_y, 1050)


class BoundsTests(unittest.TestCase):
    def test_returns_center_for_non_empty_bounds(self):
        self.assertEqual(center_of("[10,20][30,60]"), (20, 40))

    def test_rejects_empty_or_reversed_bounds(self):
        self.assertIsNone(center_of("[0,0][0,0]"))
        self.assertIsNone(center_of("[10,20][5,60]"))
        self.assertIsNone(center_of("not bounds"))


class DistanceTests(unittest.TestCase):
    def test_converts_kilometers_and_meters(self):
        self.assertEqual(parse_distance("30km"), 30.0)
        self.assertEqual(parse_distance(" 950 m "), 0.95)
        self.assertEqual(parse_distance("1.5KM"), 1.5)

    def test_rejects_non_distance_text(self):
        self.assertIsNone(parse_distance("30公里"))
        self.assertIsNone(parse_distance("价值 100 元"))

    def test_detail_distance_uses_first_visible_distance(self):
        xml = "<hierarchy>" + node("商家") + node("28.5km", "[0,0][10,10]") + "</hierarchy>"
        self.assertEqual(detail_dist(xml), 28.5)


class PageTests(unittest.TestCase):
    def test_food_tab_requires_food_without_all_categories(self):
        self.assertTrue(is_meishi("<hierarchy>" + node("美食") + "</hierarchy>"))
        self.assertFalse(is_meishi("<hierarchy>" + node("美食") + node("全部分类") + "</hierarchy>"))

    def test_level_block_uses_visible_text_not_attributes(self):
        hidden = '<hierarchy><node text="" content-desc="等级不够" /></hierarchy>'
        visible = "<hierarchy>" + node("仅 Lv6-Lv8 可报名") + "</hierarchy>"
        self.assertIsNone(has_level_block(hidden))
        self.assertEqual(has_level_block(visible), "仅 Lv6")

    def test_detail_level_gate_stops_without_pressing_back(self):
        device = Mock()
        device.dump_hierarchy.return_value = (
            "<hierarchy>" + node("商家详情") + node("等级不够") + "</hierarchy>"
        )
        result = do_one_detail(device, {"dist": 20.0})
        self.assertEqual(result, "level_buzu")
        device.press.assert_not_called()


class CardTests(unittest.TestCase):
    def setUp(self):
        self.config = Config(value_min=100, distance_max=30.0)
        self.xml = "<hierarchy>" + "".join(
            [
                node("免费抽", "[0,100][1280,160]"),
                node("全部分类", "[900,100][1100,160]"),
                node("粤陈记·烧味", "[40,650][1240,700]"),
                node("100", "[500,800][620,840]"),
                node("30.0km", "[700,800][900,840]"),
            ]
        ) + "</hierarchy>"

    def test_parses_merchant_and_inclusive_thresholds(self):
        cards = parse_cards(self.xml)
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["name"], "粤陈记·烧味")
        self.assertEqual(cards[0]["val"], 100)
        self.assertEqual(cards[0]["dist"], 30.0)
        self.assertTrue(is_eligible(cards[0], self.config))

    def test_detects_applied_card(self):
        xml = self.xml.replace("</hierarchy>", node("已报名", "[500,850][700,890]") + "</hierarchy>")
        self.assertTrue(parse_cards(xml)[0]["applied"])

    def test_applied_card_is_recorded_without_becoming_target(self):
        card = {"y": 820, "val": 100, "dist": 30.0, "name": "粤陈记", "applied": True}
        seen = set()
        target, skipped = select_target([card], seen, self.config)
        self.assertIsNone(target)
        self.assertEqual(skipped, [card])
        self.assertEqual(seen, {card_key(card)})

    def test_anonymous_cards_at_different_positions_have_different_keys(self):
        first = {"y": 820, "val": 100, "dist": 20.0, "name": "", "applied": False}
        second = {"y": 1200, "val": 100, "dist": 20.0, "name": "", "applied": False}
        self.assertNotEqual(card_key(first), card_key(second))

    def test_malformed_xml_has_no_cards(self):
        self.assertEqual(parse_cards("<hierarchy>"), [])


if __name__ == "__main__":
    unittest.main()
