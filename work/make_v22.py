import io
src = "..\\hamibot_freetrial_V21.js"
dst = "..\\hamibot_freetrial_V22.js"
s = io.open(src, encoding="utf-8").read()
s = s.replace("V21", "V22")
old_tap = "L(\"no quanfenlei text, tap 481,1529\"); var sx=device.width/1280,sy=device.height/2772; click(481*sx,1529*sy);"
assert old_tap in s, "tap anchor missing"
s = s.replace(old_tap, "L(\"no quanfenlei, stop (V22: no blind tap)\"); return false;")
anchor = "L(\"doBaoMing start pkg=\"+currentPackage());"
assert anchor in s, "detail anchor missing"
insert = anchor + """
  // V22 detail recheck (U2 parity): detail distance + already-registered
  try{
    var _dt="";
    try{ var _all=className("android.widget.TextView").find(); for(var _di=0;_di<_all.length&&_di<80;_di++){ try{_dt+=_all[_di].text()+"|";}catch(_e){} } }catch(_e){}
    var _dm=_dt.match(/([0-9]+(\\.[0-9]+)?)km/);
    if(_dm&&parseFloat(_dm[1])>=20){ L("detail far "+_dm[1]+"km, skip"); if(!guardBack("far"))return "lost"; return "far"; }
  }catch(_e){}
  try{
    var _hasWant=null; try{_hasWant=text("\\u6211\\u8981\\u62a5\\u540d").findOnce();}catch(_e){}
    var _hasDone=null; try{_hasDone=text("\\u5df2\\u62a5\\u540d").findOnce();}catch(_e){}
    if(!_hasWant&&_hasDone){ L("already registered, skip"); if(!guardBack("already"))return "lost"; return "already"; }
  }catch(_e){}"""
s = s.replace(anchor, insert)
old_br = "if(r==\"no_entry\"||r==\"no_confirm\")"
assert old_br in s, "branch anchor missing"
s = s.replace(old_br, "if(r==\"no_entry\"||r==\"no_confirm\"||r==\"far\"||r==\"already\")")
io.open(dst, "w", encoding="utf-8", newline="\n").write(s)
print("wrote", dst, len(s))
