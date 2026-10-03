import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('site/distribution.js', 'utf8').replace(
  'return C5(HA);})();',
  'window.BookseaInternal={Bb,Ob,Db};return C5(HA);})();',
);
const sample = JSON.parse(fs.readFileSync('data_bo_sung/stat_data.json', 'utf8'));

for (const asyncApi of [false, true]) {
  let messageVars = { stat_data: structuredClone(sample) };
  let chatVars = { booksea: { settings: { narrative: false } } };
  const message = { message_id: 0, extra: {} };
  const context = { characterId: 1, getCurrentChatId: () => 'test', chat: [message], saveChat: async () => {} };
  const wrap = value => asyncApi ? Promise.resolve(value) : value;
  const sandbox = {
    console, setTimeout, clearTimeout, crypto, URL, Blob, structuredClone,
    navigator: { locks: { request: async (_key, fn) => fn() } },
    SillyTavern: { getContext: () => context },
    TavernHelper: {
      getLastMessageId: () => 0,
      getChatMessages: () => [message],
      getVariables: options => wrap(options?.type === 'chat' ? chatVars : messageVars),
      updateVariablesWith: async (updater, options) => {
        if (options.type === 'chat') chatVars = await updater(chatVars);
        else messageVars = await updater(messageVars);
      },
      deleteVariable: () => {},
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const host = sandbox.BookseaInternal.Bb(sandbox);
  await host.prepare();
  assert.equal(typeof host.read().then, 'undefined', 'engine reads a resolved snapshot');
  const roster = sandbox.BookseaInternal.Ob(host);
  assert.equal(roster.length, 2);
  assert.equal(roster[0].level, 10);
  assert.equal(roster[1].name, 'Elaron');
  const compiled = await sandbox.BookseaInternal.Db(host, { kind: 'player' });
  assert.ok(compiled.compiledActor.skills.length > 0);
  assert.ok(chatVars.booksea.actorCache);
  assert.equal(messageVars.stat_data.protagonist.level, 10);
  assert.equal(messageVars.MVU, undefined);
  assert.equal(messageVars._mvuAdapterMeta, undefined);
  const expedition = {};
  host.bind(expedition);
  const updated = host.read();
  updated.stat_data['主角']['等级'] = 12;
  await host.commitProgress(updated, value => value, expedition);
  assert.equal(messageVars.stat_data.protagonist.level, 12, 'commit writes English data');
  assert.equal(host.read().stat_data['主角']['等级'], 12, 'commit refreshes snapshot');
  messageVars.stat_data.protagonist.level = 11;
  await host.prepare();
  assert.equal(host.read().stat_data['主角']['等级'], 11, 'refresh gets fresh host data');
  console.log(`${asyncApi ? 'async' : 'sync'} API: roster, compile, English writeback and refresh passed`);
}

const adapter = new Function(source.slice(
  source.indexOf('/* --- PROTELYSION MVU ZOD ADAPTER BEGIN --- */'),
  source.indexOf('/* --- PROTELYSION MVU ZOD ADAPTER END --- */'),
) + ';return {fetchEffectiveVariables};')();
const fallback = await adapter.fetchEffectiveVariables({
  getVariables: async options => {
    if (options?.type === 'message' && options.message_id === 1) return { stat_data: sample };
    if (options?.message_id === 2) throw Error('not ready');
    return {};
  },
}, () => ({ chat: [{}, {}, {}] }), 2);
assert.equal(fallback.stat_data.protagonist.level, 10);
await assert.rejects(adapter.fetchEffectiveVariables({ getVariables: async () => ({}) }, () => ({ chat: [] }), 0), /Không tìm thấy stat_data/);
console.log('async fallback and missing data rejection passed');
