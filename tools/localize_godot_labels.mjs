// Godot 4.7 GDSC v101: only string Variants change; identifiers and token streams stay intact.
// Format: https://github.com/godotengine/godot/blob/4.7/modules/gdscript/gdscript_tokenizer_buffer.cpp
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync, zstdDecompressSync, zstdCompressSync } from 'node:zlib';
import assert from 'node:assert/strict';

export const LABELS = Object.freeze({
  '敌群': 'Địch', '宝箱': 'Rương', '长椅': 'Ghế nghỉ',
  '补给员': 'Tiếp tế', '下一层': 'Tầng tiếp', '事件': 'Sự kiện', '入口': 'Lối vào',
});
const digest = (bytes, kind = 'md5') => createHash(kind).update(bytes).digest();

export function readPack(bytes) {
  assert.equal(bytes.subarray(0, 4).toString(), 'GDPC');
  assert.equal(bytes.readUInt32LE(4), 4);
  const base = Number(bytes.readBigUInt64LE(24));
  const directory = Number(bytes.readBigUInt64LE(32));
  let cursor = directory + 4;
  const entries = [];
  for (let i = 0; i < bytes.readUInt32LE(directory); i++) {
    const length = bytes.readUInt32LE(cursor);
    cursor += 4;
    const name = bytes.subarray(cursor, cursor + length).toString().replace(/\0+$/, '');
    cursor += length;
    const metadata = cursor;
    const offset = Number(bytes.readBigUInt64LE(cursor)) + base;
    const size = Number(bytes.readBigUInt64LE(cursor + 8));
    const md5 = bytes.subarray(cursor + 16, cursor + 32);
    const flags = bytes.readUInt32LE(cursor + 32);
    assert.equal(flags, 0, 'Encrypted/removal entries are unsupported');
    assert.ok(offset >= base && offset + size <= directory);
    assert.deepEqual(digest(bytes.subarray(offset, offset + size)), md5, name);
    entries.push({ name, offset, size, metadata });
    cursor += 36;
  }
  assert.equal(cursor, bytes.length, 'Unexpected pack trailer');
  return { base, directory, entries };
}

export function readScript(bytes) {
  assert.equal(bytes.subarray(0, 4).toString(), 'GDSC');
  assert.equal(bytes.readUInt32LE(4), 101);
  const size = bytes.readUInt32LE(8);
  const body = size ? zstdDecompressSync(bytes.subarray(12)) : bytes.subarray(12);
  if (size) assert.equal(body.length, size);
  let cursor = 16;
  for (let i = 0; i < body.readUInt32LE(0); i++) {
    const length = body.readUInt32LE(cursor);
    cursor += 4 + length * 4;
  }
  const constantsStart = cursor;
  const constants = [];
  for (let i = 0; i < body.readUInt32LE(4); i++) {
    const start = cursor, tag = body.readUInt32LE(cursor), type = tag & 0xffff;
    cursor += 4;
    let value;
    if (type === 4 || type === 21) {
      const length = body.readUInt32LE(cursor);
      cursor += 4;
      value = body.subarray(cursor, cursor + length).toString('utf8');
      cursor += Math.ceil(length / 4) * 4;
    } else if (type === 2 || type === 3) cursor += tag & 0x10000 ? 8 : 4;
    else if (type === 1) cursor += 4;
    else assert.equal(type, 0, `Unsupported Variant type ${type}`);
    constants.push({ start, end: cursor, type, value });
  }
  // The remainder contains the two token-location tables and the token stream.
  let tokenCursor = cursor + body.readUInt32LE(8) * 16;
  for (let i = 0; i < body.readUInt32LE(12); i++) tokenCursor += body[tokenCursor] & 0x80 ? 8 : 5;
  assert.equal(tokenCursor, body.length, 'Invalid tokenizer stream');
  return { body, constantsStart, constantsEnd: cursor, constants };
}

function stringVariant(value) {
  const text = Buffer.from(value, 'utf8');
  const result = Buffer.alloc(8 + Math.ceil(text.length / 4) * 4);
  result.writeUInt32LE(4, 0);
  result.writeUInt32LE(text.length, 4);
  text.copy(result, 8);
  return result;
}

