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
  function send(body, type, status) {
    $done({response:{status:status || 200, headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'"},body:body}});
  }
  function esc(s) {return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function html(s) {
    var rows=s.items.slice().sort(function(a,b){return b.count-a.count || a.id.localeCompare(b.id);}).map(function(i){return '<tr><td>'+esc(i.id)+'</td><td>'+esc(i.count)+'</td><td>'+esc(i.lastAt)+'</td></tr>';}).join('');
    var events=s.recentResponses.slice().reverse().map(function(e){return '<tr><td>'+esc(e.at)+'</td><td>'+esc(e.path)+'</td><td>'+esc(e.status)+'</td><td>'+e.candidateCount+' / '+e.addedCount+' / '+e.omittedCount+'</td></tr>';}).join('');
    return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>G1 SKU Inspector</title><style>body{font:15px -apple-system,sans-serif;margin:20px;color:#202124;background:#f7f8fa}h1{font-size:24px}h2{font-size:18px}a,button{display:inline-block;padding:10px;background:#e8f0fe;color:#174ea6;border:0;border-radius:8px;margin:4px;text-decoration:none}section{background:white;padding:15px;border-radius:12px;margin:14px 0;overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}td,th{padding:8px;text-align:left;border-bottom:1px solid #ddd;overflow-wrap:anywhere}td:first-child{min-width:120px}p{line-height:1.5}</style><h1>Google One SKU Inspector</h1><p>本机脚本已接管 · Loon v'+VERSION+' · 只读采集</p><section>SKU：'+s.items.length+' ｜ 文本响应：'+s.scannedResponses+' ｜ 命中响应：'+s.matchedResponses+' ｜ 非文本：'+s.nonTextResponses+' ｜ 容量丢弃：'+s.omittedCount+'<p>最近采集：'+esc(s.lastAt || '尚无记录')+'</p><a href="/g1-sku-report">刷新</a><a href="/g1-sku-report?format=json">导出 JSON</a><a href="/g1-sku-report?clear=1">清空记录</a></section><section><h2>原始 SKU</h2><table><tr><th>商品 ID</th><th>次数</th><th>最后出现</th></tr>'+ (rows || '<tr><td colspan="3">暂无数据</td></tr>')+'</table></section><section><h2>最近响应</h2><table><tr><th>时间</th><th>路径类别</th><th>状态</th><th>候选 / 新增 / 丢弃</th></tr>'+ (events || '<tr><td colspan="4">暂无数据</td></tr>')+'</table></section><p>仅记录实际收到的字符串，不代表商品可购买或符合优惠资格。不会修改商品 ID、价格或响应正文。</p></html>';
  }
  try {
    if (report && typeof $response === 'undefined') {
      var query = url.split('?')[1] || '';
      if (/(?:^|&)clear=1(?:&|$)/.test(query)) {
        if ($request.method === 'POST') {
          if (!$persistentStore.write(JSON.stringify(fresh()),KEY)) throw Error('Clear failed');
          send(html(fresh()),'text/html');
        } else {send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><h2>确认清空本机 SKU 记录？</h2><form method="post" action="/g1-sku-report?clear=1"><button>确认清空</button></form><a href="/g1-sku-report">取消</a>','text/html');}
      } else if (/(?:^|&)format=json(?:&|$)/.test(query)) {send(JSON.stringify(load(),null,2),'application/json');}
      else {send(html(load()),'text/html');}
      return;
    }
    $done({});
  } catch(e) { console.log('[G1 Report] '+String(e)); send('Local report unavailable.','text/plain',500); }
})();
