import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
export function loadRuntime(source){
 const context={console,setTimeout,clearTimeout,structuredClone};context.window=context;
 const instrumented=source.includes('window.Runtime=')?source:source.replace('return C5(HA);})();','window.Runtime={O0,Co,Fn,Xk,Kt,_u,Do,I1,B7,Hi,wu,Eh,cw,cwRaw,Ph,Sh,D1,T1,A1,adapterTransformIn,adapterTransformOut,bsTextVi,bsDisplayName,bsActionSource,bsNormalizeInventory,fa,BS_RUNTIME_LOCALE};return C5(HA);})();');
 vm.runInNewContext(instrumented,context);
 return context.Runtime;
}
export function mechanicsDigest(api){
 const omit=new Set(['name','description','reason','summary','implementation','implemented','original']);
 const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!omit.has(key)).map(([key,child])=>[key,clean(child)])):value;
 const hash=createHash('sha256');let count=0;
 for(const id of [...Object.keys(api.Fn),'COMMON_MIMIC'])for(const level of [1,5,9,13,17,21,25]){
  const card=(id==='COMMON_MIMIC'?api.Co(level):api.O0(id,level)).card;
  hash.update(JSON.stringify(clean(card)));count++;
 }
 return {cards:count,sha256:hash.digest('hex')};
}
if(process.argv[1]?.endsWith('test_runtime_localization.mjs')){
 const api=loadRuntime(fs.readFileSync('site/distribution.js','utf8'));
 const noHan=text=>{assert.equal(typeof text,'string');assert.ok(!/\p{Script=Han}/u.test(text),text);assert.ok(!text.includes('undefined'),text)};
 let cards=0,effects=0;
 for(const id of [...Object.keys(api.Fn),'COMMON_MIMIC'])for(const level of [1,5,9,13,17,21,25]){
  const data=id==='COMMON_MIMIC'?api.Co(level):api.O0(id,level);cards++;
  for(const skill of data.card.skills){
   noHan(api.bsDisplayName(skill.name));const action=skill.mapping.action;if(!action)continue;
   noHan(api.bsActionSource(action,data.card.numeric));
   for(const text of api.fa(action,data.card.numeric)){noHan(text);effects++;}
  }
 }
 for(const entry of Object.values(api.Xk)){noHan(api.bsTextVi(entry.name));noHan(entry.voice);noHan(entry.description);}
 for(const relic of Object.values(api.Kt)){noHan(api.bsTextVi(relic.name));noHan(relic.description);}
 for(const theme of api._u){noHan(api.bsTextVi(theme.name));for(const scene of theme.scenes)noHan(api.bsTextVi(scene));}
 const events=[...api.I1,...Object.values(api.B7).flat()];
 for(const event of events){
  noHan(api.bsTextVi(event.title));noHan(api.bsTextVi(event.body));
  for(const choice of event.choices){noHan(api.bsTextVi(choice.label));if(choice.costs)noHan(api.T1(choice,[{name:'Elaron',current:{hp:500,mp:300,sp:300}}]));}
 }
 const box={kind:'box',quality:'优良',style:'刀剑江湖',contentType:'消耗品',count:1,source:'刀剑江湖'};
 assert.equal(api.wu(box),'Ưu Tú · Đao Kiếm Giang Hồ · Hộp Mù vật phẩm tiêu hao');noHan(api.Eh(box));
 noHan(api.bsTextVi('转化为「史诗·心弦冲击」：造成800点基础精神伤害，另受精神与层级加成。'));
 assert.match(api.bsTextVi('为铸成天下第一剑，他将自身投入炉中。剑终究没有铸成。'),/kiếm/i);
 noHan(api.bsTextVi('快到看不见的双刀！能练到这种程度，吃了多少苦啊，真想给它鼓掌。'));
 const legacy=api.cwRaw(box),translated=api.cw(box),inventory={[legacy.name]:{...legacy.item,数量:2},[translated.name]:{...translated.item,数量:3}};
 api.bsNormalizeInventory(inventory);assert.equal(Object.keys(inventory).length,1);assert.equal(inventory[translated.name].数量,5);
 assert.equal(inventory[translated.name].品质,'优良');assert.deepEqual(Array.from(inventory[translated.name].标签),Array.from(legacy.item.标签));
 const sample=JSON.parse(fs.readFileSync('data_bo_sung/stat_data.json','utf8'));
 const inbound=api.adapterTransformIn({stat_data:sample});
 const host=api.adapterTransformOut(api.Ph(inbound,[box]));
 assert.equal(host.stat_data.protagonist.inventory[translated.name].quantity,1);
 noHan(host.stat_data.protagonist.inventory[translated.name].description);
 for(const text of Object.values(host.stat_data.protagonist.inventory[translated.name].effects))noHan(text);
 assert.equal(host.stat_data.主角,undefined);assert.equal(host._mvuAdapterMeta,undefined);
 const collision={[legacy.name]:{...legacy.item,数量:2},[translated.name]:{...translated.item,品质:'稀有',数量:3}};
 api.bsNormalizeInventory(collision);assert.equal(Object.values(collision).reduce((n,item)=>n+item.数量,0),5);assert.equal(Object.keys(collision).length,2);
 const untouched={'Vật phẩm của anh':{标签:['riêng'],描述:'原文 của anh',数量:2}};api.bsNormalizeInventory(untouched);assert.equal(untouched['Vật phẩm của anh'].描述,'原文 của anh');
 const event={costs:[],results:[{kind:'relic_grant',id:'R015'}],requirements:[]};noHan(api.T1(event,[]));assert.match(api.T1(event,[]),/Giấy Nợ Ứng Trước/);
 noHan(api.T1({...event,results:[],risks:[{weight:1,results:[{kind:'reward',reward:'box',amount:1,quality:'优良'}]}]},[]));
 const baseline=JSON.parse(fs.readFileSync('tools/runtime-mechanics-baseline.json','utf8'));assert.deepEqual(mechanicsDigest(api),{cards:baseline.cards,sha256:baseline.sha256});
 console.log(`Runtime Vietnamese: ${cards} monster tiers, ${effects} effects, 432 materials, 60 relics, ${events.length} events; inventory migration and unchanged mechanics passed`);
 if(process.argv.includes('--ui-fixture')){
  let fixture=fs.readFileSync('site/distribution.js','utf8');
  fixture=fixture.replace('newGame:()=>J0(R1(),Date.now()>>>0)',`newGame:()=>{let state=J0(R1(),12345);state.region.things.push({id:'vi-supplier-fixture',kind:'supplier',x:state.x+1,z:state.z,name:hi,used:false,foes:[]});state.run.rewards.push(${JSON.stringify(box)});state.run.rewards.push({kind:'material',name:Xk.T07_B01.name,description:Xk.T07_B01.description,effect:O1(Xk.T07_B01.name,'刀剑江湖','铸剑山庄'),quality:'优良',count:1,theme:'刀剑江湖',region:'铸剑山庄',monsterId:'T07_B01',source:'铸剑山庄'});return state}`);
  fixture=fixture.replace('storageKey:"booksea-expedition-random-v2"','storageKey:"booksea-localization-visual-fixture"');
  fs.writeFileSync('scratch/runtime-visual-fixture.js',fixture);
  fs.writeFileSync('scratch/runtime-visual-fixture.html','<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kiểm tra Việt hóa runtime</title><div id="root"></div><script src="runtime-visual-fixture.js"></script><script>(async()=>{let base=new URL("/site/",location.href),manifest=await(await fetch(new URL("release-manifest.json",base))).json();await BookseaDistribution.boot(document.getElementById("root"),{base,manifest,mode:"standalone"});})();</script></html>');
  console.log('Visual fixture saved in scratch/runtime-visual-fixture.html');
 }
}
