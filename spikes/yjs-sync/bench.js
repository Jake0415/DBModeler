// Spike S5 — Yjs + Hocuspocus for real-time co-editing (ux/03 §13.1-6).
// Measures: document size (300 entities / ~3,800 attributes / 500 relations), fresh-client initial sync,
// edit propagation latency, concurrent same-field convergence, per-user undo, read-only (server-enforced)
// connection, persistence across a server restart, and an offline client's merge.
import * as Y from 'yjs';
import { Server } from '@hocuspocus/server';
import { HocuspocusProvider } from '@hocuspocus/provider';
import WebSocket from 'ws';
import fs from 'fs';

const PORT = 55471, DOC = 'area-rq-v5';
const STORE = './store'; fs.mkdirSync(STORE, { recursive: true }); fs.rmSync(`${STORE}/${DOC}.bin`, { force: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1); };
const out = {};

// persistence: encoded state per area+version document (a DB row in the real product)
function startServer() {
  const server = Server.configure({
    port: PORT, quiet: true, debounce: 200,
    // §13.1-1: the server decides who may write. token 'viewer' → read-only connection (its updates are dropped server-side)
    async onAuthenticate({ token, connection }) { if (token === 'viewer') connection.readOnly = true; return { user: token }; },
    async onLoadDocument({ document, documentName }) { const f = `${STORE}/${documentName}.bin`; if (fs.existsSync(f)) Y.applyUpdate(document, fs.readFileSync(f)); return document; },
    async onStoreDocument({ document, documentName }) { fs.writeFileSync(`${STORE}/${documentName}.bin`, Buffer.from(Y.encodeStateAsUpdate(document))); }
  });
  return server.listen().then(() => server);
}
function client(token, doc = new Y.Doc()) {
  return new Promise(ok => {
    const p = new HocuspocusProvider({ url: `ws://127.0.0.1:${PORT}`, name: DOC, document: doc, token, WebSocketPolyfill: WebSocket, onSynced: () => ok(p) });
  });
}
function buildModel(doc, n = 300) {
  const ents = doc.getMap('entities'), rels = doc.getArray('relations');
  doc.transact(() => {
    for (let i = 0; i < n; i++) {
      const e = new Y.Map(); e.set('name', `엔터티${i}기본`); e.set('phys', `ENT${i}_M`); e.set('x', (i % 20) * 300); e.set('y', Math.floor(i / 20) * 300);
      const attrs = new Y.Array(); const cnt = 10 + (i % 5);
      attrs.push(Array.from({ length: cnt }, (_, j) => { const a = new Y.Map(); a.set('name', `속성${j}명`); a.set('phys', `ATTR${j}_NM`); a.set('type', 'VARCHAR2(100)'); a.set('st', 'ok'); return a; }));
      e.set('attrs', attrs); ents.set('e' + i, e);
    }
    rels.push(Array.from({ length: 500 }, (_, k) => ({ id: 'r' + k, from: 'e' + (k % n), to: 'e' + ((k * 7 + 1) % n), ident: k % 3 === 0 })));
  }, 'seed');
}
const attr = (doc, e, j) => doc.getMap('entities').get(e).get('attrs').get(j);

