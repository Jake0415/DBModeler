// Spike S3b — Excel row limit for the dictionary round trip.
// For each row count: write a term-sheet xlsx (8 columns like the template), then read it back
// (a) full workbook load  (b) streaming reader — time, peak RSS, file size. Then a simple per-row validation pass.
// Usage: node --expose-gc bench.js
const ExcelJS = require('exceljs'); const fs = require('fs'); const path = require('path');
const SIZES = (process.env.SIZES || '20000,50000,100000,200000').split(',').map(Number);
const tmp = path.join(require('os').tmpdir(), 'dbm-excel-spike'); fs.mkdirSync(tmp, { recursive: true });
const mb = b => +(b / 1048576).toFixed(1);
async function write(n, file) {
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: file });
  const ws = wb.addWorksheet('용어');
  ws.addRow(['항목ID', '버전', '용어명', '영문약어명', '도메인', '설명', '사용상태', '비고']).commit();
  for (let i = 0; i < n; i++) ws.addRow([i % 3 ? `T-${String(i).padStart(6, '0')}` : '', 'V1', `요구사항상태코드${i}`, `DEMND_MATER_STTS_CD${i}`, i % 50 ? '코드C2' : '연월일C9', `요구사항 진행 상태 설명 ${i}`, '사용', '']).commit();
  await wb.commit();
}
const DOMS = new Set(['코드C2', '연월일C8', '명V100']);
const check = row => { const errs = []; if (!row[3]) errs.push('name'); if (/\s/.test(row[3] || '')) errs.push('space'); if (!DOMS.has(row[5])) errs.push('dom'); return errs.length; };
async function readFull(file) { const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(file); let n = 0, e = 0; wb.worksheets[0].eachRow((r, i) => { if (i > 1) { n++; e += check(r.values) ? 1 : 0; } }); return { n, e }; }
async function readStream(file) { let n = 0, e = 0; const rd = new ExcelJS.stream.xlsx.WorkbookReader(file, { sharedStrings: 'cache', worksheets: 'emit' }); for await (const ws of rd) for await (const r of ws) { if (r.number > 1) { n++; e += check(r.values) ? 1 : 0; } } return { n, e }; }
async function measure(fn) {
  global.gc && global.gc(); const base = process.memoryUsage().rss; let peak = base;
  const iv = setInterval(() => { peak = Math.max(peak, process.memoryUsage().rss); }, 20);
  const t = Date.now(); const r = await fn(); clearInterval(iv); peak = Math.max(peak, process.memoryUsage().rss);
  return { ms: Date.now() - t, peakExtraMB: mb(peak - base), ...r };
}
(async () => {
  const out = [];
  for (const n of SIZES) {
    const file = path.join(tmp, `terms-${n}.xlsx`);
    const w = await measure(() => write(n, file).then(() => ({})));
    const size = mb(fs.statSync(file).size);
    const s = await measure(() => readStream(file));
    const f = await measure(() => readFull(file));
    out.push({ rows: n, fileMB: size, writeMs: w.ms, streamReadMs: s.ms, streamPeakMB: s.peakExtraMB, fullReadMs: f.ms, fullPeakMB: f.peakExtraMB, errRows: s.e });
    console.error('done', n);
  }
  console.table(out); fs.writeFileSync('result.json', JSON.stringify({ node: process.version, out }, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
