// Drives the installed Chrome (headless, 1600×900) through each benchmark page and prints the numbers.
// Usage: node run.mjs  (needs `vite` dev server on :5190 — `npm exec vite`)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CASES = process.env.CASES ? process.env.CASES.split(' ') : [
  '#erd?n=100&vis=1&lod=1', '#erd?n=300&vis=0&lod=0', '#erd?n=300&vis=1&lod=0', '#erd?n=300&vis=1&lod=1', '#erd?n=300&vis=1&lod=2', '#erd?n=300&vis=1&lod=2&mm=0', '#erd?n=1000&vis=1&lod=2',
  '#table?rows=50000&virt=1', '#table?rows=200000&virt=1', '#table?rows=5000&virt=0', '#table?rows=50000&virt=0'
];
const gpu = process.env.GPU === '1';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: gpu ? false : 'new', args: ['--window-size=1600,900', ...(gpu ? [] : ['--enable-gpu', '--use-angle=d3d11'])], defaultViewport: { width: 1600, height: 900 } });
const out = [];
for (const c of CASES) {
  const page = await browser.newPage();
  const t = Date.now();
  await page.goto('http://localhost:5190/' + c, { waitUntil: 'domcontentloaded' });
  try { await page.waitForFunction(() => window.__result, { timeout: 180000, polling: 500 }); const r = await page.evaluate(() => window.__result); r.case = c; r.wall = Date.now() - t; out.push(r); console.log(JSON.stringify(r)); }
  catch (e) { out.push({ case: c, error: String(e).slice(0, 120) }); console.log(c, 'ERROR', e.message); }
  await page.close();
}
const ver = await browser.version(); await browser.close();
fs.writeFileSync(`result-${gpu ? 'headful' : 'headless'}.json`, JSON.stringify({ chrome: ver, out }, null, 1));
