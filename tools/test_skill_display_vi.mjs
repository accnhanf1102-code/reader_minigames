import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('site/distribution.js', 'utf8').replace(
  'return C5(HA);})();',
  'window.SkillDisplay={fa,G5,Fd,Ip,wc,Y5,W5,bsDisplayName,bsElementLabel,Bp,Eb,T5,hc};return C5(HA);})();',
);
const sandbox = {console,setTimeout,clearTimeout,structuredClone,crypto};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const d=sandbox.SkillDisplay;
const amount=(flat=0,attribute='none',factor=0)=>({flat,attribute,factor,scale:factor?'host_tier':'flat',maxResource:'none',maxFraction:0});
const duration={clock:'permanent',value:1};
const cost={hp:{flat:0,maxFraction:.1,currentFraction:0},mp:{flat:5,maxFraction:0,currentFraction:.2},sp:{flat:0,maxFraction:0,currentFraction:0}};
const damage={op:'damage',amounts:{physical:amount(),energy:amount(367,'智力',10),mental:amount(),true:amount()},element:'无',target:'enemy'};
const nested={name:'Hiệu ứng phụ',effects:[damage],cost};
const action={effects:[],cost,library:{actions:{nested},statuses:{status:{name:'Bảo vệ',duration,modifiers:[{stat:'力量',flat:2}],tick:{action:'nested'},reactions:[{kind:'reflect',fraction:.2,uses:2}]}},summons:{summon:{name:'Đồng minh',duration}},fields:{field:{name:'Lĩnh vực',duration}}}};
const common={amount:amount(12),duration,target:'self'};
const effects=[damage,
  {op:'heal',resource:'hp',overflowShield:true},{op:'heal',adaptive:true},{op:'shield',charges:2},
  {op:'speed',multiplier:1.2},{op:'armor',channel:'physical'},{op:'reduction',channel:'energy',fraction:.2},
  {op:'damage_bonus',channel:'mental',flat:20,multiplier:1.4},{op:'heal_bonus',multiplier:1.5},
  {op:'element_resist',element:'精',multiplier:0},{op:'resource',mode:'add',resource:'mp',other:'sp'},
  {op:'modify',modifiers:[{stat:'智力',flat:3,multiplier:1.2}]},{op:'apply_status',status:'status',opposedAttribute:'精神',stacks:2},
  {op:'dispel',mode:'remove',polarity:'negative',count:2},{op:'remove_shield',count:2},{op:'atb',mode:'advance',value:20},
  {op:'cast',mode:'interrupt'},{op:'uses',mode:'restore',value:2},{op:'revive'},
  {op:'summon',mode:'clone',count:2,template:'summon'},{op:'retreat'},{op:'recall',ownerOnly:true},
  {op:'field',field:'field'},{op:'time',mode:'delay',action:'nested'},{op:'time',mode:'snapshot'},
  {op:'space',mode:'swap'},{op:'copy',mode:'skill'},{op:'rule',rule:'immune_status',key:'fear',uses:2},
  {op:'explore',kind:'reveal'},{op:'sequence',action:'nested',repeat:2},{op:'repeat',action:'nested',limit:2},
  {op:'branch',then:'nested',otherwise:'nested'},{op:'check',success:'nested'},{op:'variable'},{op:'counter'},
  {op:'alter_event',mode:'scale'},{op:'source',mode:'suppress'},{op:'status_transform',mode:'swap'},
  {op:'choose',actions:['nested'],count:1},{op:'link',mode:'life'},{op:'replay'},
].map(e=>({...common,...e}));
const noHan=text=>{assert.equal(typeof text,'string');assert.ok(!/[\p{Script=Han}]/u.test(text),text);assert.ok(!text.includes('undefined'),text);};
const original=JSON.stringify(effects);
for(const effect of effects)noHan(d.G5(effect,action,{level:10}));
assert.equal(JSON.stringify(effects),original,'display does not mutate engine enums or data');
assert.equal(d.G5(damage,action,{level:10}),'Gây (367 + Trí tuệ×40) điểm sát thương năng lượng (vô thuộc tính)');
const mental=structuredClone(damage);mental.amounts.energy=amount();mental.amounts.mental=amount(800,'精神',20);mental.element='精';
assert.equal(d.G5(mental,action,{level:10}),'Gây (800 + Tinh thần×80) điểm sát thương tinh thần (tinh thần)');
assert.equal(d.G5(effects.find(e=>e.op==='element_resist'),action),'Sát thương thuộc tính tinh thần nhận vào còn 0% (vô hiệu)');
for(const key of ['fear','charm','confusion','taunt'])assert.equal(d.G5({op:'rule',rule:'immune_status',key,duration}),`Miễn nhiễm ${{fear:'Sợ hãi',charm:'Mê hoặc',confusion:'Hỗn loạn',taunt:'Khiêu khích'}[key]}; hiệu lực thường trực`);
for(const clock of ['target_action','target_ready','round','battle_time','exploration_time','field','permanent'])noHan(d.Y5({clock,value:2000}));
for(const event of Object.keys(d.W5))noHan(d.fa({...action,effects:[damage],triggers:[{event,action:'nested',uses:1,payCost:true,chance:.3}],grantedActions:['nested']},{level:10}).join('; '));
for(const kind of ['immune_status','immune_element','immune_channel','undying','no_heal','no_revive','repeat_seal','type_scale','control_tax'])noHan(d.Fd({kind,key:kind==='immune_element'?'精':kind==='immune_channel'?'mental':'fear',uses:2}));
assert.equal(d.bsDisplayName('稀有·辉光术式'),'Hiếm · Thuật Thức Huy Quang');
assert.equal(d.bsDisplayName('史诗'),'Sử Thi');
assert.equal(d.bsDisplayName('Tên nhân vật của anh'),'Tên nhân vật của anh');
assert.equal(d.Bp([{kind:'affinity',unit:'ally',detail:'Điểm yếu·精'}],[{id:'ally',name:'Elaron'}])[0],'Elaron · Điểm yếu · tinh thần');
for(const control of ['petrify','knockdown','disarm','polymorph','no_action'])noHan(d.G5({op:'apply_status',status:'status',duration},{...action,library:{...action.library,statuses:{status:{name:control,control,duration}}}}));
// Exercise every rule entry, including the local relic rules, rather than sampling their labels.
const ruleBlock=source.slice(source.indexOf('case"rule":return'),source.indexOf('case"explore":return',source.indexOf('case"rule":return')));
for(const [,rule] of ruleBlock.matchAll(/(?:\{|,)([a-z_]+):/g)){
  noHan(d.G5({op:'rule',rule,key:rule==='immune_element'?'精':rule==='immune_channel'?'mental':'fear',duration},action));
  noHan(d.Fd({kind:rule,key:rule==='immune_element'?'精':rule==='immune_channel'?'mental':'fear',uses:2}));
}
const displayedOps=new Set(effects.map(effect=>effect.op));
const builder=source.slice(source.indexOf('function G5('),source.indexOf('function to(',source.indexOf('function G5(')));
for(const [,op] of builder.matchAll(/case"([a-z_]+)"/g))assert.ok(displayedOps.has(op),`Missing effect fixture: ${op}`);
assert.equal(d.wc({cost}),'HP 10% giá trị tối đa · MP 5 + 20% giá trị hiện tại');
noHan(d.Ip({...amount(),maxResource:'hp',maxFraction:.2,currentResource:'mp',currentFraction:.3,lostResource:'sp',lostFraction:.4,eventFraction:.5,minimum:2,maximum:300}));
let prompt;
await d.Eb({generateRaw:async options=>{prompt=options.ordered_prompts[0].content;return '{}'},stopGenerationById:()=>{}})({prompt:'Schema fixture',schema:{type:'object'}});
assert.match(prompt,/dùng tiếng Việt/);
assert.match(prompt,/không dịch các giá trị thuộc hợp đồng schema/);
console.log(`Vietnamese display: ${effects.length} effect cases, all triggers/clocks, cached names, formulas and AI contract passed`);
if(process.argv.includes('--ui-fixture')){
  const skills=[
    {sourceId:'/技能/huy-quang',name:'Huy quang',adaptation:{mode:'replacement',quality:'稀有'},mapping:{disposition:'passive',action:{...action,name:'稀有·辉光术式',effects:[damage]}}},
    {sourceId:'/技能/bao-ho',name:'Bảo hộ tinh thần',adaptation:{mode:'replacement',quality:'史诗'},mapping:{disposition:'passive',action:{...action,effects:[...['fear','charm','confusion','taunt'].map(key=>({op:'rule',rule:'immune_status',key,duration})),{op:'element_resist',element:'精',multiplier:0}],triggers:[{event:'battle_start',action:'nested',uses:1}],library:{...action.library,actions:{nested:{...nested,effects:[mental]}}}}}},
  ];
  const fixture={actor:{等级:10,属性:{力量:20,敏捷:20,体质:20,智力:40,精神:40},生命值:{当前:800},法力值:{当前:300},体力值:{当前:300}},card:{numeric:{level:10,attributes:{力量:20,敏捷:20,体质:20,智力:40,精神:40},max:{hp:800,mp:300,sp:300}},skills},ready:true,name:'Nhân vật chính',level:10};
  fs.mkdirSync('scratch',{recursive:true});
  fs.writeFileSync('scratch/skill-display-ui.js',source.replace('}=yc(t,r),c=Qa(l)', '}=window.skillFixture,c=Qa(l)'));
  fs.writeFileSync('scratch/skill-display-ui.html',`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kiểm tra Việt hóa kỹ năng</title><body><div id="root"></div><script src="skill-display-ui.js"></script><script>window.skillFixture=${JSON.stringify(fixture)};let root=document.getElementById('root');SkillDisplay.hc(root);SkillDisplay.T5(root,null,null,()=>{});</script></body></html>`);
  console.log('Browser fixture saved in scratch/skill-display-ui.html');
}
