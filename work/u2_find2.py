import sys
sys.path.insert(0, chr(46))
import u2_prototype as P, uiautomator2 as u2, time
d=u2.connect(P.SERIAL)
for i in range(8):
    xml=P.dump(d)
    cards=P.parse_cards(xml)
    quals=[c for c in cards if c["val"]>100 and c["dist"]<20]
    print("SCR",i,cards,quals,flush=True)
    if quals:
        break
    d.swipe(640,2000,640,1200,0.7)
    time.sleep(1.8)

