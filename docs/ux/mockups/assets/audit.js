/* NeoDB mockup publishing audit (17 · P4) — run from any mockup page's console, or via ?audit in the mock tools.
   NeoAudit.snapshot()      → computed-style fingerprint of every visible element on all screens (for "no visual change" refactors)
   NeoAudit.compare(a, b)   → which screens / elements differ between two snapshots
   NeoAudit.measure()       → the 17 audit table: font sizes · weights · button / input heights · inline styles · unlabeled controls · glyph icons · overflow */
(function () {
  const PAGES = [['home', 'kim'], ['system', 'kim'], ['model', 'kim'], ['standardize', 'kim'], ['ddl', 'kim'], ['outputs', 'kim'], ['import', 'kim'], ['dictionary', 'kim'], ['dict-history', 'kim'], ['excel-import', 'kim'], ['uploads', 'kim'], ['candidates', 'kim'], ['approvals', 'kim'], ['audit', 'lee'], ['settings', 'lee'], ['mypage', 'kim'], ['login', 'kim'], ['error', 'kim'], ['styleguide', 'kim']];
  const PROPS = ['display', 'position', 'width', 'height', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontSize', 'fontWeight', 'lineHeight', 'fontFamily', 'letterSpacing', 'color', 'backgroundColor', 'backgroundImage', 'borderTopWidth', 'borderTopColor', 'borderTopStyle', 'borderBottomWidth', 'borderBottomColor', 'borderLeftWidth', 'borderRightWidth', 'borderTopLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'gap', 'opacity', 'textAlign', 'textDecorationLine', 'overflowX', 'overflowY', 'zIndex', 'outlineStyle', 'gridTemplateColumns', 'alignItems', 'justifyContent', 'whiteSpace', 'verticalAlign'];
  // prefix: another copy of the mockups to compare against (e.g. '_base/' = an older commit extracted next to this one)
  const load = (pg, as, w, prefix = '') => new Promise(ok => { const f = document.createElement('iframe'); f.style.cssText = `position:fixed;left:-5000px;top:0;width:${w}px;height:1000px`; document.body.appendChild(f); f.onload = () => setTimeout(() => ok(f), 1100); f.src = `${prefix}${pg}.html?as=${as}&audit=1`; });
  const vis = (w, el) => { const r = el.getBoundingClientRect(); const cs = w.getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
  const skip = el => el.closest('.rcur, .toasts, #cur-hong, #cur-park, .mock-tools, .scr-panel');   // moving cursors, timed toasts, mock tools
  async function snapshot(w0 = 1920, prefix = '') {
    const out = {};
    for (const [pg, as] of PAGES) {
      const f = await load(pg, as, w0, prefix); const w = f.contentWindow, d = w.document;
      try { out[pg] = [...d.body.querySelectorAll('*')].filter(el => !skip(el) && vis(w, el)).map(el => { const cs = w.getComputedStyle(el); return el.tagName + '.' + String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).trim().replace(/\s+/g, '.') + '|' + PROPS.map(p => p === 'width' || p === 'height' ? Math.round(parseFloat(cs[p]) || 0) : cs[p]).join('|'); }); }
      catch (e) { out[pg] = ['ERR ' + e]; }
      f.remove();
    }
    return out;
  }
  function compare(a, b) {
    const rep = {};
    Object.keys(a).forEach(pg => { const x = a[pg] || [], y = b[pg] || []; const diffs = [];
      const n = Math.max(x.length, y.length); for (let i = 0; i < n && diffs.length < 12; i++) if (x[i] !== y[i]) { const xs = (x[i] || '').split('|'), ys = (y[i] || '').split('|'); const props = PROPS.map((p, j) => xs[j + 1] !== ys[j + 1] ? `${p}: ${xs[j + 1]} → ${ys[j + 1]}` : null).filter(Boolean); diffs.push(`#${i} ${(y[i] || x[i] || '').split('|')[0]} ${xs[0] !== ys[0] ? '(element ' + xs[0] + ' → ' + ys[0] + ')' : ''} ${props.join(' · ')}`); }
      if (x.length !== y.length || diffs.length) rep[pg] = { count: `${x.length} → ${y.length}`, diffs }; });
    return rep;
  }
  async function measure(widths = [1920, 1600]) {
    const glyph = /[▭⟜↖↔✓✔✕✗★☆●○◐◆▸▾▶◀⋯☰⚙✎]/; const res = {};
    for (const w0 of widths) for (const [pg, as] of PAGES) {
      const f = await load(pg, as, w0); const w = f.contentWindow, d = w.document, R = {};
      try {
        const texts = [...d.body.querySelectorAll('*')].filter(el => !skip(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && vis(w, el));
        R.small = texts.filter(el => parseFloat(w.getComputedStyle(el).fontSize) < 12 && !el.closest('#world')).length;   // the model canvas zooms — not counted
        R.bold700 = texts.filter(el => w.getComputedStyle(el).fontWeight === '700').length;
        const btns = [...d.querySelectorAll('.btn, .iconbtn, .cv-toolbar .tb, .chip')].filter(el => vis(w, el) && !skip(el));   // the button components (tabs, links and tree rows are not buttons here)
        R.btnH = [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().height)))].sort((p, q) => p - q).join(' · ');
        R.noName = btns.filter(b => !(b.getAttribute('aria-label') || b.textContent.trim() || b.title)).length;
        R.noLabel = [...d.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter(i => vis(w, i) && !(i.getAttribute('aria-label') || (i.id && d.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || i.title)).length;
        R.glyph = btns.filter(b => glyph.test(b.textContent)).length;
        R.inline = d.querySelectorAll('[style]').length;
        R.overflow = d.documentElement.scrollWidth > w0 + 1;
        R.primary = [...d.querySelectorAll('.btn.primary')].filter(b => vis(w, b)).length;
      } catch (e) { R.err = String(e); }
      res[w0 + ' ' + pg] = R; f.remove();
    }
    return res;
  }
  window.NeoAudit = { snapshot, compare, measure, PAGES };
})();
