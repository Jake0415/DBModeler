/* DBModeler mockup shell & interactions (static, no backend) */
(function () {
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  const frame = qs.get('w') || store.get('dbm-frame', '1920');
  const theme = qs.get('theme') || store.get('dbm-theme', 'light');
  if (frame === '1600') root.classList.add('frame-1600');
  root.setAttribute('data-theme', theme);

  const ICON = {
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    db: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  window.ICON = ICON;

  function navLink(href, label, key, extra) {
    const page = document.body.dataset.page;
    const on = key && page === key ? ' on' : '';
    return `<a class="${extra || ''}${on}" href="${href}">${label}</a>`;
  }

  function buildShell() {
    const app = document.getElementById('app');
    const content = document.getElementById('content');
    if (!app || !content) return;
    const top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML = `
      <div class="brand"><span class="brand-mark">DB</span>DBModeler <span class="org">· 한국데이터진흥원</span></div>
      <div class="gsearch">${ICON.search}<span>사전·모델·결재 검색</span><kbd>Ctrl K</kbd></div>
      <div class="spacer"></div>
      <div class="mock-tools">목업 프레임
        <span class="seg" id="seg-frame"><button data-v="1920">1920</button><button data-v="1600">1600</button></span>
        <span class="seg" id="seg-theme"><button data-v="light">라이트</button><button data-v="dark">다크</button></span>
      </div>
      <a class="iconbtn" href="approvals.html" title="알림">${ICON.bell}<span class="dot">5</span></a>
      <div class="avatar" title="김모델 · 모델러 · DA">김</div>`;
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.innerHTML = `
      <div class="nav-group">
        <div class="nav-title">사전</div>
        ${navLink('dictionary.html', ICON.book + '통합 검색', 'dictionary')}
        ${navLink('excel-import.html', '<span style="width:16px"></span>엑셀 가져오기', 'excel', '')}
        ${navLink('candidates.html', '<span style="width:16px"></span>후보 큐<span class="count">3</span>', 'candidates', '')}
      </div>
      <div class="nav-group">
        <div class="nav-title">결재</div>
        ${navLink('approvals.html', ICON.check + '결재함<span class="count">5</span>', 'approvals')}
      </div>
      <div class="nav-group">
        <div class="nav-title">시스템</div>
        ${navLink('system.html', ICON.db + '요구사항관리<span class="tag">Oracle</span>', 'system')}
        ${navLink('model.html', '요구사항 · 프로젝트', 'model', 'sub2')}
        ${navLink('model.html?area=risk', '리스크', '', 'sub2')}
        ${navLink('system.html', ICON.db + '인사시스템<span class="tag">Tibero</span>', '')}
        ${navLink('system.html', ICON.db + '회계시스템<span class="tag">PostgreSQL</span>', '')}
      </div>
      <div class="nav-group">
        <div class="nav-title">관리</div>
        ${navLink('settings.html', ICON.gear + '설정', 'settings')}
      </div>`;
    app.insertBefore(nav, content);
    app.insertBefore(top, nav);
    const toasts = document.createElement('div');
    toasts.className = 'toasts';
    toasts.id = 'toasts';
    app.appendChild(toasts);

    const sf = top.querySelector('#seg-frame'), st = top.querySelector('#seg-theme');
    sf.querySelector(`[data-v="${frame}"]`).classList.add('on');
    st.querySelector(`[data-v="${theme}"]`).classList.add('on');
    sf.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-frame', v); location.search = ''; location.reload(); });
    st.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-theme', v); root.setAttribute('data-theme', v); st.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); });
  }

  window.toast = function (msg, type) {
    const box = document.getElementById('toasts'); if (!box) return;
    const colors = { success: 'var(--success)', info: 'var(--info)', danger: 'var(--danger)', violet: 'var(--violet)' };
    const marks = { success: '✓', info: 'i', danger: '!', violet: '◆' };
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="ic" style="background:${colors[type || 'success']}">${marks[type || 'success']}</span><div>${msg}</div>`;
    box.appendChild(t);
    setTimeout(() => t.remove(), type === 'danger' ? 8000 : 4000);
  };

  function wire() {
    document.addEventListener('click', e => {
      const op = e.target.closest('[data-open]');
      if (op) {
        e.preventDefault();
        op.dataset.open.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.add('open'); });
        if (op.dataset.closeOthers) op.dataset.closeOthers.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.remove('open'); });
      }
      const cl = e.target.closest('[data-close]');
      if (cl) { e.preventDefault(); cl.dataset.close.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.remove('open'); }); }
      const tg = e.target.closest('[data-toggle]');
      if (tg) { e.preventDefault(); const el = document.getElementById(tg.dataset.toggle); if (el) el.classList.toggle('closed'); }
      const tb = e.target.closest('.tabs button[data-tab]');
      if (tb) {
        const scope = tb.closest('[data-tabscope]') || document;
        scope.querySelectorAll('.tabs button[data-tab]').forEach(b => b.classList.toggle('on', b === tb));
        scope.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === tb.dataset.tab));
      }
      const row = e.target.closest('tr.click');
      if (row) {
        row.parentElement.querySelectorAll('tr.sel').forEach(r => r.classList.remove('sel'));
        row.classList.add('sel');
        if (row.dataset.panel) { const p = document.getElementById(row.dataset.panel); if (p) p.classList.add('open'); }
      }
      const chip = e.target.closest('.chip[data-group]');
      if (chip) {
        const g = chip.dataset.group;
        if (chip.dataset.multi) chip.classList.toggle('on');
        else document.querySelectorAll(`.chip[data-group="${g}"]`).forEach(c => c.classList.toggle('on', c === chip));
        if (chip.dataset.filter !== undefined) filterRows(g, chip.dataset.filter);
      }
      const tgl = e.target.closest('.toggle');
      if (tgl) tgl.classList.toggle('on');
      const ts = e.target.closest('[data-toast]');
      if (ts) window.toast(ts.dataset.toast, ts.dataset.toastType);
      const cand = e.target.closest('.cand');
      if (cand) { cand.parentElement.querySelectorAll('.cand').forEach(c => c.classList.toggle('on', c === cand)); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { const o = document.querySelector('.overlay.open'); if (o) o.classList.remove('open'); }
    });
  }

  function filterRows(group, value) {
    document.querySelectorAll(`[data-filter-target="${group}"] tbody tr`).forEach(tr => {
      tr.style.display = !value || (tr.dataset.f || '').split(' ').includes(value) ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => { buildShell(); wire();
    if (location.hash) { const b = document.querySelector(`.tabs button[data-tab="${location.hash.slice(1)}"]`); if (b) b.click(); }
    if (window.pageInit) window.pageInit(); });
})();
