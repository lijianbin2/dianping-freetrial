import uiautomator2 as u2, xml.etree.ElementTree as ET, re
SERIAL='adb-41db6aed-hUrFEI._adb-tls-connect._tcp'
d=u2.connect(SERIAL)
xml=d.dump_hierarchy(compressed=True)
open('H:/Codex/免费试脚本/work/live.xml','w',encoding='utf-8').write(xml)
print('dump ok len',len(xml))
import u2_prototype as P
print('is_meishi',P.is_meishi(xml))
print(P.parse_cards(xml))

