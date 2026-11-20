/* NeoDB mockup publishing audit (17 · P4) — run from the mock tools ([퍼블리싱 점검]) or a mockup page's console.
   NeoAudit.snapshot(w, prefix) → computed-style fingerprint of every visible element on all screens (for "no visual change" refactors)
   NeoAudit.compare(a, b)       → which screens / elements differ between two snapshots
   NeoAudit.measure(widths)     → the guide-v2 checks per screen and width
   NeoAudit.conditions()        → theme · frame · density the run used (results are only comparable under the same conditions)
   Side effects: screens open with ?audit=1 (the role in the address is not saved) and every dbm-* key is restored after a run. */
(function () {
  // every product screen; index (mockup map) and erd (alias of model) are not screens of the product
  const PAGES = [['home', 'kim'], ['system', 'kim'], ['model', 'kim'], ['standardize', 'kim'], ['term-wizard', 'kim'], ['ddl', 'kim'], ['outputs', 'kim'], ['import', 'kim'], ['dictionary', 'kim'], ['dict-grid', 'kim'], ['domain-groups', 'kim'], ['dict-history', 'kim'], ['excel-import', 'kim'], ['uploads', 'kim'], ['candidates', 'kim'], ['approvals', 'kim'], ['audit', 'lee'], ['settings', 'lee'], ['mypage', 'kim'], ['login', 'kim'], ['error', 'kim'], ['styleguide', 'kim']];
  const PROPS = ['display', 'position', 'width', 'height', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontSize', 'fontWeight', 'lineHeight', 'fontFamily', 'letterSpacing', 'color', 'backgroundColor', 'backgroundImage', 'borderTopWidth', 'borderTopColor', 'borderTopStyle', 'borderBottomWidth', 'borderBottomColor', 'borderLeftWidth', 'borderRightWidth', 'borderTopLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'gap', 'opacity', 'textAlign', 'textDecorationLine', 'overflowX', 'overflowY', 'zIndex', 'outlineStyle', 'gridTemplateColumns', 'alignItems', 'justifyContent', 'whiteSpace', 'verticalAlign'];
  const load = (pg, as, w, prefix = '') => new Promise(ok => { const f = document.createElement('iframe'); f.style.cssText = `position:fixed;left:-5000px;top:0;width:${w}px;height:1000px`; document.body.appendChild(f); f.onload = () => setTimeout(() => ok(f), 1100); f.src = `${prefix}${pg}.html?as=${as}&audit=1`; });
  const vis = (w, el) => { const r = el.getBoundingClientRect(); const cs = w.getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0; };
  const skip = el => el.closest('.rcur, .toasts, #cur-hong, #cur-park, .mock-tools, .mockfab, .scr-panel');   // moving cursors, timed toasts, mock tools
  // the screens write to the shared storage while they load (last area, tree state …) — put everything back afterwards
  const keep = () => { const s = {}; try { Object.keys(localStorage).filter(k => k.startsWith('dbm-')).forEach(k => { s[k] = localStorage.getItem(k); }); } catch (e) {} return s; };
  const restore = s => { try { Object.keys(localStorage).filter(k => k.startsWith('dbm-') && !(k in s)).forEach(k => localStorage.removeItem(k)); Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) {} };
  const conditions = () => { const h = document.documentElement; return `테마 ${h.dataset.theme || 'light'} · 프레임 ${['frame-fit', 'frame-1600'].find(c => h.classList.contains(c)) || '1920'} · 밀도 ${h.dataset.density || 'default'}`; };
  async function snapshot(w0 = 1920, prefix = '') {
    const saved = keep(), out = {};
    try { for (const [pg, as] of PAGES) {
      const f = await load(pg, as, w0, prefix); const w = f.contentWindow, d = w.document;
      try { out[pg] = [...d.body.querySelectorAll('*')].filter(el => !skip(el) && vis(w, el)).map(el => { const cs = w.getComputedStyle(el); return el.tagName + '.' + String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).trim().replace(/\s+/g, '.') + '|' + PROPS.map(p => p === 'width' || p === 'height' ? Math.round(parseFloat(cs[p]) || 0) : cs[p]).join('|'); }); }
      catch (e) { out[pg] = ['ERR ' + e]; }
      f.remove();
    } } finally { restore(saved); }
    return out;
  }
  function compare(a, b) {
    const rep = {};
    Object.keys(a).forEach(pg => { const x = a[pg] || [], y = b[pg] || []; const diffs = [];
      const n = Math.max(x.length, y.length); for (let i = 0; i < n && diffs.length < 12; i++) if (x[i] !== y[i]) { const xs = (x[i] || '').split('|'), ys = (y[i] || '').split('|'); const props = PROPS.map((p, j) => xs[j + 1] !== ys[j + 1] ? `${p}: ${xs[j + 1]} → ${ys[j + 1]}` : null).filter(Boolean); diffs.push(`#${i} ${(y[i] || x[i] || '').split('|')[0]} ${xs[0] !== ys[0] ? '(element ' + xs[0] + ' → ' + ys[0] + ')' : ''} ${props.join(' · ')}`); }
      if (x.length !== y.length || diffs.length) rep[pg] = { count: `${x.length} → ${y.length}`, diffs }; });
    return rep;
  }
  // accessible name (enough for the mock: aria-label · aria-labelledby · label · visible text · title)
  const nameOf = (d, el) => { const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\s+/).map(id => (d.getElementById(id) || {}).textContent || '').join(' ').trim(); if (t) return t; }
    return (el.getAttribute('aria-label') || '').trim() || (el.id && d.querySelector(`label[for="${el.id}"]`) ? 'label' : '') || (el.closest('label') ? 'label' : '') || [...el.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.matches('.sr-only') && n.getAttribute('aria-hidden') !== 'true')).map(n => n.textContent).join('').trim() || (el.querySelector('.sr-only') || {}).textContent || el.title || ''; };
  async function measure(widths = [1920, 1600]) {
    const glyph = /[▭⟜↖↔✓✔✕✗★☆●○◐◆▸▾▶◀⋯☰⚙✎]/; const res = {}; const saved = keep();
    const src = {}; await Promise.all(PAGES.map(async ([pg]) => { try { const t = await (await fetch(pg + '.html', { cache: 'no-store' })).text(); src[pg] = (t.match(/\sstyle="/g) || []).length; } catch (e) {} }));
    try { for (const w0 of widths) for (const [pg, as] of PAGES) {
      const f = await load(pg, as, w0); const w = f.contentWindow, d = w.document, R = {};
      try {
        const texts = [...d.body.querySelectorAll('*')].filter(el => !skip(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && vis(w, el));
        R.small = texts.filter(el => parseFloat(w.getComputedStyle(el).fontSize) < 12 && !el.closest('#world')).length;   // the model canvas zooms; its 100% sizes are checked in the page style
        R.bold700 = texts.filter(el => w.getComputedStyle(el).fontWeight === '700').length;
        // size rule: button components only (tabs, links and tree rows have their own sizes)
        const btns = [...d.querySelectorAll('.btn, .iconbtn, .cv-toolbar .tb, .chip')].filter(el => vis(w, el) && !skip(el));
        R.btnH = [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().height)))].sort((p, q) => p - q).join(' · ');
        // name rule: every control a pointer or keyboard can use
        const ctrls = [...d.querySelectorAll('button, [role=button], [role=tab], [role=menuitem], a[href]')].filter(el => vis(w, el) && !skip(el));
        R.noName = ctrls.filter(el => !nameOf(d, el)).length;
        R.noLabel = [...d.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(i => vis(w, i) && !skip(i) && !nameOf(d, i)).length;   // checkboxes and radios included
        R.glyph = ctrls.filter(b => glyph.test([...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''))).length;   // glyphs standing in for an icon (own text only)
        R.inline = d.querySelectorAll('[style]').length;   // after scripts (tree indent, canvas positions …)
        R.inlineSrc = src[pg];                              // in the HTML source
        R.overflow = d.documentElement.scrollWidth > w0 + 1;
        R.primary = [...d.querySelectorAll('.btn.primary')].filter(b => vis(w, b)).length;
      } catch (e) { R.err = String(e); }
      res[w0 + ' ' + pg] = R; f.remove();
    } } finally { restore(saved); }
    return res;
  }
  window.NeoAudit = { snapshot, compare, measure, conditions, PAGES };
})();
