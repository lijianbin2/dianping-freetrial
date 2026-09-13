import xml.etree.ElementTree as ET
p=r\"work/hamibot-dev/dump/hierarchy_20260913_021035.xml\"
root=ET.parse(p).getroot()
parent={c:pn for pn in root.iter() for c in pn}
keys=[\"全部商区\",\"全部分类\",\"智能排序\",\"更多筛选\"]
for k in keys:
    print(\"---\",k)
    for n in root.iter(\"node\"):
        t=(n.get(\"text\") or \"\").strip()
        if k in t:
            cur=n; d=0
            while cur is not None and d<4:
                print(\" \",d,cur.get(\"class\"),repr(cur.get(\"text\")),cur.get(\"clickable\"),cur.get(\"bounds\"))
                if cur.get(\"clickable\")==\"true\" and d>0:
                    break
                cur=parent.get(cur); d+=1