export function localizePack(bytes) {
  const pack = readPack(bytes);
  const entry = pack.entries.find(item => item.name === 'game.gdc');
  assert.ok(entry, 'Missing game.gdc');
  const script = readScript(bytes.subarray(entry.offset, entry.offset + entry.size));
  const strings = new Set(script.constants.map(item => item.value));
  const originals = Object.keys(LABELS).filter(label => strings.has(label));
  if (!originals.length) {
    for (const label of Object.values(LABELS)) assert.ok(strings.has(label), `Missing localized label ${label}`);
    return bytes;
  }
  assert.equal(originals.length, Object.keys(LABELS).length, 'Unexpected partial localization');
  const constants = script.constants.map(item => item.type === 4 && Object.hasOwn(LABELS, item.value)
    ? stringVariant(LABELS[item.value]) : script.body.subarray(item.start, item.end));
  const body = Buffer.concat([
    script.body.subarray(0, script.constantsStart), ...constants, script.body.subarray(script.constantsEnd),
  ]);
  const header = Buffer.from(bytes.subarray(entry.offset, entry.offset + 12));
  header.writeUInt32LE(body.length, 8);
  const encoded = Buffer.concat([header, zstdCompressSync(body)]);
  // Keep existing resource offsets stable; place the replacement script before the directory.
  const directory = Buffer.from(bytes.subarray(pack.directory));
  const metadata = entry.metadata - pack.directory;
  directory.writeBigUInt64LE(BigInt(pack.directory - pack.base), metadata);
  directory.writeBigUInt64LE(BigInt(encoded.length), metadata + 8);
  digest(encoded).copy(directory, metadata + 16);
  const padding = Buffer.alloc((16 - encoded.length % 16) % 16);
  const prefix = Buffer.from(bytes.subarray(0, pack.directory));
  prefix.writeBigUInt64LE(BigInt(pack.directory + encoded.length + padding.length), 32);
  const patched = Buffer.concat([prefix, encoded, padding, directory]);
  const check = readPack(patched), replacement = check.entries.find(item => item.name === entry.name);
  const parsed = readScript(patched.subarray(replacement.offset, replacement.offset + replacement.size));
  assert.deepEqual(parsed.body.subarray(0, parsed.constantsStart), script.body.subarray(0, script.constantsStart));
  assert.deepEqual(parsed.body.subarray(parsed.constantsEnd), script.body.subarray(script.constantsEnd));
  script.constants.forEach((item, i) => {
    if (Object.hasOwn(LABELS, item.value)) assert.equal(parsed.constants[i].value, LABELS[item.value]);
    else assert.deepEqual(parsed.body.subarray(parsed.constants[i].start, parsed.constants[i].end), script.body.subarray(item.start, item.end));
  });
  for (const resource of pack.entries.filter(item => item.name !== entry.name)) {
    const after = check.entries.find(item => item.name === resource.name);
    assert.equal(after.offset, resource.offset);
    assert.equal(after.size, resource.size);
  }
  return patched;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'));
  const original = gunzipSync(Buffer.concat(manifest.pckParts.map(name => fs.readFileSync(path.join(root, name)))));
  const result = localizePack(original);
  if (process.argv.includes('--check')) {
    assert.equal(result, original, 'Chinese map labels remain; run without --check to patch');
    console.log('Verified seven Vietnamese Godot map labels and all pack resource checksums.');
  } else if (result === original) console.log('Godot map labels are already Vietnamese.');
  else {
    const compressed = gzipSync(result, { level: 9 });
    const chunkSize = Math.ceil(compressed.length / manifest.pckParts.length);
    manifest.pckParts.forEach((name, i) => fs.writeFileSync(path.join(root, name), compressed.subarray(i * chunkSize, (i + 1) * chunkSize)));
    console.log(JSON.stringify({ bytes: result.length, sha256: digest(result, 'sha256').toString('hex') }));
    console.log('PCK chunks updated. Update release manifest before materializing/deploying.');
  }
}