const server1 = await startServer();
// 1. author builds the model
const A = await client('kim');
let t = performance.now(); buildModel(A.document); out.buildMs = +(performance.now() - t).toFixed(0);
out.attrs = [...A.document.getMap('entities').values()].reduce((s, e) => s + e.get('attrs').length, 0);
out.docBytes = Y.encodeStateAsUpdate(A.document).byteLength;
await sleep(1500);
// 2. fresh client initial sync (cold load of the whole area)
t = performance.now(); const B = await client('park'); out.freshSyncMs = +(performance.now() - t).toFixed(0);
out.freshSyncEntities = B.document.getMap('entities').size;
// 3. propagation latency A → B, 200 single-field edits
const lat = [];
for (let i = 0; i < 200; i++) {
  const target = attr(B.document, 'e' + (i % 300), 1); const val = `이름${i}`;
  const got = new Promise(ok => { const h = () => { if (target.get('name') === val) { target.unobserve(h); ok(); } }; target.observe(h); });
  const t0 = performance.now(); attr(A.document, 'e' + (i % 300), 1).set('name', val); await got; lat.push(performance.now() - t0);
}
out.latencyMs = { p50: pct(lat, .5), p95: pct(lat, .95), max: pct(lat, 1) };
// 4. same field edited by both "at once" 100 times → both converge to one value
let diverged = 0;
for (let i = 0; i < 100; i++) { attr(A.document, 'e5', 2).set('name', `A${i}`); attr(B.document, 'e5', 2).set('name', `B${i}`); }
await sleep(800); if (attr(A.document, 'e5', 2).get('name') !== attr(B.document, 'e5', 2).get('name')) diverged++;
out.concurrentSameField = { converged: diverged === 0, finalValue: attr(A.document, 'e5', 2).get('name') };
// 5. per-user undo: A's UndoManager tracks only A's local edits
const um = new Y.UndoManager(A.document.getMap('entities'), { trackedOrigins: new Set([null]), captureTimeout: 0 });
attr(A.document, 'e10', 3).set('name', 'A가바꿈'); await sleep(300);
attr(B.document, 'e10', 4).set('name', 'B가바꿈'); await sleep(300);
um.undo(); await sleep(300);
out.perUserUndo = { aField: attr(B.document, 'e10', 3).get('name'), bFieldKept: attr(A.document, 'e10', 4).get('name') === 'B가바꿈' };
// 5b. a bulk change (standardize: 50 attributes) as ONE transaction = one undo step
A.document.transact(() => { for (let k = 0; k < 50; k++) attr(A.document, 'e' + k, 5).set('st', 'ex'); }); await sleep(300);
um.undo(); await sleep(300);
out.bulkUndoOneStep = [...Array(50).keys()].every(k => attr(B.document, 'e' + k, 5).get('st') === 'ok');
// 6. read-only connection: its edits must not reach anyone
const V = await client('viewer'); attr(V.document, 'e20', 1).set('name', '조회자가바꿈'); await sleep(800);
out.readOnlyBlocked = attr(B.document, 'e20', 1).get('name') !== '조회자가바꿈';
// 7. offline merge: B goes offline, both make 200 edits, B reconnects
B.disconnect(); await sleep(200);
for (let i = 0; i < 200; i++) { attr(A.document, 'e' + (100 + (i % 100)), 6).set('name', `온${i}`); attr(B.document, 'e' + (200 + (i % 100)), 7).set('name', `오프${i}`); }
t = performance.now(); B.connect();
await new Promise(ok => { const iv = setInterval(() => { if (attr(A.document, 'e299', 7).get('name') === attr(B.document, 'e299', 7).get('name') && attr(B.document, 'e199', 6).get('name') === attr(A.document, 'e199', 6).get('name')) { clearInterval(iv); ok(); } }, 20); });
out.offlineMergeMs = +(performance.now() - t).toFixed(0);
out.offlineMergeConverged = Y.encodeStateVector(A.document).toString() === Y.encodeStateVector(B.document).toString();
// 8. server restart: content comes back from the stored state
await sleep(1500); A.destroy(); B.destroy(); V.destroy(); await sleep(300); await server1.destroy(); await sleep(300);
const server2 = await startServer();
t = performance.now(); const C = await client('lee'); out.afterRestartSyncMs = +(performance.now() - t).toFixed(0);
out.afterRestartIntact = C.document.getMap('entities').size === 300 && attr(C.document, 'e299', 7).get('name') === attr(C.document, 'e299', 7).get('name') && attr(C.document, 'e199', 6).get('name') === '온199';
out.storedBytes = fs.statSync(`${STORE}/${DOC}.bin`).size;
C.destroy(); await server2.destroy();
console.log(JSON.stringify(out, null, 1)); fs.writeFileSync('result.json', JSON.stringify({ node: process.version, yjs: '13.6.20', hocuspocus: '2.15.0', out }, null, 1));
process.exit(0);
