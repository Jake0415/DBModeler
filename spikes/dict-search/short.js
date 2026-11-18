// Spike S1b — short queries (1–2 chars) on the 200k table left by bench.js:
// (a) substring + exact total (baseline) (b) substring, page only, total capped at 1,000 (c) prefix with btree text_pattern_ops
const { Client } = require('pg');
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
(async () => {
  const c = new Client({ host: 'localhost', port: 55433, user: 'postgres', password: 'spike', database: 'spike' }); await c.connect();
  await c.query('CREATE INDEX IF NOT EXISTS cho_prefix ON dict_item (name_cho text_pattern_ops)');
  await c.query('CREATE INDEX IF NOT EXISTS name_prefix ON dict_item (name text_pattern_ops)');
  await c.query('ANALYZE dict_item');
  const N = (await c.query('SELECT count(*)::int n FROM dict_item')).rows[0].n;
  const sample = (await c.query('SELECT name, name_cho FROM dict_item WHERE src = $1 ORDER BY random() LIMIT 150', ['공통'])).rows;
  const out = [];
  const run = async (label, sql, qs) => { const ts = []; for (const q of qs) { const t = process.hrtime.bigint(); await c.query(sql, [q]); ts.push(Number(process.hrtime.bigint() - t) / 1e6); } out.push({ N, label, p50: +pct(ts, .5).toFixed(1), p95: +pct(ts, .95).toFixed(1), max: +Math.max(...ts).toFixed(1) }); };
  const cho2 = sample.map(r => r.name_cho.substr(0, 2)), sub2 = sample.map(r => r.name.substr(0, 2)), one = sample.map(r => r.name.substr(0, 1));
  await run('초성 2자 · 부분 일치 + 정확한 총건수', `SELECT *, count(*) OVER () t FROM dict_item WHERE name_cho LIKE '%'||$1||'%' ORDER BY length(name), name LIMIT 30`, cho2);
  await run('초성 2자 · 부분 일치 + 총건수 1,000 상한', `WITH m AS (SELECT id, name FROM dict_item WHERE name_cho LIKE '%'||$1||'%' LIMIT 1001) SELECT d.*, (SELECT count(*) FROM m) t FROM dict_item d JOIN m USING (id) ORDER BY length(d.name), d.name LIMIT 30`, cho2);
  await run('초성 2자 · 앞부분 일치(btree)', `SELECT *, count(*) OVER () t FROM dict_item WHERE name_cho LIKE $1||'%' ORDER BY length(name), name LIMIT 30`, cho2);
  await run('이름 2자 · 부분 일치 + 정확한 총건수', `SELECT *, count(*) OVER () t FROM dict_item WHERE name ILIKE '%'||$1||'%' ORDER BY length(name), name LIMIT 30`, sub2);
  await run('이름 2자 · 앞부분 일치(btree)', `SELECT *, count(*) OVER () t FROM dict_item WHERE name LIKE $1||'%' ORDER BY length(name), name LIMIT 30`, sub2);
  await run('이름 1자 · 앞부분 일치(btree)', `SELECT *, count(*) OVER () t FROM dict_item WHERE name LIKE $1||'%' ORDER BY length(name), name LIMIT 30`, one);
  console.table(out); require('fs').writeFileSync('result-short.json', JSON.stringify(out, null, 1)); await c.end();
})().catch(e => { console.error(e); process.exit(1); });
