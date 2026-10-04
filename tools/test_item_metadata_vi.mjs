import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadRuntime} from './test_runtime_localization.mjs';
const api=loadRuntime(fs.readFileSync('site/distribution.js','utf8'));
const plain=value=>JSON.parse(JSON.stringify(value));
const sample=JSON.parse(fs.readFileSync('data_bo_sung/stat_data.json','utf8'));
const noHan=value=>assert.ok(!/\p{Script=Han}/u.test(JSON.stringify(value)),JSON.stringify(value));
const box={kind:'box',quality:'优良',style:'刀剑江湖',contentType:'消耗品',count:2,source:'test'};
const voucher={kind:'voucher',faceValue:100,count:2,source:'test'};
const source=api.D1('T21_B01');
const material={kind:'material',name:source.name,description:source.description,effect:'Vật liệu thử nghiệm',quality:'优良',theme:'倒置住宅群',region:'悬挂的地下室',monsterId:'T21_B01',count:1};
const internal=api.Ph(api.adapterTransformIn({stat_data:sample}),[material,box]);
const receipt=api.cw(voucher);
internal.stat_data.主角.背包[receipt.name]=receipt.item;
const unchanged=plain(internal);
const host=api.adapterTransformOut(internal),bag=host.stat_data.protagonist.inventory;
assert.deepEqual(plain(internal),unchanged,'outbound must not mutate its input');
for(const reward of [material,box]){
 const item=bag[api.cw(reward).name];noHan(item.type);noHan(item.tags);noHan(Object.keys(item.effects));
 assert.equal(item.quantity,reward.count);
}
assert.equal(bag[api.cw(material).name].type,'Vật liệu');
assert.deepEqual(plain(bag[api.cw(material).name].tags),['Thư Hải','Vật liệu quái','Chủ đề: Khu Dân Cư Đảo Ngược','Khu vực: Tầng Hầm Treo Lơ Lửng','Nguồn: T21_B01']);
assert.equal(bag[api.cw(box).name].type,'Vật phẩm tiêu hao');
assert.ok(bag[api.cw(box).name].tags.includes('Loại nội dung: Vật phẩm tiêu hao'));
noHan(bag[receipt.name].tags);noHan(bag[receipt.name].type);
const roundTrip=api.adapterTransformIn(host);
for(const reward of [material,box,voucher]){
 const name=api.cw(reward).name;
 assert.equal(roundTrip.stat_data.主角.背包[name].类型,internal.stat_data.主角.背包[name].类型);
 assert.deepEqual(plain(roundTrip.stat_data.主角.背包[name].标签),plain(internal.stat_data.主角.背包[name].标签));
 assert.deepEqual(plain(roundTrip.stat_data.主角.背包[name].效果),plain(internal.stat_data.主角.背包[name].效果));
}
const redeemed=api.Sh(roundTrip,receipt.name,1);
assert.equal(redeemed.stat_data.命运点数,roundTrip.stat_data.命运点数+100);
assert.equal(redeemed.stat_data.主角.背包[receipt.name].数量,1);
const merged=api.adapterTransformOut(api.Ph(roundTrip,[box]));
assert.equal(merged.stat_data.protagonist.inventory[api.cw(box).name].quantity,4);
assert.deepEqual(plain(api.adapterTransformOut(api.adapterTransformIn(host))),plain(host),'round-trip must stabilize');
// Legacy and mixed metadata must migrate in any adapter write, including partners.
const legacy=api.adapterTransformIn({stat_data:sample});
const old=api.cwRaw(material).item;
old.标签.push('Tag riêng','来源:custom:id');
old.效果={'Vật liệu':'Riêng',素材:'Gốc'};
legacy.stat_data.主角.背包['Đồ cũ']=old;
legacy.stat_data.关系列表['Bạn thử']={背包:{'Đồ cũ':structuredClone(old)}};
legacy.stat_data.主角.背包['Đồ riêng']={类型:'材料',标签:['Tag riêng'],效果:{素材:'Nguyên văn'},数量:3};
const migrated=api.adapterTransformOut(legacy);
for(const actor of [migrated.stat_data.protagonist,migrated.stat_data.partners_list['Bạn thử']]){
 const item=actor.inventory['Đồ cũ'];assert.equal(item.type,'Vật liệu');assert.ok(item.tags.includes('Thư Hải'));
 assert.ok(item.tags.includes('Tag riêng'));assert.ok(item.tags.includes('Nguồn: custom:id'));
 assert.deepEqual(plain(item.effects),{'Vật liệu':'Riêng',素材:'Gốc'});
}
assert.equal(migrated.stat_data.protagonist.inventory['Đồ riêng'].type,'材料');
// Cover every known theme/region tag and preserve machine IDs on both directions.
for(const theme of api._u)for(const scene of theme.scenes){
 const state=api.adapterTransformIn({stat_data:sample});
 const item=api.cwRaw({...material,theme:theme.name,region:scene}).item;
 state.stat_data.主角.背包['fixture']=item;
 const localized=api.adapterTransformOut(state);noHan(localized.stat_data.protagonist.inventory.fixture.tags);
 assert.deepEqual(plain(api.adapterTransformIn(localized).stat_data.主角.背包.fixture.标签),plain(item.标签));
}
console.log('Item metadata Vietnamese: 144 regions, material/box/voucher round-trips, redemption, merging, legacy partners and custom data passed');
