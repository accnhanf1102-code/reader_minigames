// Embedded by build_runtime_locale.mjs; engine keys and enum values stay unchanged.
var bsRuntimeTerms={},bsRuntimeDescriptions={},bsRuntimeTemplates=[];
var bsItemTypesVi={材料:"Vật liệu",消耗品:"Vật phẩm tiêu hao"};
var bsItemTagsVi={书海:"Thư Hải",怪物素材:"Vật liệu quái",盲盒:"Hộp Mù",未开启:"Chưa mở",FP兑换券:"Vé đổi FP"};
var bsItemPrefixesVi={主题:"Chủ đề",区域:"Khu vực",来源:"Nguồn",内容类型:"Loại nội dung",面额:"Mệnh giá"};
var bsItemEffectsVi={素材:"Vật liệu",待开启:"Chờ mở",兑换:"Đổi FP"};
function bsItemMapped(value,map,out){
  if(out)return map[value]??value;
  return Object.keys(map).find(key=>map[key]===value)??value;
}
function bsItemContent(value,out){
  const map={消耗品:"Vật phẩm tiêu hao"};
  for(const theme of _u){map[theme.name]=bsTextVi(theme.name);for(const scene of theme.scenes)map[scene]=bsTextVi(scene);}
  // Legacy boxes use the runtime display term, which is lower case.
  if(!out&&value==="vật phẩm tiêu hao")return "消耗品";
  return bsItemMapped(value,map,out);
}
function bsItemTag(value,out){
  if(typeof value!=="string")return value;
  const direct=bsItemMapped(value,bsItemTagsVi,out);
  if(direct!==value)return direct;
  const colon=value.indexOf(":");if(colon<0)return value;
  const prefix=value.slice(0,colon),content=value.slice(colon+1).trim();
  const canonical=bsItemMapped(prefix,bsItemPrefixesVi,false);
  if(!Object.hasOwn(bsItemPrefixesVi,canonical))return value;
  const translated=["主题","区域","内容类型"].includes(canonical)?bsItemContent(content,out):content;
  return out?bsItemPrefixesVi[canonical]+": "+translated:canonical+":"+translated;
}
function bsTransformHostItemMetadata(statData,out){
  const actors=[statData?.主角,...Object.values(statData?.关系列表??{})];
  for(const actor of actors)for(const item of Object.values(actor?.背包??{})){
    if(!item||!Array.isArray(item.标签)||!item.标签.some(tag=>tag==="书海"||tag==="Thư Hải"))continue;
    // Canonicalize mixed old/new metadata before producing either representation.
    item.类型=bsItemMapped(bsItemMapped(item.类型,bsItemTypesVi,false),bsItemTypesVi,out);
    item.标签=item.标签.map(tag=>bsItemTag(bsItemTag(tag,false),out));
    if(item.效果&&typeof item.效果==="object"&&!Array.isArray(item.效果)){
      const entries=Object.entries(item.效果).map(([key,value])=>({key,value,target:bsItemMapped(bsItemMapped(key,bsItemEffectsVi,false),bsItemEffectsVi,out)}));
      // Keep original keys for ambiguous custom pairs instead of overwriting either value.
      item.效果=Object.fromEntries(entries.map(entry=>[entries.filter(other=>other.target===entry.target).length>1?entry.key:entry.target,entry.value]));
    }
  }
  return statData;
}
function translateHitTerm(value){return bsTextVi(value)}
function bsTextVi(value){
  if(typeof value!=="string"||!value)return value;
  const normalized=value.replace(/\r\n/g,"\n");
  if(bsRuntimeTerms[normalized])return bsRuntimeTerms[normalized];
  if(bsRuntimeDescriptions[value])return bsRuntimeDescriptions[value];
  if(bsRuntimeTerms[value])return bsRuntimeTerms[value];
  for(const template of bsRuntimeTemplates){
    const captures=value.match(template.pattern);
    if(captures)return template.translation.replace(/\$\{([^}]+)\}/g,(_m,key)=>bsTextVi(captures[template.keys.indexOf(key)+1]??""));
  }
  let text=bsLegacyHitTerm(value);
  if(!/[\p{Script=Han}]/u.test(text))return text;
  let match;
  if((match=text.match(/^(.+)·(.+)·消耗品盲盒$/)))return `${bsTextVi(match[1])} · ${bsTextVi(match[2])} · Hộp Mù vật phẩm tiêu hao`;
  if((match=text.match(/^打开后获得(.+)主题随机(普通|优良|稀有|史诗|传说|神话)(.+?)(?:\*1)?[。.]?$/)))return `Mở để nhận 1 ${bsTextVi(match[3])} ngẫu nhiên phẩm chất ${bsTextVi(match[2])}, chủ đề ${bsTextVi(match[1])}.`;
  if((match=text.match(/^转化为「(.+)」：造成([\d.]+)点基础(物理|精神|能量)伤害，另受(.+)与层级加成。$/)))return `Chuyển đổi thành「${bsTextVi(match[1])}」: gây ${match[2]} điểm sát thương ${bsTextVi(match[3])} cơ bản, cộng thêm theo ${bsTextVi(match[4])} và cấp bậc.`;
  if((match=text.match(/^每场战斗开始时发动「(.+)」：对一名敌人造成([\d.]+)点基础(物理|精神|能量)伤害，另受(.+)与层级加成。$/)))return `Khi bắt đầu mỗi trận, kích hoạt「${bsTextVi(match[1])}」: gây ${match[2]} điểm sát thương ${bsTextVi(match[3])} cơ bản lên một địch, cộng thêm theo ${bsTextVi(match[4])} và cấp bậc.`;
  if((match=text.match(/^来自(.+)的(密封盲盒|未兑换券)。$/)))return `${match[2]==="密封盲盒"?"Hộp Mù niêm phong":"Vé chưa đổi"} từ ${bsTextVi(match[1])}.`;
  if((match=text.match(/^于(.+)·(.+)击败神话级宝箱怪后获得。$/)))return `Nhận được sau khi hạ Quái Rương Báu bậc Thần Thoại tại ${bsTextVi(match[1])} · ${bsTextVi(match[2])}.`;
  if((match=text.match(/^于(.+)·(.+)掉落的(.+)，可用做素材[。.]?$/)))return `${bsTextVi(match[3])} rơi tại ${bsTextVi(match[1])} · ${bsTextVi(match[2])}, có thể dùng làm vật liệu.`;
  if((match=text.match(/^(.+)与形态要素$/)))return `${bsTextVi(match[1])} và yếu tố hình thái`;
  if((match=text.match(/^(.+)之权能$/)))return `Quyền năng ${bsTextVi(match[1])}`;
  if((match=text.match(/^(.+)之法则$/)))return `Pháp tắc ${bsTextVi(match[1])}`;
  if(text.includes("·"))text=text.split("·").map(part=>bsTextVi(part.trim())).join(" · ");
  if(text.includes("："))text=text.split("：").map(part=>bsRuntimeTerms[part.trim()]??bsRuntimeDescriptions[part.trim()]??part.trim()).join(": ");
  return text;
}
function bsEventResult(e){
  const relic=id=>bsTextVi(Kt[id]?.name??id),quality=q=>bsTextVi(q??"普通");
  switch(e.kind){
    case"relic":return "Chọn 1 thánh vật tạm thời: "+e.choices.map(relic).join(" / ");
    case"reward":return e.reward==="box"?`Nhận ${e.amount} Hộp Mù chưa mở phẩm chất ${quality(e.quality)} (kết toán khi rời mê cung thành công)`:`Nhận ${e.amount} FP (kết toán khi rời mê cung thành công)`;
    case"encounter":return `Vào trận sự kiện với tối đa ${e.strength} địch; phần thưởng tiếp theo được xử lý sau trận`;
    case"effect":return fa(e.action).join("; ");
    case"next":return "Tiếp tục phần sau của sự kiện; tiêu hao tiếp theo sẽ được hiển thị lại";
    case"flag":return e.id.startsWith("passed:")?"Rời sự kiện, không tiêu hao tài nguyên":e.id.startsWith("scouted:")?"Ghi lại manh mối khám phá khu vực này":"Ghi lại kết quả sự kiện";
    case"fp":return e.mode==="clear"?"FP chờ kết toán về 0":e.mode==="scale"?`FP chờ kết toán ×${e.amount}`:`FP ${e.amount>=0?"+":""}${e.amount}`;
    case"box":return e.count<0?`Tiêu hao ${-e.count} Hộp Mù`:`Nhận ${e.count} Hộp Mù ${e.quality==="random"||!e.quality?"phẩm chất ngẫu nhiên":quality(e.quality)}`;
    case"heal_all":return e.fraction>=0?`Toàn đội hồi ${Math.round(e.fraction*100)}% HP tối đa${e.fraction>=1?" / MP / SP":""}`:`Toàn đội mất ${Math.round(-e.fraction*100)}% HP tối đa`;
    case"cleanse_all":return "Giải trừ toàn bộ trạng thái bất lợi của toàn đội";
    case"teleport":return `Dịch chuyển tới tầng ngẫu nhiên trong phạm vi ±${e.range} tầng`;
    case"relic_random":return "Nhận một thánh vật ngẫu nhiên"+(e.rarity?` (${Wl[e.rarity]})`:"");
    case"relic_grant":return "Nhận「"+relic(e.id)+"」";
    case"relic_transform":return "Chọn một thánh vật để đổi thành thánh vật khác cùng độ hiếm";
    case"relic_pick":return e.mode==="sacrifice"?"Hiến tế một thánh vật":e.mode==="copy"?"Sao chép một thánh vật cho đồng đội":"Bán một thánh vật";
    case"encounter_tier":return `Gặp địch: ${e.tier==="boss"?"Boss":e.tier==="elite"?"Tinh anh":"Thường"} ×${e.count}`+(e.thenRelic?", thắng trận nhận thánh vật":"")+(e.thenFp?`, thắng trận FP +${e.thenFp}`:"")+(e.thenBox?`, thắng trận Hộp Mù ×${e.thenBox}`:"");
    case"item":return `Nhận Chuông triệu hồi ×${e.count}`;
    case"battle_mod":return `Trong ${e.fights} trận tới: `+[e.enemyDamage?`sát thương địch ×${e.enemyDamage}`:"",e.expMul?`kinh nghiệm ×${e.expMul}`:"",e.materialRate!==void 0?`tỷ lệ rơi vật liệu ×${e.materialRate}`:"",e.enemyDouble?"số lượng địch ×2":"",e.thenRelic?"thắng trận nhận thánh vật":""].filter(Boolean).join(", ");
    case"seal_skills":return "Chọn thành viên và phong ấn 1–3 kỹ năng; mỗi kỹ năng tăng 10% mọi thuộc tính";
    case"member_pick":return e.mode==="train"?"Chọn thành viên: 3 trận tới sát thương ×1.5, tốc độ ×0.7":e.mode==="bloodpact"?"Chọn thành viên: HP tối đa −30%, FP +2500":"Chọn một thành viên rời mê cung";
    case"run_mod":return `${e.member==="all"?"Toàn đội":"Một thành viên ngẫu nhiên"}: `+[e.maxHp?`HP tối đa ×${e.maxHp}`:"",e.maxMp?`MP tối đa ×${e.maxMp}`:"",e.speed?`tốc độ ×${e.speed}`:""].filter(Boolean).join(", ")+" (trong chuyến mê cung này)";
    case"layer_mod":return {noMaterials:"Các trận còn lại ở tầng này không rơi vật liệu",noChase:"Địch còn lại ở tầng này không chủ động truy đuổi",eliteBounty:`Tinh anh tầng này +${e.value} FP; địch thường không cho FP`,enemyAttrs:`Mọi thuộc tính địch còn lại ở tầng này ×${e.value}`,strayHaste:`Tốc độ truy đuổi của「?」×${e.value}`}[e.key]??e.key;
    case"potions":return e.random?`Dược phẩm ngẫu nhiên ×${e.count}`:`Thuốc hồi phục +${e.count}`;
    case"swap_hp_mp":return "Hoán đổi ngẫu nhiên HP tối đa và MP tối đa của thành viên";
    case"stairs":return e.skipNext?"Cầu thang dẫn thẳng xuống tầng tiếp theo":"Lập tức xuống tầng tiếp theo";
    case"chest_spawn":return "Tạo một rương báu tại tầng này";
    default:return "Lập tức kết toán rời mê cung";
  }
}
function bsEventChoice(e,party){
  const fp=e.costs.filter(c=>c.resource==="fp").map(c=>`FP chờ kết toán −${c.flat}`),costs=e.costs.filter(c=>c.resource!=="fp");
  const cost=[...fp,...costs.length?party.map(member=>`${bsTextVi(member.name??member.id)}: `+costs.map(c=>`${k1[c.resource]} −${Math.ceil(member.current[c.resource]*c.fraction+c.flat)}${c.resource==="hp"&&!c.lethal?" (không gây chết)":""}`).join(", ")):[]].join("; ")||"Không tiêu hao";
  const total=e.risks?.reduce((n,r)=>n+r.weight,0)??0;
  const risks=e.risks?.map(r=>`${Math.round(r.weight/total*1000)/10}%: ${r.results.map(bsEventResult).join("; ")}`).join("\n")??"";
  const requirements=e.requirements.map(r=>r.kind==="exploration"?"Cần năng lực khám phá mở thêm lựa chọn sự kiện":r.kind==="resource"?`Cần ít nhất ${r.amount} ${k1[r.key]??r.key}`:r.kind==="relic"?"Cần thánh vật chỉ định":r.kind==="relic_any"?"Cần ít nhất một thánh vật":r.kind==="fp"?`Cần FP chờ kết toán ≥ ${r.amount}`:r.kind==="box"?`Cần ít nhất ${r.amount} Hộp Mù`:r.kind==="depth"?`Cần đạt tầng ${r.amount} hoặc sâu hơn`:r.kind==="party"?`Cần ít nhất ${r.amount} thành viên đang có mặt`:"Cần hoàn thành sự kiện liên quan").join("; ");
  return [`Tiêu hao: ${cost}`,`Kết quả: ${e.results.map(bsEventResult).join("; ")||"Xác định theo các xác suất dưới đây"}`,risks?"Các nhánh rủi ro:\n"+risks:"",requirements?"Điều kiện: "+requirements:""].filter(Boolean).join("\n");
}
function bsActionSource(action,numeric){
  const text=bsTextVi(action.description??"");
  if(!/[\p{Script=Han}]/u.test(text))return text;
  // Monster mechanics already have structured effects; rebuild their mechanical summary.
  if(action.source?.id?.startsWith("monster:")||action.tags?.some(tag=>tag.startsWith("monster:")))return fa(action,numeric).join("; ");
  return text;
}
function bsRewardText(reward){
  if(reward.kind==="box")return `Mở để nhận 1 ${bsTextVi(reward.contentType)} ngẫu nhiên phẩm chất ${bsTextVi(reward.quality)}, chủ đề ${bsTextVi(reward.style)}.`;
  if(reward.kind==="material")return [bsTextVi(reward.effect),bsTextVi(reward.description)].filter(Boolean).join(". ");
  return "Khi rời mê cung thành công, cộng thẳng vào điểm vận mệnh, không cần đổi.";
}
function bsRewardName(reward){
  return reward.kind==="box"?`${bsTextVi(reward.quality)} · ${bsTextVi(reward.style)} · Hộp Mù ${bsTextVi(reward.contentType)}`:reward.kind==="material"?`${bsTextVi(reward.quality)} · ${bsTextVi(reward.name)}`:`${kl(reward)} FP`;
}
function bsRewardItem(result){
  // Redemption recognizes this exact voucher name; translate metadata at the host boundary.
  if(!result.item.标签?.includes("FP兑换券"))result.name=bsTextVi(result.name);
  result.item.描述=bsTextVi(result.item.描述);
  if(result.item.效果)result.item.效果=Object.fromEntries(Object.entries(result.item.效果).map(([key,text])=>[key,typeof text==="string"?bsTextVi(text):text]));
  return result;
}
function bsNormalizeInventory(inventory){
  for(const name of Object.keys(inventory)){
    const item=inventory[name];
    if(!item||!Array.isArray(item.标签)||!item.标签.includes("书海"))continue;
    // Voucher recognition uses a strict legacy name pattern. Preserve that identifier.
    if(item.标签.includes("FP兑换券"))continue;
    const localized=bsRewardItem({name,item:structuredClone(item)}),translated=localized.name;
    if(translated===name){inventory[name]=localized.item;continue;}
    let target=translated,index=2;
    while(inventory[target]&&(inventory[target].品质!==localized.item.品质||JSON.stringify(bsRewardItem({name:target,item:structuredClone(inventory[target])}).item.效果)!==JSON.stringify(localized.item.效果)))target=translated+` (${index++})`;
    if(inventory[target])localized.item.数量=Number(inventory[target].数量??0)+Number(localized.item.数量??0);
    inventory[target]=localized.item;delete inventory[name];
  }
  return inventory;
}
function bsApplyContentTranslations(){
  Object.assign(bsRuntimeTerms,BS_RUNTIME_LOCALE.terms);
  for(const file of BS_RUNTIME_LOCALE.phrases)Object.assign(bsRuntimeTerms,file);
  for(const [original,translation]of Object.entries(bsRuntimeTerms)){
    if(!original.includes("${"))continue;
    const keys=[],chunks=original.split(/\$\{([^}]+)\}/g);
    const pattern=chunks.map((chunk,index)=>index%2?(keys.push(chunk),"(.+?)"):chunk.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("");
    bsRuntimeTemplates.push({pattern:new RegExp("^"+pattern+"$","s"),keys,translation});
  }
  for(const [id,entry]of Object.entries(BS_RUNTIME_LOCALE.materials)){
    const source=Xk[id];if(!source)throw Error("Unknown translated material "+id);
    bsRuntimeTerms[source.name]=entry.name;bsRuntimeTerms[source.voice]=entry.voice;
    bsRuntimeDescriptions[source.description]=entry.description;
    // Retain engine names for reward identity; translate natural-language content at its source.
    source.description=entry.description;source.voice=entry.voice;
  }
  for(const [id,[name,description]]of Object.entries(BS_RUNTIME_LOCALE.relics)){
    const source=Kt[id];if(!source)throw Error("Unknown translated relic "+id);
    bsRuntimeTerms[source.name]=name;bsRuntimeDescriptions[source.description]=description;
    source.description=description;
  }
  Object.assign(PROTELYSION_HIT_MAP,bsRuntimeTerms,bsRuntimeDescriptions);
}
