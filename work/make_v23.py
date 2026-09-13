import io
src = "..\\hamibot_freetrial_V22.js"
dst = "..\\hamibot_freetrial_V23.js"
s = io.open(src, encoding="utf-8").read()
s = s.replace("V22", "V23")
old_w = "Math.abs(all[i].cy-y)<350"
assert old_w in s
s = s.replace(old_w, "Math.abs(all[i].cy-y)<200")
old_hit = "L(\"hit\"+val+\"yuan\"+dist+\"km y=\"+y);"
assert old_hit in s
new_hit = "L(\"hit\"+val+\"yuan\"+dist+\"km y=\"+y); if(y<600){L(\"skip y<600 fastfilter guard\"); continue;}"
s = s.replace(old_hit, new_hit)
io.open(dst, "w", encoding="utf-8", newline="\n").write(s)
print("wrote", dst, len(s))
