// Spike S1 — dictionary search: substring (ILIKE %q%) / initial-consonant (초성) / abbreviation,
// with and without pg_trgm GIN, at several dictionary sizes. Also OFFSET vs keyset paging.
// Input: public standard seed (행안부 공통표준 2025.11, public data) read from SEED path — not committed.
// Usage: node bench.js   (env: PGPORT=55433, SEED=<path to public-standard json.gz>)
const { Client } = require('pg');
const zlib = require('zlib'), fs = require('fs');

const SEED = process.env.SEED || 'D:/project/sws-data-governance/backend/seed/public-standard-2025-11.json.gz';
const SIZES = (process.env.SIZES || '16589,50000,200000').split(',').map(Number);
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const cho = s => [...s].map(c => { const n = c.charCodeAt(0) - 0xac00; return n >= 0 && n < 11172 ? CHO[Math.floor(n / 588)] : c; }).join('');

let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];

function loadSeed() {
  const j = JSON.parse(zlib.gunzipSync(fs.readFileSync(SEED))).data;
  const rows = [];
  j.words.forEach(w => rows.push(['word', '공통', w.name, w.abbreviation || '', w.english_name || '', w.description || '', w.synonyms_text || '']));
  j.domains.forEach(d => rows.push(['domain', '공통', d.name, '', '', d.description || '', '']));
  j.terms.forEach(t => rows.push(['term', '공통', t.standard_term_name, t.standard_term_abbreviation || '', '', t.standard_term_description || '', '']));
  return { rows, words: j.words.filter(w => w.name && w.abbreviation) };
}
// synthetic organisation terms: 2–4 real words combined (realistic Korean names and abbreviations)
function synth(words, n, start) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = 2 + Math.floor(rnd() * 3), ws = Array.from({ length: k }, () => pick(words));
    out.push(['term', '기관', ws.map(w => w.name).join('') + (i + start), ws.map(w => w.abbreviation).join('_'), '', '기관 용어 ' + i, '']);
  }
  return out;
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

async function main() {
  const c = new Client({ host: 'localhost', port: +(process.env.PGPORT || 55433), user: 'postgres', password: 'spike', database: 'spike' });
  await c.connect();
  await c.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  const { rows: base, words } = loadSeed();
  // query set: fixed per run so every variant answers the same questions
  const names = base.filter(r => r[0] === 'term').map(r => r[2]);
  const Q = { sub2: [], sub3: [], cho2: [], cho3: [], abbr3: [] };
  for (let i = 0; i < 150; i++) {
    const n = pick(names); const p = Math.floor(rnd() * Math.max(1, n.length - 3));
    Q.sub2.push(n.substr(p, 2)); Q.sub3.push(n.substr(p, 3));
    Q.cho2.push(cho(n.substr(0, 2))); Q.cho3.push(cho(n.substr(0, 3)));
    const a = pick(base.filter(r => r[3]).map(r => r[3])); Q.abbr3.push(a.substr(0, 3));
  }
  const out = [];
  for (const N of SIZES) {
    await c.query('DROP TABLE IF EXISTS dict_item');
    await c.query(`CREATE TABLE dict_item (id serial PRIMARY KEY, kind text, src text, name text, abbr text, eng text, descr text, syn text, name_cho text)`);
    const all = base.concat(synth(words, Math.max(0, N - base.length), 1));
    for (let i = 0; i < all.length; i += 2000) {
      const ch = all.slice(i, i + 2000), vals = [], params = [];
      ch.forEach((r, j) => { const b = j * 8; vals.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`); params.push(...r, cho(r[2])); });
      await c.query(`INSERT INTO dict_item (kind,src,name,abbr,eng,descr,syn,name_cho) VALUES ${vals.join(',')}`, params);
    }
    await c.query('ANALYZE dict_item');
    for (const variant of ['none', 'trgm']) {
      if (variant === 'trgm') {
        const t0 = Date.now();
        await c.query('CREATE INDEX ON dict_item USING gin (name gin_trgm_ops)');
        await c.query('CREATE INDEX ON dict_item USING gin (abbr gin_trgm_ops)');
        await c.query('CREATE INDEX ON dict_item USING gin (name_cho gin_trgm_ops)');
        await c.query('ANALYZE dict_item');
        out.push({ N, variant, kind: 'index_build_ms', p50: Date.now() - t0 });
      }
      const run = async (label, sql, qs, mk) => {
        const ts = []; let hits = 0;
        for (const q of qs) { const t = process.hrtime.bigint(); const r = await c.query(sql, [mk(q)]); ts.push(Number(process.hrtime.bigint() - t) / 1e6); hits += r.rows.length; }
        out.push({ N, variant, kind: label, p50: +pct(ts, 0.5).toFixed(1), p95: +pct(ts, 0.95).toFixed(1), max: +Math.max(...ts).toFixed(1), avgHits: +(hits / qs.length).toFixed(1) });
      };
      // page of 30 + total count in one round trip (what the list screen needs)
      const page = where => `SELECT *, count(*) OVER () AS total FROM dict_item WHERE ${where} ORDER BY length(name), name LIMIT 30`;
      await run('name %2자%', page('name ILIKE $1'), Q.sub2, q => `%${q}%`);
      await run('name %3자%', page('name ILIKE $1'), Q.sub3, q => `%${q}%`);
      await run('초성 2자', page('name_cho LIKE $1'), Q.cho2, q => `%${q}%`);
      await run('초성 3자', page('name_cho LIKE $1'), Q.cho3, q => `%${q}%`);
      await run('약어 3자', page('abbr ILIKE $1'), Q.abbr3, q => `%${q}%`);
      await run('통합(이름|약어|초성) 3자', page('(name ILIKE $1 OR abbr ILIKE $1 OR name_cho LIKE $1)'), Q.sub3, q => `%${q}%`);
    }
    // paging: deep OFFSET vs keyset on the default sort (src, kind, name, id)
    await c.query('CREATE INDEX IF NOT EXISTS dict_sort ON dict_item (name, id)');
    const deep = Math.floor(N * 0.8);
    let t = process.hrtime.bigint(); await c.query('SELECT * FROM dict_item ORDER BY name, id OFFSET $1 LIMIT 30', [deep]); const off = Number(process.hrtime.bigint() - t) / 1e6;
    const k = (await c.query('SELECT name, id FROM dict_item ORDER BY name, id OFFSET $1 LIMIT 1', [deep])).rows[0];
    t = process.hrtime.bigint(); await c.query('SELECT * FROM dict_item WHERE (name, id) > ($1, $2) ORDER BY name, id LIMIT 30', [k.name, k.id]); const key = Number(process.hrtime.bigint() - t) / 1e6;
    out.push({ N, variant: '-', kind: `paging OFFSET ${deep}`, p50: +off.toFixed(1) }, { N, variant: '-', kind: 'paging keyset', p50: +key.toFixed(1) });
    const sz = (await c.query(`SELECT pg_size_pretty(pg_total_relation_size('dict_item')) s`)).rows[0].s;
    out.push({ N, variant: '-', kind: 'table+index size', p50: sz });
    console.error(`done N=${N}`);
  }
  console.table(out);
  fs.writeFileSync('result.json', JSON.stringify(out, null, 1));
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
