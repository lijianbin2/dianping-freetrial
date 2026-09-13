toast("SMOKE start");
sleep(800);
toast("SMOKE ok 1");
try { toast("pkg="+currentPackage()); } catch(e) { toast("no pkg:"+e); }
sleep(800);
toast("SMOKE end");
