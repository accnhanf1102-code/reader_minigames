import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { LABELS, readPack, readScript, localizePack } from './localize_godot_labels.mjs';

function fixture() {
  const values = [...Object.keys(LABELS), 'supplier', 'kind', 'payload'];
  const bodyHeader = Buffer.alloc(16);
  bodyHeader.writeUInt32LE(values.length, 4);
  const constants = values.map(value => {
    const string = Buffer.from(value), encoded = Buffer.alloc(8 + Math.ceil(string.length / 4) * 4);
    encoded.writeUInt32LE(4);
    encoded.writeUInt32LE(string.length, 4);
    string.copy(encoded, 8);
    return encoded;
  });
  const body = Buffer.concat([bodyHeader, ...constants]);
  const scriptHeader = Buffer.alloc(12);
  scriptHeader.write('GDSC');
  scriptHeader.writeUInt32LE(101, 4);
  const script = Buffer.concat([scriptHeader, body]);
  const header = Buffer.alloc(112);
  header.write('GDPC');
  header.writeUInt32LE(4, 4);
  header.writeBigUInt64LE(112n, 24);
  header.writeBigUInt64LE(BigInt(112 + script.length), 32);
  const directory = Buffer.alloc(4 + 4 + 8 + 36);
  directory.writeUInt32LE(1);
  directory.writeUInt32LE(8, 4);
  directory.write('game.gdc', 8);
  directory.writeBigUInt64LE(BigInt(script.length), 24);
  createHash('md5').update(script).digest().copy(directory, 32);
  return Buffer.concat([header, script, directory]);
}

const before = fixture(), patched = localizePack(before);
assert.notDeepEqual(patched, before);
assert.equal(localizePack(patched), patched, 'Patching is idempotent');
const entry = readPack(patched).entries[0];
const strings = readScript(patched.subarray(entry.offset, entry.offset + entry.size)).constants.map(item => item.value);
assert.deepEqual(strings, [...Object.values(LABELS), 'supplier', 'kind', 'payload']);
const corrupt = Buffer.from(patched);
corrupt[entry.offset + 20] ^= 1;
assert.throws(() => readPack(corrupt), 'Reject corrupted pack resources');
const manifest = JSON.parse(fs.readFileSync(new URL('../site/release-manifest.json', import.meta.url), 'utf8'));
const released = gunzipSync(Buffer.concat(manifest.pckParts.map(name => fs.readFileSync(new URL('../site/' + name, import.meta.url)))));
assert.equal(localizePack(released), released, 'Released pack has Vietnamese map labels');
console.log('Godot localization passed: seven labels, unchanged internal keys, idempotence, corruption detection and released pack.');
