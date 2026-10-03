import fs from 'node:fs';
import path from 'node:path';
const localeDir='tools/locales';
const base=JSON.parse(fs.readFileSync(path.join(localeDir,'runtime-vi.json'),'utf8'));
const materials=Object.assign({},...['materials-vi-first.json','materials-vi-second.json'].map(name=>JSON.parse(fs.readFileSync(path.join(localeDir,name),'utf8'))));
const phrases=fs.readdirSync(localeDir).filter(name=>/^(monster|theme|skill-source|event|ui)-.*vi.*\.json$/.test(name)).sort().map(name=>JSON.parse(fs.readFileSync(path.join(localeDir,name),'utf8')));
if(Object.keys(materials).length!==432)throw Error('Expected exactly 432 material translations');
const locale={...base,materials,phrases};
function validateValues(value,location='locale'){
 if(typeof value==='string'&&/\p{Script=Han}/u.test(value))throw Error('Untranslated locale value '+location);
 if(value&&typeof value==='object')for(const [key,child]of Object.entries(value))validateValues(child,location+'.'+key);
}
validateValues(locale);
for(const [id,entry]of Object.entries(materials))if(/[\p{Script=Han}]/u.test(JSON.stringify(entry)))throw Error('Untranslated material '+id);
const begin='/* --- RUNTIME VI LOCALE BEGIN --- */',end='/* --- RUNTIME VI LOCALE END --- */';
const block=begin+'\r\nvar BS_RUNTIME_LOCALE='+JSON.stringify(locale)+';\r\n'+fs.readFileSync('tools/runtime_localization.js','utf8').replace(/\r?\n/g,'\r\n')+'\r\n'+end;
const file='site/distribution.js';let source=fs.readFileSync(file,'utf8');
source=source.replace('function translateHitTerm(term) {','function bsLegacyHitTerm(term) {');
if(source.includes(begin))source=source.slice(0,source.indexOf(begin))+block+source.slice(source.indexOf(end)+end.length);
else source=source.replace('/* --- PROTELYSION BOOKSEA HIT MAPPING END --- */','/* --- PROTELYSION BOOKSEA HIT MAPPING END --- */\r\n'+block);
if(!source.includes('bsApplyContentTranslations();return C5(HA);'))source=source.replace('return C5(HA);})();','bsApplyContentTranslations();return C5(HA);})();');
fs.writeFileSync(file,source);
console.log(`Embedded ${Object.keys(materials).length} materials, ${Object.keys(base.relics).length} relics and ${phrases.length} phrase dictionaries`);
