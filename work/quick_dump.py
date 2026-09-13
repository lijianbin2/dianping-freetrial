import uiautomator2 as u2
SERIAL='adb-41db6aed-hUrFEI._adb-tls-connect._tcp'
d=u2.connect(SERIAL)
print(d.app_current(), flush=True)
open(r'H:\Codex\免费试脚本\work\now.xml','w',encoding='utf-8').write(d.dump_hierarchy(compressed=True))
print('dumped', flush=True)

