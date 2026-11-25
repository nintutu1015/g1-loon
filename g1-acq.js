// G1 SKU Inspector for Loon. Read only: never modifies upstream requests or responses.
(function () {
  'use strict';
  var KEY = 'g1.loon.inspector.v1';
  var VERSION = '1.0.0';
  var url = String($request.url || '');
  var report = /^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url);
  var arg = typeof $argument === 'object' && $argument ? $argument : {};
  var cap = [100,300,500].indexOf(Number(arg.maxItems)) >= 0 ? Number(arg.maxItems) : 300;
  var history = [0,10,20].indexOf(Number(arg.history)) >= 0 ? Number(arg.history) : 10;
  function fresh() { return {version:VERSION, scannedResponses:0, matchedResponses:0, nonTextResponses:0, omittedCount:0, lastAt:null, items:[], recentResponses:[]}; }
  function load() {
    var raw = $persistentStore.read(KEY);
    if (!raw) return fresh();
    var obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.items) || !Array.isArray(obj.recentResponses)) throw Error('Invalid local records');
    return obj;
  }
  function pathCategory(u) {
    var p=u.replace(/^https:\/\/one\.google\.com/,'').split(/[?#]/)[0];
    if (p==='/' || p==='/ai' || p==='/plans') return p;
    if (/^\/_\/[^/]+\/data\/batchexecute\/?$/.test(p)) return '/_/…/data/batchexecute';
    return '[其他路径]';
  }
  try {
    if (report || !/^https:\/\/one\.google\.com\//.test(url) || typeof $response === 'undefined') {$done({});return;}
    var s=load(), at=new Date().toISOString(), body=$response.body;
    var event={at:at,path:pathCategory(url),status:'no-skus',candidateCount:0,addedCount:0,omittedCount:0};
    if (typeof body !== 'string') {s.nonTextResponses++;event.status='non-text';}
    else {
      s.scannedResponses++;
      var counts=Object.create(null), re=/(?:^|[^a-zA-Z0-9_.-])((?:g1\.|com\.google\.one\.)[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*)(?![a-zA-Z0-9_.-])/g, m;
      while ((m=re.exec(body))!==null) {if(m[1].length<=240) counts[m[1]]=(counts[m[1]]||0)+1;}
      var ids=Object.keys(counts);event.candidateCount=ids.length;
      if(ids.length) s.matchedResponses++;
      var existing=Object.create(null);s.items.forEach(function(i){existing[i.id]=i;});
      ids.forEach(function(id){var i=existing[id];if(i){i.count+=counts[id];i.lastAt=at;}else if(s.items.length<cap){s.items.push({id:id,count:counts[id],firstAt:at,lastAt:at});event.addedCount++;}else{event.omittedCount++;}});
      s.omittedCount+=event.omittedCount;
      event.status=event.addedCount?'new-skus':event.omittedCount?'limit-reached':ids.length?'known-skus':'no-skus';
    }
    s.lastAt=at;s.version=VERSION;
    s.recentResponses=history ? s.recentResponses.concat(event).slice(-history) : [];
    var saved=$persistentStore.write(JSON.stringify(s),KEY);
    console.log('[G1 Loon] '+event.status+' candidates='+event.candidateCount+' added='+event.addedCount+' saved='+Boolean(saved));
    $done({});
  } catch(e) {console.log('[G1 Loon] '+String(e));$done({});}
})();
