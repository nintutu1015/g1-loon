const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync(__dirname+'/g1-loon.js','utf8');const store=new Map();
function run(url,body,arg,method='GET',isResponse=true){let result,n=0;const ctx={$request:{url,method},$argument:arg,$persistentStore:{read:k=>store.get(k),write:(v,k)=>{store.set(k,v);return true}},$done:x=>{result=x;n++},console:{log(){}}};if(isResponse)ctx.$response={body};vm.runInNewContext(code,ctx);assert.equal(n,1);return JSON.parse(JSON.stringify(result));}
const base='https://one.google.com/',report=base+'g1-sku-report';
function data(){return JSON.parse(run(report+'?format=json',undefined,null,'GET',false).response.body)}
assert.deepEqual(run(base+'ai?private=secret','"g1.ios.2tb.m" "g1.ios.2tb.m" "com.google.one.test"'),{});
assert.equal(data().items.length,2);assert.equal(data().items[0].count,2);assert.equal(data().recentResponses[0].path,'/ai');assert.ok(!JSON.stringify(data()).includes('secret'));
run(base+'plans','g1.ios.2tb.m');assert.equal(data().items[0].count,3);assert.equal(data().recentResponses.at(-1).status,'known-skus');
run(base,undefined);assert.equal(data().nonTextResponses,1);
run(report,'g1.ignored');assert.equal(data().items.length,2);
assert.match(run(report,undefined,null,'GET',false).response.body,/本机脚本已接管/);
run(report+'?clear=1',undefined,null,'GET',false);assert.equal(data().items.length,2);
run(report+'?clear=1',undefined,null,'POST',false);assert.equal(data().items.length,0);
run(base,Array.from({length:101},(_,i)=>'g1.test.'+i).join(' '),{maxItems:100,history:0});assert.equal(data().items.length,100);assert.equal(data().omittedCount,1);assert.equal(data().recentResponses.length,0);
console.log('PASS: collection, duplicates, privacy, non-text, report exclusion, HTML, JSON, confirmed reset, capacity and history settings');
