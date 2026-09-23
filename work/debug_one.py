"""Read-only helper: print the cards currently visible on the phone."""

from __future__ import print_function

import argparse
import sys
from pathlib import Path


WORK_DIR = Path(__file__).resolve().parent
if str(WORK_DIR) not in sys.path:
    sys.path.insert(0, str(WORK_DIR))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--serial",
        default="adb-41db6aed-hUrFEI._adb-tls-connect._tcp",
        help="UIAutomator2 device serial",
    )
    args = parser.parse_args()

    try:
        import uiautomator2 as u2
    except ImportError as exc:
        parser.error("install dependencies with: python -m pip install -r requirements.txt")
        raise exc

    device = u2.connect(args.serial)
    xml = device.dump_hierarchy(compressed=True)
    from u2_continue25 import parse_cards

    print("CARDS", parse_cards(xml), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
