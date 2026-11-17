/* DBModeler mockup shell & interactions (static, no backend) — v4 */
(function () {
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  window.dbmStore = store;
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  const frame = qs.get('w') || store.get('dbm-frame', '1920');
  const themePref = qs.get('theme') || store.get('dbm-theme', 'light');
  const applyTheme = t => root.setAttribute('data-theme', t === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t);
  if (frame === '1600') root.classList.add('frame-1600');
  applyTheme(themePref);

  /* ---- product / users / roles ---- */
  const PRODUCT = { name: 'DBModeler', version: '1.0.0', build: '20261117.a1b2c3', env: '운영', released: '2026-11-17', dict: '공통표준 2025.11 (적재 11/03) · 기관 사전 제정 12차' };
  window.PRODUCT = PRODUCT;
  const USERS = {
    kim: { id: 'kim', name: '김모델', org: '데이터정책팀', mail: 'kim@kda.go.kr', roles: ['modeler', 'da'], systems: ['요구사항관리', '인사시스템'] },
    park: { id: 'park', name: '박설계', org: '정보화사업팀', mail: 'park@kda.go.kr', roles: ['modeler'], systems: ['요구사항관리'] },
    lee: { id: 'lee', name: '이데이터', org: '데이터정책팀', mail: 'lee@kda.go.kr', roles: ['da', 'admin'], systems: ['전체'] },
    hyun: { id: 'hyun', name: '이현업', org: '기획조정실', mail: 'hyun@kda.go.kr', roles: ['owner'], systems: ['전체'] }
  };
  const ROLE_NAME = { modeler: '모델러', da: 'DA', owner: '기관 담당자', admin: 'Admin' };
  window.USERS = USERS; window.ROLE_NAME = ROLE_NAME;
  const meId = qs.get('as') || store.get('dbm-role', 'kim');
  const ME = Object.assign({}, USERS[meId] || USERS.kim, { has(r) { return this.roles.includes(r); } });
  window.ME = ME;
  window.roleBadges = u => u.roles.map(r => `<span class="badge">${ROLE_NAME[r]}</span>`).join(' ');

  /* ---- approval documents (shared, persisted per viewer) ---- */
  const DOCS0 = [
    { id: 'REQ-2026-0016', type: 'dict', title: '엑셀 일괄 — 용어 120건', req: 'kim', step: 'da', n: 120, date: '11/17 16:10', cc: [], reason: '요구사항관리 용어 초기 적재(엑셀 가져오기)', kind: 'excel' },
    { id: 'REQ-2026-0015', type: 'model', title: '요구사항관리 › 요구사항·프로젝트 v5 확정', req: 'kim', step: 'da', n: 9, date: '11/17 16:30', cc: ['hyun'], reason: '산출물 관리 테이블 추가에 따른 v5 확정' },
    { id: 'REQ-2026-0014', type: 'dict', title: '산출물제출일자 외 1건 등록', req: 'kim', step: 'da', n: 2, date: '11/17 15:02', cc: ['hyun'], reason: '요구사항관리 산출물 제출 관리 기능 추가', kind: 'r14' },
    { id: 'REQ-2026-0013', type: 'dict', title: "엔터티 용어 '산출물기본' 등록", req: 'kim', step: 'da', n: 1, date: '11/17 14:20', cc: [], reason: '산출물 관리 엔터티 추가' },
    { id: 'REQ-2026-0012', type: 'dict', title: "단어 '수령자' 등록 (후보 전환)", req: 'lee', step: 'da', n: 1, date: '11/17 11:05', cc: ['kim'], reason: '후보 큐 4건 발생 — 수령자 RCPNT' },
    { id: 'REQ-2026-0010', type: 'dict', title: "도메인 '코드C2' 규격 변경", req: 'lee', step: 'final', n: 1, date: '11/16 17:05', cc: [], reason: '2자리 코드 허용 문자 확대' },
    { id: 'REQ-2026-0009', type: 'dict', title: '단어 3건 등록', req: 'park', step: 'da', n: 3, date: '11/16 09:12', cc: ['kim'], reason: '인사시스템 신규 화면' },
    { id: 'REQ-2026-0003', type: 'model', title: '요구사항관리 › 요구사항·프로젝트 v4 확정', req: 'park', step: 'done', n: 7, date: '11/03 10:00', cc: [], reason: 'v4 확정' }
  ];
  window.getDocs = () => { try { const s = JSON.parse(store.get('dbm-docs', 'null')); if (Array.isArray(s)) return s; } catch (e) {} return JSON.parse(JSON.stringify(DOCS0)); };
  window.saveDocs = d => store.set('dbm-docs', JSON.stringify(d));
  window.myQueue = (docs) => docs.filter(d => (d.step === 'da' && ME.has('da')) || (d.step === 'final' && ME.has('owner')));
  window.STEP_NAME = { da: 'DA 승인', final: '최종 승인', done: '완료', withdrawn: '회수됨', rejected: '반려됨' };

  /* ---- notifications ---- */
  const NOTIFS0 = [
    { id: 'n1', k: 'appr', t: 'REQ-2026-0015 모델 확정 — DA 승인 차례', m: '김모델 · 요구사항·프로젝트 v5', href: 'approvals.html?doc=REQ-2026-0015', at: '11/17 16:30', for: ['da'] },
    { id: 'n2', k: 'job', t: '엑셀 검증 완료 — 용어 120건', m: '정상 112 · 확인 필요 4 · 오류 4 → 결과 검토', href: 'excel-import.html?step=5', at: '11/17 16:02', for: ['modeler', 'da'] },
    { id: 'n3', k: 'cand', t: "후보 '수령자'가 단어 신청으로 전환됐습니다", m: 'REQ-2026-0012 · 내가 등록한 후보 2건', href: 'approvals.html?doc=REQ-2026-0012', at: '11/17 11:05', for: ['modeler'] },
    { id: 'n4', k: 'cc', t: '참조: REQ-2026-0009 단어 3건 등록', m: '박설계 신청 · DA 승인 대기', href: 'approvals.html?box=cc&doc=REQ-2026-0009', at: '11/16 09:12', for: ['modeler', 'da'] },
    { id: 'n5', k: 'appr', t: "REQ-2026-0010 도메인 '코드C2' — 최종 승인 차례", m: '이데이터 신청 · DA 승인 완료', href: 'approvals.html?doc=REQ-2026-0010', at: '11/16 17:40', for: ['owner'] },
    { id: 'n6', k: 'sys', t: `DBModeler ${PRODUCT.version} 새 기능`, m: '산출물 화면 · 표 보기 · 모델 검토 — 릴리스 노트', href: '#about', at: '11/17 09:00', for: ['modeler', 'da', 'owner', 'admin'] }
  ];
  const readSet = new Set((store.get('dbm-read-' + ME.id, '') || '').split(',').filter(Boolean));
  const myNotifs = () => NOTIFS0.filter(n => n.for.some(r => ME.has(r)));
  const unread = () => myNotifs().filter(n => !readSet.has(n.id)).length;
  const markRead = ids => { ids.forEach(i => readSet.add(i)); store.set('dbm-read-' + ME.id, [...readSet].join(',')); };

  const ICON = {
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    db: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    log: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  window.ICON = ICON;

  function navLink(href, label, key, extra) {
    const page = document.body.dataset.page;
    const on = key && page === key ? ' on' : '';
    return `<a class="${extra || ''}${on}" href="${href}">${label}</a>`;
  }
  const queueCount = () => myQueue(getDocs()).length;

  function buildShell() {
    const app = document.getElementById('app');
    const content = document.getElementById('content');
    if (!app || !content) return;
    const top = document.createElement('header');
    top.className = 'topbar';
    const nUnread = unread();
    top.innerHTML = `
      <a class="brand" href="home.html" title="홈"><span class="brand-mark">DB</span>DBModeler <span class="org">· 한국데이터진흥원</span></a>
      <div class="gsearch">${ICON.search}<span>사전·모델·결재 검색</span><kbd>Ctrl K</kbd></div>
      <div class="spacer"></div>
      <div class="mock-tools" title="목업 검토용 도구 — 실제 제품에는 없음">목업
        <select id="mk-role" aria-label="역할 보기 전환">${Object.values(USERS).map(u => `<option value="${u.id}" ${u.id === ME.id ? 'selected' : ''}>${u.name} · ${u.roles.map(r => ROLE_NAME[r]).join('·')}</option>`).join('')}</select>
        <span class="seg" id="seg-frame"><button data-v="1920">1920</button><button data-v="1600">1600</button></span>
        <span class="seg" id="seg-theme"><button data-v="light">라이트</button><button data-v="dark">다크</button></span>
        <button class="reset" id="mk-reset" title="목업 데이터 초기화(결재 진행 상태·알림 읽음)">↺</button>
      </div>
      <button class="iconbtn" id="btn-bell" aria-label="알림 ${nUnread}건" aria-haspopup="true" aria-expanded="false">${ICON.bell}${nUnread ? `<span class="dot">${nUnread}</span>` : ''}</button>
      <button class="avatar btnlike" id="btn-user" aria-label="사용자 메뉴 · ${ME.name}" aria-haspopup="true" aria-expanded="false">${ME.name[0]}${store.get('dbm-seen-ver', '') !== PRODUCT.version ? '<span class="newdot" title="새 기능"></span>' : ''}</button>
      <div class="pop-menu npanel" id="pn-notif" role="dialog" aria-label="알림"></div>
      <div class="pop-menu umenu" id="pn-user" role="menu" aria-label="사용자 메뉴"></div>`;
    const nav = document.createElement('nav');
    nav.className = 'nav';
    const qn = queueCount();
    nav.innerHTML = `
      <div class="nav-group">${navLink('home.html', ICON.home + '홈', 'home')}</div>
      <div class="nav-group">
        <div class="nav-title">사전</div>
        ${navLink('dictionary.html', ICON.book + '통합 검색', 'dictionary')}
        ${navLink('excel-import.html', '<span style="width:16px"></span>엑셀 가져오기', 'excel', '')}
        ${navLink('candidates.html', '<span style="width:16px"></span>후보 큐<span class="count">3</span>', 'candidates', '')}
      </div>
      <div class="nav-group">
        <div class="nav-title">결재</div>
        ${navLink('approvals.html', ICON.check + '결재함' + (qn ? `<span class="count">${qn}</span>` : ''), 'approvals')}
      </div>
      <div class="nav-group">
        <div class="nav-title">시스템</div>
        ${navLink('system.html', ICON.db + '요구사항관리<span class="tag">Oracle</span>', 'system')}
        ${navLink('model.html', '요구사항 · 프로젝트', 'model', 'sub2')}
        ${navLink('model.html?area=risk&state=review', '리스크', '', 'sub2')}
        ${navLink('error.html?code=404&what=인사시스템', ICON.db + '인사시스템<span class="tag">Tibero</span>', '')}
        ${navLink('error.html?code=404&what=회계시스템', ICON.db + '회계시스템<span class="tag">PostgreSQL</span>', '')}
      </div>
      <div class="nav-group">
        <div class="nav-title">관리</div>
        ${ME.has('admin') ? navLink('settings.html', ICON.gear + '설정', 'settings') : ''}
        ${ME.has('da') || ME.has('admin') ? navLink('audit.html', ICON.log + '감사 로그', 'audit') : ''}
        ${!ME.has('admin') && !ME.has('da') ? '<div class="caption faint" style="padding:4px 8px">관리 메뉴는 DA·Admin만</div>' : ''}
      </div>
      <button class="nav-ver" id="nav-ver" title="제품 정보">${PRODUCT.name} ${PRODUCT.version} · build ${PRODUCT.build}</button>`;
    app.insertBefore(nav, content);
    app.insertBefore(top, nav);
    const toasts = document.createElement('div');
    toasts.className = 'toasts'; toasts.id = 'toasts';
    toasts.setAttribute('role', 'status'); toasts.setAttribute('aria-live', 'polite');
    app.appendChild(toasts);
    const ov = document.createElement('div');
    ov.innerHTML = `
      <div class="overlay" id="mo-about" role="dialog" aria-modal="true" aria-labelledby="about-t"><div class="modal" style="width:520px">
        <div class="m-head"><div class="flex"><span class="brand-mark" style="width:28px;height:28px;font-size:13px">DB</span><h3 id="about-t">제품 정보</h3><span class="grow"></span><button class="iconbtn" data-close="mo-about" aria-label="닫기" style="width:28px;height:28px">${ICON.x}</button></div></div>
        <div class="m-body">
          <dl class="kv"><dt>제품</dt><dd><b>${PRODUCT.name}</b> — 웹 데이터 모델러 · 데이터 표준 사전</dd><dt>버전</dt><dd class="mono">${PRODUCT.version}</dd><dt>빌드</dt><dd class="mono">${PRODUCT.build} · ${PRODUCT.released}</dd><dt>배포 환경</dt><dd>${PRODUCT.env} <span class="badge b-success">최신 버전</span></dd><dt>사전 기준</dt><dd>${PRODUCT.dict}</dd><dt>기관</dt><dd>한국데이터진흥원</dd></dl>
          <div class="section-t">릴리스 노트 · ${PRODUCT.version}</div>
          <ul class="caption" style="margin:0;padding-left:18px;line-height:22px"><li>산출물 화면: 테이블 정의서·준수검사·개인정보 컬럼 목록</li><li>모델: 표 보기(일괄편집·찾기/바꾸기), 모델 검토, 제약·인덱스, 서브타입·배타 관계</li><li>실시간 공동 편집, 내 편집만 되돌리기</li><li>알려진 제한: DBMS 비교(운영 DB 접속)는 다음 버전</li></ul>
          <div class="section-t">오픈소스 라이선스</div>
          <div class="caption" style="line-height:20px">React Flow (MIT) · Yjs (MIT) · elkjs (EPL-2.0) · Pretendard (OFL-1.1) · Geist Mono (OFL-1.1) <a href="#" data-toast="라이선스 전문을 엽니다(목업)" data-toast-type="info">전문 보기</a></div>
          <div class="section-t">지원</div>
          <div class="caption">데이터정책팀 · 내선 1234 · dbmodeler@kda.go.kr</div>
        </div>
        <div class="m-foot"><button class="btn" data-toast="버전 정보를 복사했습니다" data-toast-type="info">버전 정보 복사</button><button class="btn primary" data-close="mo-about">닫기</button></div></div></div>
      <div class="overlay" id="mo-keys" role="dialog" aria-modal="true" aria-labelledby="keys-t"><div class="modal" style="width:560px">
        <div class="m-head"><div class="flex"><h3 id="keys-t">단축키</h3><span class="grow"></span><button class="iconbtn" data-close="mo-keys" aria-label="닫기" style="width:28px;height:28px">${ICON.x}</button></div></div>
        <div class="m-body" style="max-height:60vh;overflow:auto">
          <table class="tbl sc-table"><tbody>
            <tr><td colspan="2"><b>공통</b></td></tr>
            <tr><td><kbd>?</kbd></td><td>단축키 도움말</td></tr><tr><td><kbd>Ctrl</kbd><kbd>K</kbd></td><td>검색·명령 (다음 버전)</td></tr><tr><td><kbd>Esc</kbd></td><td>닫기 · 취소</td></tr>
            <tr><td colspan="2"><b>모델 캔버스</b> <span class="caption muted">캔버스에 포커스가 있을 때만</span></td></tr>
            <tr><td><kbd>V</kbd> <kbd>E</kbd> <kbd>R</kbd> <kbd>M</kbd></td><td>선택 · 엔터티 · 관계 · 메모 도구</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>선택한 엔터티에 속성 추가</td></tr><tr><td><kbd>Delete</kbd></td><td>선택 삭제 (영향 확인)</td></tr>
            <tr><td><kbd>Ctrl</kbd><kbd>Z</kbd> / <kbd>Ctrl</kbd><kbd>Y</kbd></td><td>내 편집 되돌리기 / 다시 실행</td></tr>
            <tr><td><kbd>Ctrl</kbd><kbd>F</kbd></td><td>표 보기 · 찾기/바꾸기</td></tr><tr><td><kbd>Shift</kbd><kbd>1</kbd></td><td>전체 맞춤</td></tr><tr><td><kbd>Ctrl</kbd>+휠</td><td>확대·축소</td></tr>
          </tbody></table>
          <label class="flex caption" style="margin-top:12px"><input type="checkbox" id="kb-single" ${store.get('dbm-single-keys', '1') === '1' ? 'checked' : ''}> 한 글자 단축키(V·E·R·M) 사용 — 끄면 화면 낭독기·음성 입력과 충돌하지 않습니다</label>
        </div>
        <div class="m-foot"><button class="btn primary" data-close="mo-keys">닫기</button></div></div></div>`;
    while (ov.firstElementChild) app.appendChild(ov.firstElementChild);

    // frame/theme/role tools — keep other query params (CL2-07)
    const sf = top.querySelector('#seg-frame'), st = top.querySelector('#seg-theme');
    sf.querySelector(`[data-v="${frame}"]`).classList.add('on');
    const tsel = st.querySelector(`[data-v="${themePref === 'dark' ? 'dark' : 'light'}"]`); if (tsel) tsel.classList.add('on');
    sf.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-frame', v); const p = new URLSearchParams(location.search); p.set('w', v); location.search = p.toString(); });
    st.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-theme', v); applyTheme(v); st.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); });
    top.querySelector('#mk-role').addEventListener('change', e => { store.set('dbm-role', e.target.value); const p = new URLSearchParams(location.search); p.delete('as'); location.search = p.toString(); location.reload(); });
    top.querySelector('#mk-reset').addEventListener('click', () => { ['dbm-docs', 'dbm-seen-ver'].forEach(k => store.del(k)); Object.keys(USERS).forEach(u => store.del('dbm-read-' + u)); flash('목업 데이터를 초기화했습니다', 'info'); location.reload(); });

    // notifications
    const pn = top.querySelector('#pn-notif'), pu = top.querySelector('#pn-user');
    let nf = 'all';
    const drawNotif = () => {
      const list = myNotifs().filter(n => nf === 'all' || n.k === nf);
      pn.innerHTML = `<div class="nh"><b>알림</b><span class="badge">${unread()} 안 읽음</span><span class="grow"></span><button class="btn ghost sm" id="n-allread">모두 읽음</button></div>
        <div class="nf">${[['all', '전체'], ['appr', '결재'], ['cand', '후보'], ['job', '작업'], ['cc', '참조'], ['sys', '공지']].map(([k, l]) => `<button class="chip ${nf === k ? 'on' : ''}" data-nf="${k}" style="height:24px;font-size:12px">${l}</button>`).join('')}</div>
        <div class="nlist">${list.length ? list.map(n => `<a class="ni ${readSet.has(n.id) ? '' : 'unread'}" href="${n.href}" data-nid="${n.id}"><span class="ud" aria-hidden="true"></span><span><div class="t">${n.t}</div><div class="m">${n.m} · ${n.at}</div></span></a>`).join('') : '<div class="caption muted" style="padding:24px;text-align:center">이 종류의 알림이 없습니다</div>'}</div>
        <div class="nfoot"><span class="caption muted">30일 보관 · 메일 알림은 결재선 담당자만</span><a href="mypage.html#notify">알림 설정</a></div>`;
    };
    const closePops = () => { [pn, pu].forEach(p => p.classList.remove('open')); top.querySelectorAll('[aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false')); };
    top.querySelector('#btn-bell').addEventListener('click', e => { e.stopPropagation(); const o = !pn.classList.contains('open'); closePops(); if (o) { drawNotif(); pn.classList.add('open'); e.currentTarget.setAttribute('aria-expanded', 'true'); } });
    pn.addEventListener('click', e => {
      e.stopPropagation();
      const c = e.target.closest('[data-nf]'); if (c) { nf = c.dataset.nf; drawNotif(); return; }
      if (e.target.id === 'n-allread') { markRead(myNotifs().map(n => n.id)); drawNotif(); const d = top.querySelector('#btn-bell .dot'); if (d) d.remove(); return; }
      const a = e.target.closest('[data-nid]'); if (a) { markRead([a.dataset.nid]); if (a.getAttribute('href') === '#about') { e.preventDefault(); closePops(); openAbout(); } }
    });
    // user menu (PN-50)
    const drawUser = () => {
      pu.innerHTML = `<div class="who"><b>${ME.name}</b><div class="caption muted">${ME.org} · ${ME.mail}</div><div class="role-tag" style="margin-top:6px">${roleBadges(ME)}</div></div>
        <a class="mi" role="menuitem" href="mypage.html">마이페이지</a>
        <a class="mi" role="menuitem" href="mypage.html#mine">내 신청 <span class="caption muted" style="margin-left:auto">${getDocs().filter(d => d.req === ME.id && !['done', 'withdrawn'].includes(d.step)).length}건 진행 중</span></a>
        <a class="mi" role="menuitem" href="mypage.html#notify">알림 설정</a>
        <div class="sep"></div>
        <div class="mi" style="cursor:default">테마<span class="seg" id="um-theme" style="margin-left:auto">${['light:라이트', 'dark:다크', 'system:시스템'].map(x => { const [k, l] = x.split(':'); return `<button data-v="${k}" class="${(store.get('dbm-theme', 'light')) === k ? 'on' : ''}">${l}</button>`; }).join('')}</span></div>
        <button class="mi" role="menuitem" id="um-keys">단축키<kbd>?</kbd></button>
        <button class="mi" role="menuitem" data-toast="도움말 문서를 새 탭으로 엽니다(목업)" data-toast-type="info">도움말</button>
        <button class="mi" role="menuitem" id="um-about">제품 정보 ${store.get('dbm-seen-ver', '') !== PRODUCT.version ? '<span class="badge b-info" style="margin-left:auto">새 기능</span>' : ''}</button>
        <div class="ver">${PRODUCT.name} ${PRODUCT.version} · build ${PRODUCT.build}</div>
        <div class="sep"></div>
        <a class="mi" role="menuitem" href="error.html?code=logout">로그아웃</a>`;
    };
    top.querySelector('#btn-user').addEventListener('click', e => { e.stopPropagation(); const o = !pu.classList.contains('open'); closePops(); if (o) { drawUser(); pu.classList.add('open'); e.currentTarget.setAttribute('aria-expanded', 'true'); const f = pu.querySelector('.mi'); if (f) f.focus(); } });
    pu.addEventListener('click', e => {
      e.stopPropagation();
      const tb = e.target.closest('#um-theme button'); if (tb) { store.set('dbm-theme', tb.dataset.v); applyTheme(tb.dataset.v); drawUser(); return; }
      if (e.target.closest('#um-keys')) { closePops(); openKeys(); return; }
      if (e.target.closest('#um-about')) { closePops(); openAbout(); return; }
    });
    document.addEventListener('click', closePops);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePops(); });
    nav.querySelector('#nav-ver').addEventListener('click', openAbout);
  }
  function openAbout() { document.getElementById('mo-about').classList.add('open'); store.set('dbm-seen-ver', PRODUCT.version); const d = document.querySelector('#btn-user .newdot'); if (d) d.remove(); }
  function openKeys() { document.getElementById('mo-keys').classList.add('open'); }
  window.openAbout = openAbout; window.openKeys = openKeys;

  /* ---- toast (aria-live, error stays until closed, optional action) ---- */
  window.toast = function (msg, type, action) {
    const box = document.getElementById('toasts'); if (!box) return;
    const colors = { success: 'var(--success)', info: 'var(--info)', danger: 'var(--danger)', violet: 'var(--violet)' };
    const marks = { success: '✓', info: 'i', danger: '!', violet: '◆' };
    const t = document.createElement('div');
    t.className = 'toast'; if (type === 'danger') t.setAttribute('role', 'alert');
    t.innerHTML = `<span class="ic" style="background:${colors[type || 'success']}" aria-hidden="true">${marks[type || 'success']}</span><div class="tx">${msg}</div>${action ? `<button class="act">${action.label}</button>` : ''}${type === 'danger' || action ? '<button class="tclose" aria-label="닫기">×</button>' : ''}`;
    box.appendChild(t);
    if (action) t.querySelector('.act').onclick = () => { t.remove(); action.fn(); };
    const c = t.querySelector('.tclose'); if (c) c.onclick = () => t.remove();
    if (type !== 'danger') setTimeout(() => t.remove(), action ? 8000 : 4000);
  };
  window.flash = (msg, type) => { try { sessionStorage.setItem('dbm-flash', JSON.stringify([msg, type])); } catch (e) {} };

  /* ---- required reasons: <button data-needs="textareaId"> stays disabled while empty ---- */
  function updateNeeds() {
    document.querySelectorAll('[data-needs]').forEach(b => {
      const t = document.getElementById(b.dataset.needs); if (!t) return;
      const ok = t.value.trim().length > 0;
      b.disabled = !ok;
      let m = b.parentElement.querySelector(`.needs-msg[data-for="${b.dataset.needs}"]`);
      if (!ok && !m) { m = document.createElement('span'); m.className = 'needs-msg'; m.dataset.for = b.dataset.needs; m.textContent = b.dataset.needsMsg || '사유를 입력해야 합니다'; b.parentElement.insertBefore(m, b.parentElement.firstChild); }
      if (ok && m) m.remove();
      t.setAttribute('aria-invalid', ok ? 'false' : 'true');
    });
  }
  window.updateNeeds = updateNeeds;

  function wire() {
    document.addEventListener('click', e => {
      const op = e.target.closest('[data-open]');
      if (op && !op.disabled) {
        e.preventDefault();
        op.dataset.open.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) { el.classList.add('open'); const f = el.querySelector('textarea, input, select, button'); if (el.classList.contains('overlay') && f) setTimeout(() => f.focus(), 0); } });
        if (op.dataset.closeOthers) op.dataset.closeOthers.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.remove('open'); });
      }
      const cl = e.target.closest('[data-close]');
      if (cl && !cl.disabled) { e.preventDefault(); cl.dataset.close.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.remove('open'); }); }
      const tg = e.target.closest('[data-toggle]');
      if (tg) { e.preventDefault(); const el = document.getElementById(tg.dataset.toggle); if (el) el.classList.toggle('closed'); }
      const tb = e.target.closest('.tabs button[data-tab]');
      if (tb) {
        const scope = tb.closest('[data-tabscope]') || document;
        scope.querySelectorAll('.tabs button[data-tab]').forEach(b => b.classList.toggle('on', b === tb));
        scope.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === tb.dataset.tab));
      }
      const row = e.target.closest('tr.click');
      if (row && row.isConnected && row.parentElement) {
        row.parentElement.querySelectorAll('tr.sel').forEach(r => r.classList.remove('sel'));
        row.classList.add('sel');
        if (row.dataset.panel) {
          const p = document.getElementById(row.dataset.panel);
          if (p) { const body = p.parentElement; if (body) body.querySelectorAll(':scope > .rpanel.open').forEach(o => { if (o !== p) o.classList.remove('open'); }); p.classList.add('open'); }
        }
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
      if (ts && !ts.disabled) window.toast(ts.dataset.toast, ts.dataset.toastType);
      const cand = e.target.closest('.cand');
      if (cand) { cand.parentElement.querySelectorAll('.cand').forEach(c => c.classList.toggle('on', c === cand)); }
      setTimeout(updateNeeds, 0);
    });
    document.addEventListener('input', updateNeeds);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { const o = document.querySelector('.overlay.open'); if (o) o.classList.remove('open'); }
      if (e.key === '?' && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]'))) { e.preventDefault(); openKeys(); }
    });
    document.addEventListener('change', e => { if (e.target.id === 'kb-single') store.set('dbm-single-keys', e.target.checked ? '1' : '0'); });
  }

  function filterRows(group, value) {
    document.querySelectorAll(`[data-filter-target="${group}"] tbody tr`).forEach(tr => {
      tr.style.display = !value || (tr.dataset.f || '').split(' ').includes(value) ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildShell(); wire();
    if (location.hash) { const b = document.querySelector(`.tabs button[data-tab="${location.hash.slice(1)}"]`); if (b) b.click(); }
    if (window.pageInit) window.pageInit();
    updateNeeds();
    try { const f = JSON.parse(sessionStorage.getItem('dbm-flash') || 'null'); if (f) { sessionStorage.removeItem('dbm-flash'); setTimeout(() => toast(f[0], f[1]), 100); } } catch (e) {}
  });
})();
