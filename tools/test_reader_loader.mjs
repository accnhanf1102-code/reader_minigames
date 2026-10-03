import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const filename = fs.readdirSync('install').find(name => name.includes('0917'));
const rule = JSON.parse(fs.readFileSync(`install/${filename}`, 'utf8'));
const html = rule.replaceString;
const loader = html.slice(html.indexOf('/* ★ READER TEMPLATE ISOLATED LOADER START ★ */'), html.indexOf('/* ★ READER TEMPLATE ISOLATED LOADER END ★ */'));
const payload = loader.match(/var payload='([^']+)'/)[1];
const expected = gunzipSync(Buffer.from(payload, 'base64')).toString('utf8');
const digest = createHash('sha256').update(Buffer.from(payload, 'base64')).digest('hex');
assert.ok(loader.includes(digest));

async function execute(code) {
  return new Promise(resolve => {
    const sandbox = {
      crypto, Blob, Response, DecompressionStream, Uint8Array, atob,
      setTimeout: fn => fn(),
      console: { error: (_prefix, error) => resolve({ error }) },
      document: {
        createElement: () => ({ remove() {} }),
        head: { appendChild: node => resolve({ source: node.text }) },
      },
    };
    vm.runInNewContext(code, sandbox);
  });
}
const valid = await execute(loader);
assert.equal(valid.source, expected + '\n//# sourceURL=reader-template-system-isolated.js');
const damaged = await execute(loader.replace(payload, 'A' + payload.slice(1)));
assert.match(damaged.error.message, /Payload Độc Giả bị thay đổi hoặc hỏng/);
console.log('reader loader: valid payload executes; damaged payload is rejected before decompression');
