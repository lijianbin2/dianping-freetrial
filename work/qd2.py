import uiautomator2 as u2
S='adb-41db6aed-hUrFEI._adb-tls-connect._tcp'
d=u2.connect(S)
print(d.app_current(),flush=True)
x=d.dump_hierarchy(compressed=True)
open('H:/Codex/免费试脚本/work/now2.xml','w',encoding='utf-8').write(x)
print('ok',len(x),flush=True)

