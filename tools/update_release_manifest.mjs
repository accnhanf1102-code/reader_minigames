import fs from 'node:fs';import {createHash} from 'node:crypto';import {gunzipSync} from 'node:zlib';
const file='site/release-manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const entry=data=>({bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
for(const name of Object.keys(manifest.files))manifest.files[name]=entry(fs.readFileSync('site/'+name));
manifest.pck=entry(gunzipSync(Buffer.concat(manifest.pckParts.map(name=>fs.readFileSync('site/'+name)))));
if(process.argv[2])manifest.revision=process.argv[2];
fs.writeFileSync(file,(JSON.stringify(manifest,null,2)+'\n').replace(/\n/g,'\r\n'));
console.log('Updated release manifest: '+manifest.revision);
