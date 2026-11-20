/* NeoDB mockup shell & interactions (static, no backend) — v4 */
(function () {
  window.__errs = []; window.addEventListener('error', e => window.__errs.push(e.message));   // mockup self-check (review scripts read this)
  // 행정표준코드 seed (generated from the 공통표준 2025.11 workbook) — loaded synchronously while the page is parsed
  if (!window.STD_CODES && document.readyState === 'loading') { const me = document.currentScript; document.write(`<script src="${me ? me.src.replace(/app\.js(\?.*)?$/, 'std-codes.js') : 'assets/std-codes.js'}"><\/script>`); }
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  window.dbmStore = store;
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  // frame: 'fit' (default — the product fills the window, min 1600px, narrower → horizontal scroll) · '1920' / '1600' fixed preview frames
  if (!store.get('dbm-frame-v2', '')) { store.set('dbm-frame', 'fit'); store.set('dbm-frame-v2', '1'); }   // one-time move to the product default
  const frame = qs.get('w') || store.get('dbm-frame', 'fit');
  const themePref = qs.get('theme') || store.get('dbm-theme', 'light');
  const applyTheme = t => root.setAttribute('data-theme', t === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t);
  if (frame === '1600') root.classList.add('frame-1600');
  if (frame === 'fit') root.classList.add('frame-fit');
  applyTheme(themePref);

  /* ---- product / users / roles ---- */
  const PRODUCT = { name: 'NeoDB', version: '1.0.0', build: '20261117.a1b2c3', env: '운영', released: '2026-11-17', dict: '공통표준 2025.11 (적재 11/03) · 기관 사전 제정 12차' };
  window.PRODUCT = PRODUCT;
  const USERS = {
    kim: { id: 'kim', name: '김모델', company: '한국데이터진흥원', org: '데이터정책팀', phone: '010-2345-1101', mail: 'kim@kda.go.kr', roles: ['modeler', 'da'], systems: ['요구사항관리', '통합ERP'] },
    park: { id: 'park', name: '박설계', company: '(주)한빛정보', org: '정보화사업팀', phone: '010-3456-2202', mail: 'park@hanbit.co.kr', roles: ['modeler'], systems: ['요구사항관리', '통합ERP'] },
    lee: { id: 'lee', name: '이데이터', company: '한국데이터진흥원', org: '데이터정책팀', phone: '010-4567-3303', mail: 'lee@kda.go.kr', roles: ['da', 'admin'], systems: ['전체'] },
    hyun: { id: 'hyun', name: '이현업', company: '한국데이터진흥원', org: '기획조정실', phone: '010-5678-4404', mail: 'hyun@kda.go.kr', roles: ['owner'], systems: ['전체'] },
    choi: { id: 'choi', name: '최담당', company: '한국데이터진흥원', org: '재무회계팀', phone: '010-6789-5505', mail: 'choi@kda.go.kr', roles: ['owner', 'modeler'], systems: ['통합ERP'] }
  };
  /* accounts (14): the intranet runs its own ID/PW accounts; SSO is an option. Passwords are never kept as text —
     the mock keeps a salted hash only (a real server uses a slow password hash such as bcrypt/argon2). */
  window.pwHash = (id, pw) => { let h = 2166136261; const s = String(id).toLowerCase() + ':' + pw + ':neodb-mock-salt'; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return 'm1$' + (h >>> 0).toString(16); };
  const SEED_PW = 'Neodb!2026';   // mock only — every seeded account uses it; new accounts get the password the admin types
  Object.values(USERS).forEach(u => Object.assign(u, { status: 'active', auth: 'local', pwHash: pwHash(u.id, SEED_PW), pwAt: '2026-10-01', pwTemp: false, fails: 0, created: '2026-09-01', last: '' }));
  const ROLE_NAME = { modeler: '모델러', da: 'DA', owner: '기관 담당자', admin: 'Admin' };
  window.USERS = USERS; window.ROLE_NAME = ROLE_NAME;
  // roles changed in settings (SC-42) apply to everyone — the mock "server" copy of user roles
  try { const ov = JSON.parse(store.get('dbm-user-roles', 'null')); if (ov) Object.entries(ov).forEach(([id, r]) => { if (USERS[id]) USERS[id].roles = r; }); } catch (e) {}
  // the user directory saved by the admin screen (registered · edited · stopped · deleted accounts) is the source once it exists
  try { const db = JSON.parse(store.get('dbm-users', 'null')); if (db) { Object.keys(USERS).forEach(k => { if (!db[k]) delete USERS[k]; }); Object.entries(db).forEach(([k, u]) => { USERS[k] = Object.assign(USERS[k] || {}, u); }); } } catch (e) {}
  window.saveUsers = () => { store.set('dbm-users', JSON.stringify(USERS)); };
  const AUTH0 = { mode: 'local', ssoProto: 'SAML 2.0', ssoUrl: '', ssoAuto: false, pwMin: 9, pwDays: 90, lockFails: 5, lockMin: 10, idle: 30 };
  window.getAuth = () => { try { return Object.assign({}, AUTH0, JSON.parse(store.get('dbm-auth', '{}'))); } catch (e) { return Object.assign({}, AUTH0); } };
  window.saveAuth = a => store.set('dbm-auth', JSON.stringify(a));
  window.AUTH_MODE = { local: 'ID · 비밀번호', both: 'ID · 비밀번호 + SSO(선택)', sso: 'SSO만 (관리자 비상 로그인 허용)' };
  // password rules — one function for registration, reset and self-change
  window.pwProblems = (id, pw, name) => { const a = getAuth(), p = []; if ((pw || '').length < a.pwMin) p.push(`${a.pwMin}자 이상`); if (!/[A-Za-z]/.test(pw)) p.push('영문 포함'); if (!/[0-9]/.test(pw)) p.push('숫자 포함'); if (!/[!-\/:-@\[-`{-~]/.test(pw || '')) p.push('특수문자(!@#$ 등) 포함'); if (/\s/.test(pw || '')) p.push('공백 불가'); if (id && pw && pw.toLowerCase().includes(String(id).toLowerCase())) p.push('ID를 포함하면 안 됨'); if (/(.)\1\1/.test(pw || '')) p.push('같은 문자 3번 연속 금지'); return p; };
  window.tempPassword = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', a = 'abcdefghijkmnpqrstuvwxyz', d = '23456789', s = '!@#$%*?'; const rnd = n => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] % n; }; const pick = x => x[rnd(x.length)]; let out = pick(A) + pick(a) + pick(d) + pick(s); while (out.length < 12) out += pick(A + a + d + s); const c = out.split(''); for (let i = c.length - 1; i > 0; i--) { const j = rnd(i + 1); [c[i], c[j]] = [c[j], c[i]]; } return c.join(''); };
  // deleted IDs stay reserved forever — notifications, read marks, audit subjects keyed by ID must never pass to a new person
  window.reservedIds = () => { try { return JSON.parse(store.get('dbm-users-deleted', '[]')); } catch (e) { return []; } };
  window.reserveId = id => { const r = reservedIds(); if (!r.includes(id)) { r.push(id); store.set('dbm-users-deleted', JSON.stringify(r)); } };
  window.revokeSessions = u => { u.sessRev = Date.now(); };   // the mock "server" marks old sessions invalid
  window.USER_STATUS = { active: '사용', stopped: '사용 중지', locked: '잠김' };
  // ?as=role from a scenario/shortcut link becomes the selected demo user (kept while moving between screens — CL12-01)
  const AUDIT_RUN = qs.has('audit');   // the publishing audit's own frames: the role in the address is used, never saved
  if (!AUDIT_RUN && qs.get('as') && USERS[qs.get('as')] && store.get('dbm-role', 'kim') !== qs.get('as')) store.set('dbm-role', qs.get('as'));
  const meId = AUDIT_RUN && USERS[qs.get('as')] ? qs.get('as') : store.get('dbm-role', 'kim');
  const ME = Object.assign({}, USERS[meId] || USERS.kim || Object.values(USERS)[0], { has(r) { return (this.roles || []).includes(r); } });
  window.ME = ME;
  { const pg = (document.body && document.body.dataset.page) || location.pathname; const signedOut = /login|error/.test(pg) || /login\.html|error\.html/.test(location.pathname); const sessAt = +store.get('dbm-sess-at', '0'); const me0 = USERS[meId];
    if (!signedOut && me0 && (me0.status === 'stopped' || (me0.sessRev && sessAt && me0.sessRev > sessAt))) { location.replace('login.html?revoked=1'); } }
  /* RBAC (15): role × permission × scope. scope 'sys' = only the systems the user is in charge of (담당 시스템, '전체' = all),
     'org' = the whole agency (기관 사전 · 설정), 'own' = what the user made. Viewers (no role) only read. */
  const PERMS = [
    { id: 'model.view', g: '모델', n: '모델 · DDL · 산출물 보기', roles: ['*'], scope: 'org', note: '모든 시스템을 읽을 수 있다 (표준 준수 확인용)' },
    { id: 'model.edit', g: '모델', n: '모델 편집 · 표준 맞추기 · DDL 가져오기', roles: ['modeler'], scope: 'sys' },
    { id: 'area.create', g: '모델', n: '업무 영역 만들기', roles: ['modeler', 'admin'], scope: 'sys', adminAll: true },
    { id: 'model.submit', g: '모델', n: '모델 확정 신청 · 회수', roles: ['modeler'], scope: 'sys' },
    { id: 'dict.view', g: '사전', n: '표준 사전 · 변경 내역 보기', roles: ['*'], scope: 'org' },
    { id: 'dict.request', g: '사전', n: '사전 신청 · 엑셀 가져오기 · 후보 등록', roles: ['modeler', 'da'], scope: 'org' },
    { id: 'cand.decide', g: '사전', n: '후보 큐 판단', roles: ['da'], scope: 'org' },
    { id: 'dict.publish', g: '사전', n: '사전 공표', roles: ['da'], scope: 'org' },
    { id: 'dict.purge', g: '사전', n: '삭제 보관 항목 영구 삭제', roles: ['da', 'admin'], scope: 'org' },
    { id: 'dict.group', g: '사전', n: '도메인그룹 직접 관리', roles: ['da', 'admin'], scope: 'org', note: '결재 없이 기록 · 감사 로그. 분류는 품의' },
    { id: 'dict.common', g: '사전', n: '공통표준 새 판 올리기(품의 작성)', roles: ['da', 'admin'], scope: 'org', note: '반영은 일반 품의(DA → 최종 승인)' },
    { id: 'excel.viewall', g: '사전', n: '다른 사람의 엑셀 업로드 묶음 보기', roles: ['da'], scope: 'org', note: '나머지는 자기 묶음만' },
    { id: 'appr.da', g: '결재', n: '1단계(DA) 승인 · 반려', roles: ['da'], scope: 'sys', note: '사전 신청은 기관 전체, 모델 확정은 담당 시스템만' },
    { id: 'appr.final', g: '결재', n: '최종 승인 · 반려', roles: ['owner'], scope: 'sys', note: '사전 신청은 기관 전체, 모델 확정은 담당 시스템만 · 신청자와 1단계 승인자는 최종 승인할 수 없다' },
    { id: 'appr.viewall', g: '결재', n: '모든 결재 문서 보기', roles: ['da', 'owner'], scope: 'org', note: '나머지 사용자는 자기 신청 · 참조 문서만' },
    { id: 'audit.view', g: '관리', n: '감사 로그 보기', roles: ['da', 'admin'], scope: 'org' },
    { id: 'settings', g: '관리', n: '기관 · 시스템 · 검수 기준 설정', roles: ['admin'], scope: 'org' },
    { id: 'users', g: '관리', n: '사용자 · 역할 · 인증 관리', roles: ['admin'], scope: 'org', note: '자기 역할 · 상태는 바꿀 수 없다' }
  ];
  window.PERMS = PERMS;
  window.sysOfArea = area => { const m = getAllModels()[area]; if (!m) return null; const s = SYSLIST.find(x => x.code === (m.system || 'RQMS')); return s ? s.name : (m.sys || null); };
  // Korean particle after a word (받침 → 은/이, 없으면 는/가)
  window.josa = (w, pair) => { const c = String(w).charCodeAt(String(w).length - 1); const has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; const [a, b] = pair.split('/'); return w + (has ? a : b); };
  window.inScope = (u, sysName) => { const s = u.systems || []; return s.includes('전체') || s.includes(sysName); };
  // can(user, permission, { system | area | doc }) — the only question every screen asks
  window.canUser = (u, pid, ctx) => {
    const p = PERMS.find(x => x.id === pid); if (!p || !u || u.status === 'stopped') return false;
    const roles = u.roles || [];
    const roleOk = p.roles.includes('*') || p.roles.some(r => roles.includes(r)) || (p.extra || []).some(r => roles.includes(r));
    if (!roleOk) return false;
    if (p.scope !== 'sys' || !ctx) return true;
    if (p.adminAll && roles.includes('admin')) return true;
    const d = ctx.doc; if (d && d.type === 'dict') return true;   // dictionary requests are agency-wide
    const sysName = ctx.system || (ctx.area ? sysOfArea(ctx.area) : d ? (d.sys || sysOfArea(d.area)) : null);
    return !!sysName && inScope(u, sysName);
  };
  window.can = (pid, ctx) => canUser(USERS[ME.id] || ME, pid, ctx);
  // whose turn: the document's step, the role for that step, and (model documents) the system in charge
  const daApprover = d => { const h = (d.hist || []).filter(x => x.step === 'da' && /승인/.test(x.act || '') && !/취소|실패/.test(x.act || '')).slice(-1)[0]; return h ? (h.whoId || (Object.values(USERS).find(u => u.name === h.who) || {}).id) : null; };
  window.canUserAct = (u, d, step) => { if (!u || !d) return false; if (step === 'da') return canUser(u, 'appr.da', { doc: d }); if (step === 'final') return canUser(u, 'appr.final', { doc: d }) && d.req !== u.id && daApprover(d) !== u.id; return false; };
  window.canActOn = d => !!d && ['da', 'final'].includes(d.step) && canUserAct(USERS[ME.id] || ME, d, d.step);
  // who can take a step (active accounts only) — also the notification list
  window.approversFor = (d, step) => Object.values(USERS).filter(u => u.status !== 'stopped' && canUserAct(u, d, step));
  // steps of the line nobody could take (checked before submitting and after account changes)
  window.lineGaps = d => (d.line || lineFor(d.type, d.area)).filter(s => !approversFor(Object.assign({ hist: [] }, d), s).filter(u => s !== 'final' || u.id !== d.req).length);
  window.roleBadges = u => u.roles.map(r => `<span class="badge">${ROLE_NAME[r]}</span>`).join(' ');

  /* ================= v5 shared state layer =================
     One source of truth for documents, model versions/locks, upload batches,
     dictionary changes and notifications. Screens only read/write through these. */
  const J = (k, d) => { try { const v = JSON.parse(store.get(k, 'null')); return v == null ? d : v; } catch (e) { return d; } };
  const S = (k, v) => store.set(k, JSON.stringify(v));
  const clone = o => JSON.parse(JSON.stringify(o));
  const now = () => { const t = new Date(); return `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`; };
  window.nowStr = now;

  /* ---- approval documents: new ID per request, history is append-only ---- */
  const DOCS0 = [
    // seed sample: the 120-row upload keeps only 3 representative rows (sample: true) — the UI says so instead of pretending 120 were applied
    { id: 'REQ-2026-0016', type: 'dict', title: '엑셀 일괄 — 용어 120건 (요구사항_용어_1차.xlsx)', req: 'kim', step: 'da', n: 120, sample: true, date: '11/16 09:20', cc: [], reason: '요구사항관리 용어 1차 적재(엑셀 가져오기)', kind: 'excel', batch: 'UP-2026-0007', key: 'batch:UP-2026-0007:0', hist: [], sub: { new: 112, chg: 4, pick: 4, conflict: 0, unuse: 0, hold: 0, ex: 8 }, items: [{ k: 'term', name: '요구사항우선순위', abbr: 'DEMND_MATER_PRIOR', dom: '순위N3', act: '추가', row: 2 }, { k: 'term', name: '요구사항완료일자', abbr: 'DEMND_MATER_CMPTN_YMD', dom: '연월일C8', act: '추가', row: 3 }, { k: 'term', id: 'T-0411', name: '산출물명', act: '변경', chg: { 설명: ['산출물의 이름', '산출물의 공식 명칭'] }, row: 4 }] },
    { id: 'REQ-2026-0014', type: 'dict', title: '산출물제출일자 외 1건 등록', req: 'kim', step: 'da', n: 2, date: '11/17 15:02', cc: ['hyun'], reason: '요구사항관리 산출물 제출 관리 기능 추가', hist: [], items: [{ k: 'term', name: '산출물제출일자', abbr: 'DLVRBL_SBMT_DATE', dom: '연월일C8', desc: '산출물을 발주처에 제출한 날짜', from: '구성 단어: 산출물 · 제출 · 일자' }, { k: 'word', name: '검수', abbr: 'INSPCT', eng: 'inspection', why: '약어 중복 허용 — INSPCT가 ‘검사(INSP)’와 비슷하지만 업무상 ‘검수’를 구분해야 함' }] },
    { id: 'REQ-2026-0013', type: 'dict', title: "엔터티 용어 '산출물기본' 등록", req: 'kim', step: 'da', n: 1, date: '11/17 14:20', cc: [], reason: '산출물 관리 엔터티 추가', hist: [], items: [{ id: 'T-0430', name: '산출물기본', act: '추가' }] },
    { id: 'REQ-2026-0012', type: 'dict', title: "단어 '수령자' 등록 (후보 전환)", req: 'lee', step: 'da', n: 1, date: '11/17 11:05', cc: ['kim'], reason: '후보 큐 4건 발생 — 수령자 RCPNT', key: 'cand:수령자', hist: [], items: [{ k: 'word', name: '수령자', abbr: 'RCPNT', eng: 'recipient', act: '추가', from: '후보 · 발생 위치 4곳' }] },
    { id: 'REQ-2026-0011', type: 'model', area: 'risk', ver: 2, title: '요구사항관리 › 리스크 v2 확정', req: 'park', step: 'da', n: 2, date: '11/16 18:02', cc: ['hyun'], reason: '리스크 등급 코드 추가', hist: [] },
    { id: 'REQ-2026-0010', type: 'dict', title: "도메인 '코드C2' 규격 변경", req: 'lee', step: 'final', n: 1, date: '11/16 17:05', cc: [], reason: '2자리 코드 허용 문자 확대', hist: [{ at: '11/16 17:40', who: '김모델', act: 'DA 승인', why: '', step: 'da' }], items: [{ id: 'D-0031', name: '코드C2', act: '변경', chg: { '허용 값': ['[A-Z]{2}', '[A-Z0-9]{2}'] } }] },
    { id: 'REQ-2026-0009', type: 'dict', title: '단어 3건 등록', req: 'park', step: 'da', n: 3, date: '11/16 09:12', cc: ['kim'], reason: '인사시스템 신규 화면', hist: [], items: [{ k: 'word', name: '교재', abbr: 'TXTBK' }, { k: 'word', name: '배부', abbr: 'DSTRB' }, { k: 'word', name: '수강', abbr: 'ATND' }] },
    { id: 'REQ-2026-0005', type: 'dict', title: '엑셀 일괄 — 단어 86건 (기관단어_초기.xlsx)', req: 'kim', step: 'done', n: 86, date: '11/14 17:45', cc: [], reason: '기관 단어 초기 적재', kind: 'excel', batch: 'UP-2026-0006', hist: [{ at: '11/14 18:00', who: '이데이터', act: 'DA 승인', step: 'da' }, { at: '11/15 09:10', who: '이현업', act: '최종 승인', step: 'final' }] },
    { id: 'REQ-2026-0003', type: 'model', area: 'rq', ver: 4, title: '요구사항관리 › 요구사항·프로젝트 v4 확정', req: 'park', step: 'done', n: 7, date: '11/03 10:00', cc: [], reason: 'v4 확정', hist: [{ at: '11/03 10:05', who: '이데이터', act: 'DA 승인', step: 'da' }, { at: '11/03 10:20', who: '최관리', act: '최종 승인', step: 'final' }] },
    // past documents referenced by dictionary history (so every history link opens a real document)
    { id: 'REQ-2026-0008', type: 'dict', title: "용어 '수주금액' 설명 변경", req: 'lee', step: 'done', n: 1, date: '11/16 14:40', cc: [], reason: '부가세 포함 명시', applied: { applied: 1, failed: [] }, hist: [{ at: '11/16 15:00', who: '김모델', act: 'DA 승인', step: 'da' }, { at: '11/16 15:10', who: '이현업', act: '최종 승인', step: 'final' }], items: [{ k: 'term', id: 'T-0201', name: '수주금액', act: '변경', chg: { 설명: ['수주한 금액', '계약 수주 금액(부가세 포함)'] } }] },
    { id: 'REQ-2026-0007', type: 'dict', title: "단어 '산출물' 외 용어 2건 등록", req: 'kim', step: 'done', n: 3, date: '11/17 11:40', cc: [], reason: '산출물 테이블 표준화', applied: { applied: 3, failed: [] }, hist: [{ at: '11/17 11:58', who: '김모델', act: 'DA 승인', step: 'da', self: true, why: '겸임 DA — 산출물 테이블 착수 일정' }, { at: '11/17 11:58', who: '시스템', act: '최종 승인 생략(기관 설정: 사전 최종 승인 끔 당시)', step: 'final' }], items: [{ k: 'word', name: '산출물', abbr: 'DLVRBL', act: '추가' }, { k: 'term', name: '산출물ID', abbr: 'DLVRBL_ID', dom: 'ID V10', act: '추가' }, { k: 'term', name: '산출물명', abbr: 'DLVRBL_NM', dom: '명V100', act: '추가' }] },
    { id: 'REQ-2026-0001', type: 'dict', title: "단어 '산출서' 미사용", req: 'lee', step: 'done', n: 1, date: '10/02 13:50', cc: [], reason: '산출물로 통합', applied: { applied: 1, failed: [] }, hist: [{ at: '10/02 14:00', who: '이데이터', act: 'DA 승인', step: 'da', self: true, why: '통합 결정 회의(10/01) 반영' }, { at: '10/02 14:20', who: '이현업', act: '최종 승인', step: 'final' }], items: [{ k: 'word', id: 'W-0099', name: '산출서', act: '미사용', why: '산출물로 통합' }] }
  ];
  window.getDocs = () => J('dbm-docs', clone(DOCS0));
  window.saveDocs = d => { S('dbm-docs', d); if (window.refreshTop) window.refreshTop(); };
  window.myQueue = (docs) => docs.filter(d => canActOn(d));
  window.STEP_NAME = { da: 'DA 승인', final: '최종 승인', done: '완료', withdrawn: '회수됨', rejected: '반려됨' };
  window.nextDocId = docs => 'REQ-2026-' + String(Math.max(...docs.map(d => +d.id.slice(-4))) + 1).padStart(4, '0');
  /* createDoc: requester = current user, fresh ID; same `key` while still in progress returns the existing doc (idempotent submit) */
  window.createDoc = o => {
    const docs = getDocs();
    if (o.key) { const ex = docs.find(d => d.key === o.key && ['da', 'final'].includes(d.step)); if (ex) return { doc: ex, dup: true }; }
    // MD-10: an item already in an open request cannot be requested again (checked at write time, not only on screen)
    if (o.items) {
      const dict = getDict(), live = id => docs.some(x => x.id === id && ['da', 'final'].includes(x.step));
      const busy = o.items.map(it => it.id && dict.find(x => x.id === it.id)).filter(d => d && d.pending && live(d.pending));
      const openNames = openItems().filter(x => opOf(x.it) === '추가');
      const nameBusy = o.items.filter(it => opOf(it) === '추가').map(it => openNames.find(x => x.it.name === it.name)).filter(Boolean);
      if (busy.length || nameBusy.length) return { doc: null, conflict: busy.map(d => `${d.name}(${d.pending})`).concat(nameBusy.map(x => `${x.it.name}(${x.doc})`)) };
    }
    // the approval line and the validation-policy version are frozen into the document when it is created
    const doc = Object.assign({ id: nextDocId(docs), req: ME.id, step: 'da', date: now(), cc: [], hist: [], n: 1, line: lineFor(o.type, o.area), policyVer: getPolicy().ver, submittedAt: today() + ' ' + now().split(' ')[1] }, o.type === 'model' ? { sys: sysOfArea(o.area) } : {}, o);
    docs.unshift(doc); saveDocs(docs);
    // items with an existing id become "pending" in the dictionary (MD-10: one open request per item)
    if (doc.items) { const dict = getDict(); doc.items.forEach(it => { const d = it.id && dict.find(x => x.id === it.id); if (d) d.pending = doc.id; }); saveDict(dict); }
    pushNotif({ to: approversFor(doc, 'da').filter(u => u.id !== ME.id).map(u => u.id), k: 'appr', t: `${doc.id} ${doc.type === 'model' ? '모델 확정' : '사전 신청'} — DA 승인 차례`, m: `${ME.name} · ${doc.title}`, href: `approvals.html?doc=${doc.id}` });
    return { doc, dup: false };
  };
  window.addHist = (doc, e) => { doc.hist = (doc.hist || []).concat([Object.assign({ at: now(), who: ME.name, whoId: ME.id }, e)]); };

  /* ---- model versions & locks: computed from documents, never from the URL ---- */
  const MODEL0 = { rq: { ver: 5, base: 4, name: '요구사항 · 프로젝트' }, risk: { ver: 2, base: 1, name: '리스크' } };
  /* systems (13): 요구사항관리 (original sample) and 통합ERP (business sample). Areas carry system; screens see the selected system's areas. */
  const SYSLIST = [{ code: 'RQMS', name: '요구사항관리', db: 'Oracle 19c', schema: 'RQMS', desc: '요구사항 · 프로젝트 관리 시스템' }, { code: 'ERP', name: '통합ERP', db: 'Oracle 19c', schema: 'ERP', desc: '영업 · 구매 · 재고 · 생산 · 회계 · 인사 통합 시스템' }];
  window.SYSLIST = SYSLIST;
  window.curSys = () => { const c = store.get('dbm-sys', 'ERP'); return SYSLIST.find(s => s.code === c) || SYSLIST[0]; };
  window.getAllModels = () => { const all = J('dbm-model', clone(MODEL0)); Object.keys(MODEL0).forEach(k => { if (!all[k]) all[k] = clone(MODEL0[k]); }); return all; };
  const AREA_ORDER = ['e_hr', 'e_tr', 'e_fi', 'e_sd', 'e_mm', 'e_wm', 'e_pp'];
  window.getModels = () => { const c = curSys().code; const ent = Object.entries(getAllModels()).filter(([, m]) => (m.system || 'RQMS') === c); ent.sort((a, b) => { const x = AREA_ORDER.indexOf(a[0]), y = AREA_ORDER.indexOf(b[0]); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); }); return Object.fromEntries(ent); };
  window.defArea = () => Object.keys(getModels())[0] || 'rq';
  window.getModel = area => getAllModels()[area] || MODEL0.rq;
  /* new business area (system home [+ 업무 영역], DDL import): id, name, v1 working version, optional imported structure */
  window.addArea = (name, structure, meta) => {
    const all = getAllModels(); let n = 1; while (all['a' + n]) n++; const id = 'a' + n;
    all[id] = Object.assign({ ver: 1, base: 0, name, system: curSys().code }, meta || {}); S('dbm-model', all);
    if (structure) { S('dbm-area-seed-' + id, structure); setModelData(id, 1, Object.assign({}, structure, { rev: 0 })); }
    return id;
  };
  window.setModel = (area, m) => { const all = getAllModels(); all[area] = m; S('dbm-model', all); };
  window.modelLock = area => {
    const m = getModel(area);
    const d = getDocs().filter(x => x.type === 'model' && x.area === area && x.ver === m.ver).sort((a, b) => b.id.localeCompare(a.id))[0];
    if (d && ['da', 'final'].includes(d.step)) return { state: 'review', doc: d, model: m };
    if (d && d.step === 'done') return { state: 'confirmed', doc: d, model: m };
    return { state: 'edit', doc: d || null, model: m };
  };
  /* expectVer: the confirmed version the user was looking at — a second click (another tab, double click) must not start yet another version */
  window.startNextVersion = (area, expectVer) => {
    const m = getModel(area);
    if (expectVer != null && (m.ver !== expectVer || modelLock(area).state !== 'confirmed')) return { ok: false, ver: m.ver };
    // the next working version starts from the confirmed version's structure
    const lk = modelLock(area); const base = (lk.doc && lk.doc.model) || getModelData(area, m.ver);
    if (base) setModelData(area, m.ver + 1, Object.assign({}, base, { rev: 0 }));
    setModel(area, Object.assign({}, m, { ver: m.ver + 1, base: m.ver }));
    return { ok: true, ver: m.ver + 1 };
  };

  /* ---- model seed per business area (v7.3): model, standardize, DDL, system home and import read the same structure ---- */
  const MODEL_SEED = {
    rq: { E: [
    { id: 'prj', n: '프로젝트기본', p: 'PRJ_M', c: 'M', x: 60, y: 60, px: 60, py: 60, a: [
      { n: '프로젝트ID', p: 'PRJ_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '프로젝트명', p: 'PRJ_NM', t: 'VARCHAR2(100)', nn: 1, s: 'ok' }, { n: '발주처명', p: 'ORDR_OFC_NM', t: 'VARCHAR2(100)', s: 'ok' }, { n: '프로젝트종료일', p: 'PRJ_ENDDD', t: 'CHAR(8)', s: 'ex', exReason: '운영 DB 컬럼 · 배치 영향' }, { n: '수주금액', p: 'WINCON_AMT', t: 'NUMBER(15)', s: 'ok' }] },
    { id: 'emp', n: '사원기본', p: 'EMP_M', c: 'K', x: 420, y: 40, px: 460, py: 40, a: [
      { n: '사원번호', p: 'EMP_NO', t: 'NUMBER(6)', pk: 1, nn: 1, s: 'ok' }, { n: '사원명', p: 'EMP_NM', t: 'VARCHAR2(100)', nn: 1, s: 'ok', sec: '개인정보', enc: '없음' }, { n: '휴대전화번호', p: 'MBTL_NO', t: 'VARCHAR2(20)', s: 'ok', sec: '개인정보', enc: '양방향(ARIA)' }] },
    { id: 'mbr', n: '프로젝트팀원구성내역', p: 'PRJ_MBR_D', c: 'A', x: 400, y: 220, px: 440, py: 240, a: [
      { n: '프로젝트ID', p: 'PRJ_ID', t: 'VARCHAR2(10)', pk: 1, fk: 1, nn: 1, s: 'ok' }, { n: '팀원사원번호', p: 'TMBR_EMP_NO', t: 'NUMBER(6)', pk: 1, fk: 1, nn: 1, s: 'ok' }, { n: '투입시작일자', p: 'INPT_BEGIN_YMD', t: 'CHAR(8)', s: 'ok' }, { n: '역할구분코드', p: 'ROLE_SE_CD', t: 'CHAR(1)', s: 'ok' }] },
    { id: 'rqrm', n: '요구사항내역', p: 'RQRM_D', c: 'A', x: 60, y: 340, px: 60, py: 380, ix: [{ n: 'RQRM_D_IX90', c: 'REQ_CUST_NM' }], a: [
      { n: '요구사항ID', p: 'DEMND_MATER_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '요구사항명', p: 'DEMND_MATER_NM', t: 'VARCHAR2(100)', nn: 1, s: 'ok' }, { n: '요구사항내용', p: 'DEMND_MATER_CN', t: 'VARCHAR2(1000)', s: 'ok' }, { n: '요청고객명', p: 'REQ_CUST_NM', t: 'VARCHAR2(100)', s: 'ex', exReason: '대외 연계 컬럼명 유지', sec: '개인정보', enc: '없음', secSrc: '직접 지정 · 사유 있음' }, { n: '프로젝트ID', p: 'PRJ_ID', t: 'VARCHAR2(10)', fk: 1, s: 'ok' }] },
    { id: 'dlv', n: '산출물기본', p: 'DLVRBL_M', c: 'M', x: 420, y: 450, px: 460, py: 500, st: 1, reqDoc: 'REQ-2026-0013', uk: ['DLVRBL_NM'], sub: { disc: '산출물유형코드', kind: '배타', kids: ['문서산출물', '모델산출물'] }, a: [
      { n: '산출물ID', p: 'DLVRBL_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '산출물명', p: 'DLVRBL_NM', t: 'VARCHAR2(100)', nn: 1, s: 'ok' }, { n: '산출물제출일', p: '—', t: '—', s: 'comb' }, { n: '산출물수령자명', p: '—', t: '—', s: 'unreg', cand: 1 }, { n: '요구사항ID', p: 'DEMND_MATER_ID', t: 'VARCHAR2(10)', fk: 1, s: 'ok' }] },
    { id: 'hist', n: '산출물이력', p: '—', c: 'H', x: 800, y: 470, px: 860, py: 520, a: [
      { n: '산출물ID', p: 'DLVRBL_ID', t: 'VARCHAR2(10)', pk: 1, fk: 1, nn: 1, s: 'ok' }, { n: '이력순번', p: '—', t: '—', pk: 1, s: 'unreg' }, { n: '수령자ID', p: '—', t: '—', s: 'unreg' }] },
    { id: 'risk', n: '리스크기본', p: 'RISK_M', c: 'M', x: 60, y: 640, px: 60, py: 700, a: [
      { n: '리스크ID', p: 'RISK_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '리스크명', p: 'RISK_NM', t: 'VARCHAR2(100)', s: 'ok' }, { n: '리스크등급코드', p: 'RISK_GRD_CD', t: 'CHAR(1)', s: 'ok' }] }
  ], R: [
    { f: 'prj', t: 'rqrm', k: 'nonid', name: '수행한다' },
    { f: 'prj', t: 'mbr', k: 'id', name: '구성된다' },
    { f: 'emp', t: 'mbr', k: 'id', name: '참여한다' },
    { f: 'rqrm', t: 'dlv', k: 'nonid', name: '산출한다' },
    { f: 'dlv', t: 'hist', k: 'id', name: '기록된다', noFk: '이력 테이블 · 운영 DB에서 FK를 쓰지 않음(대량 적재)' },
    { f: 'rqrm', t: 'risk', k: 'mn', name: '관련된다' }
  ], M: [{ id: 'm1', mode: 'L', x: 820, y: 330, text: '산출물이력 순번 체계는 DA 확인 후 확정 (11/18 회의)', by: '박설계' }] },
    risk: { E: [{ id: 'risk', n: '리스크기본', p: 'RISK_M', c: 'M', x: 60, y: 60, px: 60, py: 60, a: [{ n: '리스크ID', p: 'RISK_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '리스크명', p: 'RISK_NM', t: 'VARCHAR2(100)', s: 'ok' }, { n: '리스크등급코드', p: 'RISK_GRD_CD', t: 'CHAR(1)', s: 'ok' }] },
      { id: 'rsp', n: '리스크대응내역', p: 'RISK_RSPNS_D', c: 'A', x: 420, y: 60, px: 460, py: 60, a: [{ n: '리스크ID', p: 'RISK_ID', t: 'VARCHAR2(10)', pk: 1, fk: 1, nn: 1, s: 'ok' }, { n: '대응순번', p: 'RSPNS_SN', t: 'NUMBER(5)', pk: 1, nn: 1, s: 'ok' }, { n: '대응내용', p: 'RSPNS_CN', t: 'VARCHAR2(1000)', s: 'ok' }] }], R: [{ f: 'risk', t: 'rsp', k: 'id', name: '대응한다' }], M: [] }
  };
  /* FK of a relation: ok (constraint made) · ex (left out with a reason) · miss (no FK column / table name) · mn (resolve first) */
  window.fkOf = (r, E) => {
    const p = E.find(x => x.id === r.f), c = E.find(x => x.id === r.t);
    if (!p || !c) return { st: 'none' };
    if (r.k === 'mn') return { st: 'mn', why: 'M:N 관계 — 해소한 뒤 FK가 생깁니다' };
    if (r.noFk) return { st: 'ex', why: r.noFk };
    if (p.p === '—' || c.p === '—') return { st: 'miss', why: (c.p === '—' ? c.n : p.n) + ' 테이블 물리명 없음' };
    const pk = p.a.filter(a => a.pk);
    if (!pk.length) return { st: 'miss', why: p.n + ' PK 없음' };
    if (pk.some(a => a.p === '—')) return { st: 'miss', why: p.n + ' PK 물리명 없음' };
    // relation group (made by drawing the relation) first; otherwise each parent PK column must have a child FK column of the same name
    // each child column is matched to ITS parent column (fkp = the parent column it carries; else same name or ORG_ role name) — never by position
    const pick = (k, list) => list.find(x => x.fkp === k.p) || list.find(x => !x.fkp && (x.p === k.p || x.p === 'ORG_' + k.p));
    let cc;
    if (r.g) { const g = c.a.filter(a => a.fk && a.fkg === r.g);
      if (g.length !== pk.length) cc = null;
      else { const m = pk.map(k => pick(k, g)); cc = m.every(Boolean) && new Set(m).size === m.length ? m : (g.some(x => x.fkp) ? null : g); } }   // older role-named groups without fkp keep their drawn order
    else if (r.f === r.t) cc = null;   // a recursive relation always needs role-named columns
    else cc = pk.map(k => pick(k, c.a.filter(a => a.fk)));
    if (!cc || cc.some(x => !x || x.p === '—')) {
      const have = cc ? cc.filter(x => x && x.p !== '—').length : 0;
      return { st: 'miss', why: r.f === r.t ? '재귀 관계 — 역할명 FK 컬럼 지정 필요' : !c.a.some(a => a.fk) ? 'FK 컬럼 없음' : have ? `부모 PK ${pk.length}개 중 ${have}개만 대응 — 나머지 컬럼 지정 필요` : 'FK 컬럼 이름이 부모 PK와 다름(역할명) — 대응 컬럼 지정 필요' };
    }
    return { st: 'ok', cols: cc.map(a => a.p), pcols: pk.map(a => a.p), ref: !!p.ref, name: `${c.p}_${p.p}_FK${r.g && !r.gAuto && cc.some((a, i) => a.p !== pk[i].p) ? '_' + String(r.g).slice(-2).toUpperCase() : ''}` };   // only a role-named FK (a second relation into the same child) needs a suffix · a tidy-up group (gAuto) never renames
  };
  /* constraints and indexes of a table (PK · UK · FK · FK index · explicit index) */
  window.consOf = (e, E, R) => {
    if (e.ref) return { pk: null, uk: [], fk: [], ix: [] };
    const pkc = e.a.filter(a => a.pk).map(a => a.p);
    const fk = R.filter(r => r.t === e.id && r.k !== 'mn').map(r => Object.assign({ r }, fkOf(r, E))).filter(f => f.st === 'ok');
    return { pk: pkc.length && e.p !== '—' ? { n: e.p + '_PK', c: pkc.join(', ') } : null, uk: (e.uk || []).map((c, i) => ({ n: `${e.p}_UK${i + 1}`, c })), fk: fk.map(f => ({ n: f.name, c: f.cols.join(', ') })), ix: fk.map((f, i) => ({ n: `${e.p}_IX${String(i + 1).padStart(2, '0')}`, c: f.cols.join(', '), auto: 1 })).concat((e.ix || []).map(x => ({ n: x.n, c: x.c }))) };
  };
  /* diagram views of a business area (12 §3.1): placement only, "전체" always first */
  const VIEWS0 = { rq: [{ id: 'all', n: '전체' }, { id: 'dlv', n: '산출물 흐름', ents: ['rqrm', 'dlv', 'hist'] }] };
  /* ---- 통합ERP sample system (13): six business modules, generated from a word list so physical names, types and FK columns stay consistent.
     Attribute marks: * PK · ! 조합 가능(단어는 모두 있지만 용어 미등록) · # 예외(사유). A name with a word that is not in the list is 미등록 by itself.
     Relations: [parent, child, kind, name, noFk reason, role] — role = [Korean prefix, physical prefix] makes role-named FK columns (BOM 모/자품목, 출발/도착 창고, 상위 계정). ---- */
  const ERP_WORDS = { 고객: 'CUST', 거래처: 'BCNC', 공급사: 'SPLR', 담당자: 'PIC', 견적: 'QUOT', 주문: 'ORD', 출하: 'SHIP', 매출: 'SLS', 반품: 'RTGD', 매입: 'PRCH', 구매: 'PUR', 발주: 'PO', 요청: 'REQ', 입고: 'WRHS', 출고: 'RLS', 이동: 'MVMT', 실사: 'ACTL', 수불: 'RCDS', 품목: 'ITEM', 분류: 'CL', 창고: 'WH', 위치: 'LOC', 재고: 'STCK', 로트: 'LOT', 제품: 'PRDT', 구성: 'CMPS', 공정: 'PRCS', 설비: 'EQP', 생산: 'PRDCT', 계획: 'PLAN', 작업지시: 'WORDR', 작업: 'WORK', 실적: 'PRFMNC', 투입: 'INPT', 검사: 'INSP', 품질: 'QLTY', 가동: 'OPRT', 비가동: 'NOPRT', 계정: 'ACNT', 과목: 'SBJT', 원가센터: 'CCTR', 전표: 'SLIP', 세금계산서: 'TXINV', 채권: 'RCVB', 채무: 'PYBL', 회계: 'ACNTG', 은행: 'BANK', 계좌번호: 'ACTNO', 계좌: 'BACNT', 예금주: 'DPSTR', 예산: 'BDGT', 집행: 'EXCN', 마감: 'CLSG', 차변: 'DBT', 대변: 'CRDT', 차대: 'DC', 적요: 'SMRY', 사원: 'EMP', 부서: 'DEPT', 직급: 'JBGD', 발령: 'APNT', 근태: 'DCLZ', 근무: 'WRK', 출근: 'ATDN', 퇴근: 'LVWK', 초과근무: 'OVTM', 휴가: 'VCTN', 신청: 'APLCN', 급여: 'SLRY', 기본급: 'BSSLRY', 수당: 'ALWNC', 공제: 'DDCT', 실지급: 'RLPAY', 가족: 'FMLY', 부양: 'SPRT', 교육: 'EDU', 과정: 'CRS', 이수: 'CMPTN', 자격증: 'CRTFCT', 자격: 'QLFC', 발급: 'ISSU', 기관: 'INST', 취득: 'ACQS', 입사: 'JNCMP', 퇴사: 'RSGN', 재직: 'HFFC', 성별: 'SEX', 생년월일: 'BRDT', 영문: 'ENG', 상위: 'UP', 레벨: 'LVL', 사업자등록번호: 'BRNO', 대표자: 'RPRSV', 업종: 'TPBIZ', 등급: 'GRD', 여신한도: 'CRLMT', 거래: 'DLNG', 시작: 'BGNG', 종료: 'END', 유효: 'VLD', 사용: 'USE', 대표: 'RPRS', 판매: 'SALE', 단가: 'UPRC', 가격: 'PRC', 할인: 'DSCNT', 공급가액: 'SPLY_AMT', 부가세: 'VAT', 총: 'TOT', 결제: 'STLM', 조건: 'CND', 납기: 'DUDT', 배송: 'DLVY', 운송장: 'WAYBL', 업체: 'ENT', 완료: 'CMPL', 사유: 'RSN', 변경: 'CHG', 이전: 'BFR', 값: 'VL', 항목: 'ARTCL', 적용: 'APLY', 통화: 'CRNCY', 희망: 'HOPE', 승인: 'APRV', 합격: 'PASS', 불량: 'DFCT', 양품: 'GDS', 결과: 'RSLT', 지급: 'PAY', 예정: 'PRNMNT', 최소: 'MIN', 규격: 'SPEC', 단위: 'UNIT', 안전: 'SAFE', 표준: 'STD', 관리: 'MNG', 적재: 'LDNG', 가능: 'PSBLTY', 할당: 'ALOC', 가용: 'AVL', 최종: 'LAST', 제조: 'MNFCT', 출발: 'DPRT', 도착: 'ARVL', 장부: 'BOOK', 차이: 'DIFF', 조정: 'ADJ', 기말: 'TRMEND', 소요: 'RQRD', 손실: 'LOSS', 시간: 'HR', 도입: 'INTRCN', 년월: 'YM', 년도: 'YR', 발행: 'PBLCN', 발생: 'OCRN', 만기: 'MTRY', 입금: 'RCPT', 잔액: 'BLNC', 용도: 'PRPS', 관계: 'REL', 일수: 'DCNT', 저장: 'STRG', 자재: 'MTRL', 지시: 'INSTR', 모: 'PRNT', 자: 'CHLD', 수주: 'ORDR',
    자금: 'FUND', 수입: 'INCM', 지출: 'EXPN', 입출금: 'DPWD', 이체: 'TRSF', 출금: 'WDRW', 차입: 'BRWG', 차입금: 'LOAN', 상환: 'RPMT', 원금: 'PRIN', 이자: 'INTR', 방식: 'MTHD', 투자: 'INVT', 자산: 'AST', 어음: 'BILL', 매매: 'TRD', 기준: 'STDR', 환율: 'EXRT', 일별: 'DAY', 평가: 'EVL', 등록: 'REG',
    번호: 'NO', 코드: 'CD', 명: 'NM', 일자: 'YMD', 일시: 'DT', 금액: 'AMT', 액: 'AMT', 수량: 'QTY', 율: 'RT', 여부: 'YN', 구분: 'SE', 상태: 'STTS', 유형: 'TYPE', 순번: 'SN', 내용: 'CN', 주소: 'ADDR', 전화번호: 'TELNO', 이메일: 'EML', 기본: 'M', 내역: 'D', 이력: 'H', 상세: 'DTL' };
  const ERP_TYPE = { NO: 'VARCHAR2(20)', CD: 'VARCHAR2(10)', NM: 'VARCHAR2(100)', YMD: 'CHAR(8)', DT: 'DATE', AMT: 'NUMBER(18,2)', UPRC: 'NUMBER(18,2)', QTY: 'NUMBER(15,3)', RT: 'NUMBER(5,2)', YN: 'CHAR(1)', SE: 'VARCHAR2(2)', STTS: 'VARCHAR2(2)', TYPE: 'VARCHAR2(2)', SN: 'NUMBER(5)', CN: 'VARCHAR2(4000)', ADDR: 'VARCHAR2(200)', TELNO: 'VARCHAR2(20)', EML: 'VARCHAR2(100)', BRNO: 'CHAR(10)', ACTNO: 'VARCHAR2(30)', BRDT: 'CHAR(8)', HR: 'NUMBER(7,2)', YM: 'CHAR(6)', YR: 'CHAR(4)', DCNT: 'NUMBER(5,1)' };
  const ERP_DOM = { NO: '번호V20', CD: '코드V10', NM: '명V100', YMD: '연월일C8', DT: '일시T', AMT: '금액N18', UPRC: '금액N18', QTY: '수량N15', RT: '율N5', YN: '여부C1', SE: '구분V2', STTS: '상태V2', TYPE: '유형V2', SN: '순번N5', CN: '내용V4000', ADDR: '주소V200', TELNO: '전화번호V20', EML: '이메일V100', BRNO: '사업자번호C10', ACTNO: '계좌번호V30', BRDT: '연월일C8', HR: '시간N7', YM: '연월C6', YR: '연도C4', DCNT: '일수N5' };
  const ERP_SECRET = { 전화번호: '양방향(ARIA)', 이메일: '없음', 주소: '없음', 생년월일: '양방향(ARIA)', 계좌번호: '양방향(ARIA)', 가족명: '없음', 사원명: '없음' };
  const erpSplit = name => { const out = []; let s = name; while (s.length) { let hit = null; for (let l = Math.min(7, s.length); l >= 1; l--) { const w = s.slice(0, l); if (ERP_WORDS[w]) { hit = w; break; } } if (!hit) return null; out.push(ERP_WORDS[hit]); s = s.slice(hit.length); } return out; };
  const ERP = {
    e_sd: { name: '영업관리', ver: 3, base: 2, desc: '고객 · 견적 · 주문 · 출하 · 매출 · 반품',
      ents: [['cust', '고객기본', '고객번호*,고객명,사업자등록번호,대표자명,업종명,고객등급코드,주소,전화번호,이메일,여신한도금액,거래시작일자,사용여부', 'M'],
        ['custpic', '고객담당자내역', '담당자순번*,담당자명,부서명,전화번호,이메일,대표여부', 'M'],
        ['price', '판매가격기본', '적용시작일자*,판매단가,통화코드,적용종료일자', 'M'],
        ['quot', '견적기본', '견적번호*,견적일자,유효종료일자,견적금액,견적상태코드,견적특기사항'],
        ['quotd', '견적상세내역', '견적순번*,견적수량,판매단가,할인율,견적금액'],
        ['ord', '주문기본', '주문번호*,주문일자,납기일자,주문상태코드,결제조건코드,공급가액,부가세액,주문총금액,배송주소,배송요청사항'],
        ['ordd', '주문상세내역', '주문순번*,주문수량,판매단가,할인금액,공급가액,출하완료여부'],
        ['ship', '출하기본', '출하번호*,출하일자,출하상태코드,운송장번호,배송업체명'],
        ['shipd', '출하상세내역', '출하순번*,출하수량'],
        ['sls', '매출기본', '매출번호*,매출일자,공급가액,부가세액,매출총금액,세금계산서번호'],
        ['slsd', '매출상세내역', '매출순번*,매출수량,공급가액,부가세액'],
        ['rtn', '반품기본', '반품번호*,반품일자,반품수량,반품사유내용,반품상태코드'],
        ['ordh', '주문상태이력', '이력순번*,변경일시,이전상태코드,변경상태코드!', 'H']],
      refs: [['bcnc', 'e_fi'], ['item', 'e_wm'], ['lot', 'e_wm'], ['wh', 'e_wm'], ['emp', 'e_hr']],
      rels: [['bcnc', 'cust', 'nonid', '회계 거래처이다'], ['cust', 'custpic', 'id', '담당한다'], ['cust', 'quot', 'nonid', '요청한다'], ['quot', 'quotd', 'id', '포함한다'], ['item', 'quotd', 'nonid', '견적된다'], ['cust', 'ord', 'nonid', '주문한다'], ['quot', 'ord', 'nonid', '전환된다'], ['emp', 'ord', 'nonid', '영업 담당한다'], ['ord', 'ordd', 'id', '포함한다'], ['item', 'ordd', 'nonid', '주문된다'], ['item', 'price', 'id', '가격을 가진다'], ['ord', 'ship', 'nonid', '출하된다'], ['wh', 'ship', 'nonid', '출고한다'], ['ship', 'shipd', 'id', '포함한다'], ['ordd', 'shipd', 'nonid', '출하된다'], ['lot', 'shipd', 'nonid', '추적된다'], ['ship', 'sls', 'nonid', '매출된다'], ['sls', 'slsd', 'id', '포함한다'], ['shipd', 'slsd', 'nonid', '청구된다'], ['shipd', 'rtn', 'nonid', '반품된다'], ['ord', 'ordh', 'id', '기록된다']],
      views: [['flow', '주문 → 출하 → 매출', ['ord', 'ordd', 'ship', 'shipd', 'sls', 'slsd', 'rtn']], ['cust', '고객 · 견적', ['cust', 'custpic', 'quot', 'quotd', 'price']]] },
    e_mm: { name: '구매관리', ver: 2, base: 1, desc: '공급사 · 구매요청 · 발주 · 구매입고 · 입고검사 · 매입',
      ents: [['splr', '공급사기본', '공급사번호*,공급사명,사업자등록번호,대표자명,주소,전화번호,결제조건코드,거래상태코드!', 'M'],
        ['sprice', '공급사단가기본', '적용시작일자*,구매단가!,최소주문수량,적용종료일자', 'M'],
        ['preq', '구매요청기본', '구매요청번호*,요청일자,요청부서코드,요청사유내용,승인상태코드'],
        ['preqd', '구매요청상세내역', '요청순번*,요청수량,희망납기일자'],
        ['po', '발주기본', '발주번호*,발주일자,납기일자,발주상태코드,발주총금액,통화코드'],
        ['pod', '발주상세내역', '발주순번*,발주수량,구매단가!,발주금액,입고완료여부'],
        ['grcpt', '구매입고내역', '입고번호*,입고일자,입고수량'],
        ['qc', '입고검사기본', '검사번호*,검사일자,합격수량,불량수량,검사결과코드'],
        ['pur', '매입기본', '매입번호*,매입일자,공급가액,부가세액,세금계산서번호,지급예정일자'],
        ['purd', '매입상세내역', '매입순번*,매입수량,공급가액'],
        ['poh', '발주변경이력', '이력순번*,변경일시,변경항목명,변경이전값내용', 'H']],
      refs: [['bcnc', 'e_fi'], ['item', 'e_wm'], ['wh', 'e_wm']],
      rels: [['bcnc', 'splr', 'nonid', '회계 거래처이다'], ['splr', 'sprice', 'id', '단가를 가진다'], ['item', 'sprice', 'id', '구매단가가 있다'], ['preq', 'preqd', 'id', '포함한다'], ['item', 'preqd', 'nonid', '요청된다'], ['splr', 'po', 'nonid', '발주받는다'], ['preq', 'po', 'nonid', '전환된다'], ['po', 'pod', 'id', '포함한다'], ['item', 'pod', 'nonid', '발주된다'], ['pod', 'grcpt', 'nonid', '입고된다'], ['wh', 'grcpt', 'nonid', '받는다'], ['grcpt', 'qc', 'nonid', '검사된다'], ['splr', 'pur', 'nonid', '청구한다'], ['pur', 'purd', 'id', '포함한다'], ['grcpt', 'purd', 'nonid', '대사된다'], ['po', 'poh', 'id', '기록된다']],
      views: [['flow', '요청 → 발주 → 입고 → 매입', ['preq', 'preqd', 'po', 'pod', 'grcpt', 'qc', 'pur', 'purd']]] },
    e_wm: { name: '재고관리', ver: 6, base: 5, desc: '품목 · 창고 · 재고 · 입출고 · 이동 · 실사',
      ents: [['icat', '품목분류기본', '분류코드*,분류명,분류레벨순번', 'K'],
        ['item', '품목기본', '품목코드*,품목명,규격명,품목유형코드,재고단위코드,안전재고수량,표준단가,로트관리여부,사용여부', 'M'],
        ['wh', '창고기본', '창고코드*,창고명,창고유형코드,주소,관리부서코드', 'M'],
        ['loc', '저장위치기본', '위치코드*,위치명,적재가능수량', 'M'],
        ['lot', '로트기본', '로트번호*,제조일자,유효종료일자,로트상태코드', 'M'],
        ['stck', '재고기본', '재고수량,할당수량,가용수량,최종입고일자'],
        ['wrhs', '입고기본', '입고번호*,입고일자,입고유형코드,입고수량'],
        ['rls', '출고기본', '출고번호*,출고일자,출고유형코드,출고수량'],
        ['mv', '재고이동내역', '이동번호*,이동일자,이동수량'],
        ['cnt', '재고실사기본', '실사번호*,실사일자,장부수량,실사수량,차이수량,조정여부'],
        ['sth', '재고수불이력', '수불순번*,수불일시,수불구분코드,수불수량,기말수량', 'H']],
      rels: [['icat', 'icat', 'nonid', '상위 분류'], ['icat', 'item', 'nonid', '분류한다'], ['wh', 'loc', 'id', '나뉜다'], ['item', 'stck', 'id', '보관된다'], ['wh', 'stck', 'id', '보관한다'], ['item', 'lot', 'id', '생산된다'], ['item', 'wrhs', 'nonid', '입고된다'], ['wh', 'wrhs', 'nonid', '받는다'], ['lot', 'wrhs', 'nonid', '추적된다'], ['item', 'rls', 'nonid', '출고된다'], ['wh', 'rls', 'nonid', '내보낸다'], ['lot', 'rls', 'nonid', '추적된다'], ['item', 'mv', 'nonid', '이동된다'], ['wh', 'mv', 'nonid', '내보낸다', null, ['출발', 'DPRT']], ['wh', 'mv', 'nonid', '받는다', null, ['도착', 'ARVL']], ['item', 'cnt', 'nonid', '실사된다'], ['wh', 'cnt', 'nonid', '실사한다'], ['stck', 'sth', 'id', '기록된다', '이력 테이블 · 대량 적재라 운영 DB에서 FK를 쓰지 않음']],
      views: [['flow', '재고 수불', ['stck', 'wrhs', 'rls', 'mv', 'sth', 'cnt']]] },
    e_pp: { name: '생산관리', ver: 1, base: 0, desc: '제품 구성(BOM) · 공정 · 설비 · 작업지시 · 실적 · 품질',
      ents: [['bom', '제품구성기본', '소요수량,손실율!', 'M'],
        ['prcs', '공정기본', '공정코드*,공정명,표준작업시간,공정순번', 'M'],
        ['eqp', '설비기본', '설비코드*,설비명,설비유형코드,도입일자,가동상태코드', 'M'],
        ['plan', '생산계획기본', '계획번호*,계획년월,계획수량,계획상태코드'],
        ['wo', '작업지시기본', '작업지시번호*,지시일자!,작업지시수량,시작예정일자,완료예정일자,작업상태코드'],
        ['wor', '작업실적내역', '실적순번*,실적일자,양품수량,불량수량,작업시간'],
        ['inpt', '자재투입내역', '투입순번*,투입일자,투입수량'],
        ['qcp', '품질검사기본', '검사번호*,검사일자,검사수량,합격여부,불량유형코드'],
        ['eqh', '설비가동이력', '가동순번*,시작일시,종료일시,비가동사유코드', 'H']],
      refs: [['item', 'e_wm'], ['lot', 'e_wm'], ['wh', 'e_wm']],
      rels: [['item', 'bom', 'id', '구성한다(제품)', null, ['모', 'PRNT']], ['item', 'bom', 'id', '구성된다(부품)', null, ['자', 'CHLD']], ['item', 'plan', 'nonid', '계획된다'], ['plan', 'wo', 'nonid', '지시된다'], ['prcs', 'wo', 'nonid', '수행한다'], ['item', 'wo', 'nonid', '생산된다'], ['wo', 'wor', 'id', '실적을 낸다'], ['eqp', 'wor', 'nonid', '가동한다'], ['wo', 'inpt', 'id', '투입한다'], ['lot', 'inpt', 'nonid', '투입된다'], ['wh', 'inpt', 'nonid', '불출한다'], ['wo', 'qcp', 'nonid', '검사된다'], ['eqp', 'eqh', 'id', '기록된다']],
      views: [['flow', '계획 → 작업지시 → 실적', ['plan', 'wo', 'wor', 'inpt', 'qcp']], ['bom', '제품 구성(BOM)', ['bom', 'prcs']]] },
    e_tr: { name: '재무관리', ver: 2, base: 1, desc: '자금 계획 · 입출금 · 이체 · 차입금 · 투자 자산 · 어음 · 환율',
      ents: [['fplan', '자금계획기본', '계획번호*,계획년월,수입예정금액,지출예정금액,계획상태코드'],
        ['fplanD', '자금계획상세내역', '계획순번*,자금구분코드,예정일자,예정금액,실적금액'],
        ['dpwd', '입출금내역', '거래번호*,거래일시,입출금구분코드,거래금액,잔액금액,적요내용'],
        ['trns', '자금이체내역', '이체번호*,이체일자,이체금액,수수료금액,이체상태코드'],
        ['brwg', '차입금기본', '차입번호*,차입기관명,차입일자,만기일자,원금금액,이자율!,상환방식코드', 'M'],
        ['rpmt', '차입금상환내역', '상환순번*,상환일자,원금상환금액,이자금액'],
        ['invt', '투자자산기본', '자산번호*,자산명,자산유형코드,취득일자,취득금액,평가금액', 'M'],
        ['note', '어음기본', '어음번호*,어음구분코드,발행일자,만기일자,어음금액,어음상태코드'],
        ['exrt', '환율이력', '통화코드*,적용일자*,매매기준율,등록일시', 'H'],
        ['dfund', '일별자금이력', '기준일자*,총수입금액,총지출금액,기말잔액금액', 'H']],
      refs: [['bank', 'e_fi', 1], ['bcnc', 'e_fi']],
      rels: [['fplan', 'fplanD', 'id', '포함한다'], ['bank', 'dpwd', 'nonid', '거래된다'], ['bank', 'trns', 'nonid', '돈이 나간다', null, ['출금', 'WDRW']], ['bank', 'trns', 'nonid', '돈이 들어온다', null, ['입금', 'RCPT']], ['brwg', 'rpmt', 'id', '상환된다'], ['bank', 'rpmt', 'nonid', '지급한다'], ['bcnc', 'note', 'nonid', '발행 · 수취한다']],
      views: [['cash', '자금 흐름', ['fplan', 'fplanD', 'dpwd', 'trns', 'dfund']], ['loan', '차입 · 투자', ['brwg', 'rpmt', 'invt', 'note']]] },
    e_fi: { name: '회계관리', ver: 4, base: 3, desc: '계정과목 · 전표 · 세금계산서 · 매출채권 · 매입채무 · 예산',
      ents: [['acnt', '계정과목기본', '계정코드*,계정명,계정구분코드,차대구분코드,사용여부', 'M'],
        ['cc', '원가센터기본', '원가센터코드*,원가센터명,관리부서코드', 'M'],
        ['bcnc', '거래처기본', '거래처코드*,거래처명,사업자등록번호#,거래처구분코드', 'M'],
        ['bank', '은행계좌기본', '계좌번호*,은행코드,예금주명,계좌용도코드', 'M'],
        ['slip', '전표기본', '전표번호*,전표일자,전표유형코드,적요내용,승인상태코드'],
        ['slipd', '전표상세내역', '전표순번*,차변금액,대변금액,적요내용'],
        ['txinv', '세금계산서기본', '세금계산서번호*,발행일자,공급가액,부가세액,발행구분코드'],
        ['ar', '매출채권기본', '채권번호*,발생일자,채권금액,입금금액,잔액금액,만기일자'],
        ['ap', '매입채무기본', '채무번호*,발생일자,채무금액,지급금액,잔액금액,지급예정일자'],
        ['bdgt', '예산기본', '예산년도*,예산금액,집행금액'],
        ['close', '회계마감이력', '마감년월*,마감일시,마감상태코드', 'H']],
      refs: [['sls', 'e_sd'], ['pur', 'e_mm']],
      rels: [['acnt', 'acnt', 'nonid', '상위 계정', null, ['상위', 'UP']], ['slip', 'slipd', 'id', '포함한다'], ['acnt', 'slipd', 'nonid', '기표된다'], ['cc', 'slipd', 'nonid', '귀속된다'], ['bcnc', 'slipd', 'nonid', '거래한다'], ['bcnc', 'txinv', 'nonid', '발행받는다'], ['sls', 'ar', 'nonid', '채권이 생긴다'], ['bcnc', 'ar', 'nonid', '받을 돈'], ['txinv', 'ar', 'nonid', '근거가 된다'], ['pur', 'ap', 'nonid', '채무가 생긴다'], ['bcnc', 'ap', 'nonid', '줄 돈'], ['bank', 'ap', 'nonid', '지급한다'], ['acnt', 'bdgt', 'id', '편성된다'], ['cc', 'bdgt', 'id', '배정된다']],
      views: [['slip', '전표', ['slip', 'slipd', 'acnt', 'cc', 'bcnc']], ['arap', '채권 · 채무', ['bcnc', 'txinv', 'ar', 'ap', 'bank']]] },
    e_hr: { name: '인사관리', ver: 5, base: 4, desc: '사원 · 부서 · 발령 · 근태 · 휴가 · 급여 · 교육',
      ents: [['dept', '부서기본', '부서코드*,부서명,사용여부', 'M'],
        ['jbgd', '직급기본', '직급코드*,직급명,직급순번', 'K'],
        ['emp', '사원기본', '사원번호*,사원명,영문명,생년월일,성별코드,입사일자,퇴사일자,재직상태코드,전화번호,이메일,주소', 'M'],
        ['fam', '가족내역', '가족순번*,가족명,관계코드,생년월일,부양여부', 'M'],
        ['edu', '교육이수내역', '교육순번*,교육과정명,이수일자,이수시간', 'M'],
        ['crtf', '자격증내역', '자격순번*,자격증명,취득일자,발급기관명', 'M'],
        ['appt', '발령이력', '발령순번*,발령일자,발령구분코드', 'H'],
        ['dclz', '근태내역', '근무일자*,출근일시,퇴근일시,근태구분코드,초과근무시간'],
        ['vctn', '휴가신청내역', '휴가신청번호*,휴가구분코드,시작일자,종료일자,휴가일수,승인상태코드'],
        ['slry', '급여기본', '급여년월*,지급일자,기본급금액,수당금액,공제금액,실지급금액,계좌번호'],
        ['slryd', '급여상세내역', '항목순번*,급여항목코드,지급금액']],
      rels: [['dept', 'dept', 'nonid', '상위 부서', null, ['상위', 'UP']], ['dept', 'emp', 'nonid', '소속된다'], ['jbgd', 'emp', 'nonid', '부여된다'], ['emp', 'appt', 'id', '발령받는다'], ['dept', 'appt', 'nonid', '이전 부서', null, ['이전', 'BFR']], ['dept', 'appt', 'nonid', '발령 부서'], ['emp', 'dclz', 'id', '근무한다'], ['emp', 'vctn', 'id', '신청한다'], ['emp', 'slry', 'id', '받는다'], ['slry', 'slryd', 'id', '포함한다'], ['emp', 'fam', 'id', '부양한다'], ['emp', 'edu', 'id', '이수한다'], ['emp', 'crtf', 'id', '보유한다']],
      views: [['pay', '급여', ['emp', 'slry', 'slryd', 'dept']], ['att', '근태 · 휴가', ['emp', 'dclz', 'vctn']]] }
  };
  // build one attribute from "이름" + marks; the type comes from the last word (분류어) of the physical name
  const erpAttr = raw => {
    const pk = raw.includes('*'), comb = raw.includes('!'), ex = raw.includes('#');
    const n = raw.replace(/[*!#]/g, ''); const ws = erpSplit(n);
    const tail = ws ? ws[ws.length - 1].split('_').pop() : null;
    const a = { n, p: ws ? ws.join('_') : '—', t: ws ? (ERP_TYPE[tail] || 'VARCHAR2(50)') : '—', dom: ws ? (ERP_DOM[tail] || '') : '', s: !ws ? 'unreg' : comb ? 'comb' : ex ? 'ex' : 'ok' };
    if (comb) { a.p = '—'; a.t = '—'; }
    if (ex) { a.p = 'BIZ_NO'; a.exReason = '외부 회계 연계 컬럼명 유지(BIZ_NO)'; }
    if (pk) { a.pk = 1; a.nn = 1; }
    const sk = Object.keys(ERP_SECRET).find(k => n.endsWith(k)); if (sk) { a.sec = '개인정보'; a.enc = ERP_SECRET[sk]; }
    return a;
  };
  const ERP_CLASS = n => n.endsWith('이력') ? 'H' : 'A';
  function buildErp() {
    const seeds = {}, meta = {}, views = {};
    const base = {};
    Object.entries(ERP).forEach(([area, d]) => d.ents.forEach(([id, n, attrs, c]) => { const ws = erpSplit(n); base[area + ':' + id] = { id, n, p: ws ? ws.join('_') : '—', c: c || ERP_CLASS(n), a: attrs.split(',').map(erpAttr) }; }));
    const order = e => { if (e.ref) return; const fkpk = e.a.filter(a => a.pk && a.fk), own = e.a.filter(a => a.pk && !a.fk), rest = e.a.filter(a => !a.pk); e.a = fkpk.concat(own, rest); };
    // relations in order; each child's keys are put in order right away so a later child copies the parent key in the parent's order
    const relate = (E, rels) => { const R = []; rels.forEach(([f, t, k, name, noFk, role], i) => {
      const p = E.find(e => e.id === f), c = E.find(e => e.id === t); if (!p || !c) return;
      const r = { f, t, k, name }; if (noFk) r.noFk = noFk; R.push(r);
      const pk = p.a.filter(a => a.pk);
      if (role) { r.g = 'g' + (i + 1); pk.forEach(k0 => c.a.push({ n: role[0] + k0.n, p: role[1] + '_' + k0.p, t: k0.t, dom: k0.dom, s: 'ok', fk: 1, fkg: r.g, pk: k === 'id' ? 1 : undefined, nn: k === 'id' ? 1 : undefined })); order(c); return; }
      if (f === t) { pk.forEach(k0 => c.a.push({ n: '상위' + k0.n, p: 'UP_' + k0.p, t: k0.t, dom: k0.dom, s: 'ok' })); return; }   // recursive without role mapping → stays 누락 (one example)
      pk.forEach(k0 => { const ex0 = c.a.find(a => a.p === k0.p && a.p !== '—' && !a.fkg); if (ex0) { ex0.fk = 1; if (k === 'id') { ex0.pk = 1; ex0.nn = 1; } return; } c.a.push({ n: k0.n, p: k0.p, t: k0.t, dom: k0.dom, s: k0.s === 'ex' ? 'ok' : k0.s, fk: 1, pk: k === 'id' ? 1 : undefined, nn: k === 'id' ? 1 : undefined }); });
      order(c);
    }); return R; };
    // a module's own entities relate first (references copy the original's keys after that)
    Object.entries(ERP).forEach(([area, d]) => { const E = d.ents.map(([id]) => base[area + ':' + id]); relate(E, d.rels.filter(([f, t]) => d.ents.some(x => x[0] === f) && d.ents.some(x => x[0] === t))); E.forEach(order); });
    Object.entries(ERP).forEach(([area, d]) => {
      const E = d.ents.map(([id]) => JSON.parse(JSON.stringify(base[area + ':' + id])));
      // rebuild FK columns of this module from scratch (the shared base above already holds the in-module ones)
      (d.refs || []).forEach(([id, from, behind]) => { const o = base[from + ':' + id]; E.push({ id, n: o.n, p: o.p, c: o.c, ref: 1, refId: id, refArea: from, refName: ERP[from].name, refVer: ERP[from].base - (behind || 0), /* behind: a sample reference still on an older confirmed copy (shows "갱신") */ a: o.a.filter(a => a.pk || /명$/.test(a.n)).slice(0, 4).map(a => Object.assign({}, a, { fk: undefined, fkg: undefined })) }); });
      const R = [];
      d.rels.forEach(([f, t, k, name, noFk, role], i) => {
        const inner = d.ents.some(x => x[0] === f) && d.ents.some(x => x[0] === t);
        const r = { f, t, k, name }; if (noFk) r.noFk = noFk;
        if (role) r.g = 'g' + (i + 1);
        if (inner) {   // FK columns already made in the shared pass — recover the role group number from the made columns
          const c = E.find(e => e.id === t); if (role) { const g = c.a.find(a => a.fkg && a.p.startsWith(role[1] + '_')); if (g) r.g = g.fkg; }
          R.push(r); return;
        }
        R.push(r); const p = E.find(e => e.id === f), c = E.find(e => e.id === t); if (!p || !c) return;
        if (role) { p.a.filter(a => a.pk).forEach(k0 => c.a.push({ n: role[0] + k0.n, p: role[1] + '_' + k0.p, t: k0.t, dom: k0.dom, s: 'ok', fk: 1, fkg: r.g, pk: k === 'id' ? 1 : undefined, nn: k === 'id' ? 1 : undefined })); order(c); return; }
        p.a.filter(a => a.pk).forEach(k0 => { const ex0 = c.a.find(a => a.p === k0.p && a.p !== '—' && !a.fkg); if (ex0) { ex0.fk = 1; if (k === 'id') { ex0.pk = 1; ex0.nn = 1; } return; } c.a.push({ n: k0.n, p: k0.p, t: k0.t, dom: k0.dom, s: k0.s === 'ex' ? 'ok' : k0.s, fk: 1, pk: k === 'id' ? 1 : undefined, nn: k === 'id' ? 1 : undefined }); });
        order(c);
      });
      E.forEach(e => e.a.forEach(a => { Object.keys(a).forEach(k => { if (a[k] === undefined) delete a[k]; }); }));
      const ord = ['K', 'M', 'A', 'H']; const own = E.filter(e => !e.ref).sort((a, b) => ord.indexOf(a.c) - ord.indexOf(b.c));
      own.forEach((e, i) => { e.x = 60 + (i % 4) * 330; e.y = 60 + Math.floor(i / 4) * 300; e.px = e.x + 20; e.py = e.y + 40; });
      E.filter(e => e.ref).forEach((e, i) => { e.x = 60 + 4 * 330; e.y = 60 + i * 200; e.px = e.x + 40; e.py = e.y + 40; });
      seeds[area] = { E, R, M: [] };
      meta[area] = { ver: d.ver, base: d.base, name: d.name, desc: d.desc, system: 'ERP', sys: '통합ERP', dbms: 'Oracle' };
      views[area] = [{ id: 'all', n: '전체' }].concat((d.views || []).map(([id, n, ents]) => ({ id, n, ents })));
    });
    return { seeds, meta, views };
  }
  const ERP_BUILT = buildErp();
  Object.assign(MODEL_SEED, ERP_BUILT.seeds);
  Object.assign(VIEWS0, ERP_BUILT.views);

  ['e_hr', 'e_tr', 'e_fi', 'e_sd', 'e_mm', 'e_wm', 'e_pp'].forEach(k => { if (ERP_BUILT.meta[k]) MODEL0[k] = ERP_BUILT.meta[k]; });
  // the address decides the system: ?system=ERP, or an area / snapshot that belongs to another system
  { const sy = qs.get('system'), ar = qs.get('area'); if (ar && getAllModels()[ar]) store.set('dbm-sys', getAllModels()[ar].system || 'RQMS'); else if (sy && SYSLIST.some(s => s.code === sy)) store.set('dbm-sys', sy); }
  // views belong to the area's model data (they follow its version and approval); seed views until the area is saved
  window.viewsOf = area => { const m = getAllModels()[area]; const d = m && getModelData(area, m.ver); return clone((d && d.V && d.V.length && d.V) || J('dbm-views-' + area, null) || VIEWS0[area] || [{ id: 'all', n: '전체' }]); };
  // a reference is stale when its source area has a newer confirmed copy than the one it points at
  window.relKey = r => `${r.f}>${r.t}>${r.g || r.name || ''}`;   // a relation's name in a view's hidden-line list (positions change, ends don't)
  window.refStale = e => { if (!e || !e.ref || !e.refArea) return 0; const m = getAllModels()[e.refArea]; return m && m.base && m.base > (e.refVer || 0) ? m.base : 0; };
  window.modelSeed = area => { const s = clone(MODEL_SEED[area] || (J('dbm-area-seed-' + area, null)) || { E: [], R: [], M: [] }); if (!s.V) s.V = clone(VIEWS0[area] || [{ id: 'all', n: '전체' }]); return s; };   // seed views travel with the seed structure (approval comparison sees them)
  /* the structure of an area+version as the screens should see it: saved working data → seed */
  window.modelOf = (area, ver) => { const d = getModelData(area, ver); return d ? clone(d) : modelSeed(area); };
  window.getComp = area => J('dbm-comp-' + area, null);
  window.setComp = (area, c) => S('dbm-comp-' + area, c);

  /* ---- upload batches (one source for counts on every screen) ---- */
  const BATCH0 = [
    { id: 'UP-2026-0007', file: '요구사항_용어_1차.xlsx', kind: '용어', by: 'kim', at: '11/16 09:12', baseline: 'BL-20261116-0905', rows: 128, sample: true, counts: { new: 112, chg: 4, same: 4, waitSame: 0, waitDiff: 0, conflict: 0, dup: 0, pre: 0, err: 4, missing: 0, pick: 4 }, docs: ['REQ-2026-0016'], status: '신청됨' },
    { id: 'UP-2026-0006', file: '기관단어_초기.xlsx', kind: '단어', by: 'kim', at: '11/14 17:40', baseline: '—(초기 적재)', rows: 86, counts: { new: 86, chg: 0, same: 0, waitSame: 0, waitDiff: 0, conflict: 0, dup: 0, pre: 0, err: 0, missing: 0, pick: 0 }, docs: ['REQ-2026-0005'], status: '반영됨' },
    { id: 'UP-2026-0005', file: '기관단어_초기.xlsx', kind: '단어', by: 'kim', at: '11/14 17:05', baseline: '—', rows: 86, counts: null, docs: [], status: '취소', note: '머리글 오류(필수 열 ‘단어명’ 없음)' }
  ];
  window.getBatches = () => J('dbm-batches', clone(BATCH0));
  window.saveBatches = b => S('dbm-batches', b);
  window.batchOf = id => getBatches().find(b => b.id === id);
  window.submitCount = c => c ? c.new + c.chg + c.pick : 0;

  /* ---- dictionary change log & publication (제정차수) ---- */
  const CHG0 = [
    { at: '2026-11-17 11:58', item: '산출물', kind: '단어', act: '추가', ver: 'V1', doc: 'REQ-2026-0007', by: '김모델', diff: '' },
    { at: '2026-11-15 09:10', item: '기관 단어 86건', kind: '단어', act: '추가', ver: 'V1', doc: 'REQ-2026-0005', by: '이현업(최종)', diff: '엑셀 초기 적재 · UP-2026-0006' },
    { at: '2026-10-02 14:20', item: '산출서', kind: '단어', act: '미사용', ver: 'V2', doc: 'REQ-2026-0001', by: '이데이터', diff: '사용상태: 사용 → 미사용 · 산출물로 통합', pub: 12 }
  ];
  window.getChanges = () => J('dbm-changes', clone(CHG0));
  window.saveChanges = c => S('dbm-changes', c);
  window.getPub = () => J('dbm-pub', { cha: 12, at: '2026-11-03 10:00', by: '이데이터', why: '공통표준 2025.11 반영' });
  window.savePub = p => S('dbm-pub', p);

  /* ---- v6: dictionary items live in the state layer (S2) ---- */
  const DICT0 = [
    { id: 'W-0102', k: 'word', kn: '단어', src: '기관', st: '사용', name: '산출물', abbr: 'DLVRBL', dom: '—', eng: 'deliverable', desc: '사업 수행 결과로 제출하는 문서·코드·모델 등', ver: 2, cha: 12, dt: '2026-11-14', use: 5, syn: ['납품물', '결과물'], forbid: ['산출서'], old: ['산출물품'],
      hist: [{ v: 'V2', at: '2026-11-14 18:00', act: '변경', doc: 'REQ-2026-0005', by: '김모델 → 이데이터(DA) → 이현업', why: '영문명 정비', diff: [['영문명', 'output', 'deliverable'], ['단어명', '산출물품', '산출물']] }, { v: 'V1', at: '2026-11-03 10:00', act: '초기 적재', doc: '—', by: '이데이터', why: '기관 단어 초기 적재', diff: [] }] },
    { id: 'W-0001', k: 'word', kn: '단어', src: '공통', st: '사용', name: '산출', abbr: 'PRDC', dom: '—', eng: 'produce', desc: '', ver: 1, cha: 3, dt: '2025-11-30', use: 2, syn: [], forbid: [], old: [], hist: [{ v: 'V1', at: '2025-11-30', act: '공통표준 적재', doc: '—', by: '시스템', why: '공통표준 2025.11', diff: [] }] },
    { id: 'W-0002', k: 'word', kn: '단어', src: '공통', st: '사용', name: '산출근거', abbr: 'CALC_BASIS', dom: '—', eng: 'calculation basis', desc: '', ver: 1, cha: 3, dt: '2025-11-30', use: 0, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0410', k: 'term', kn: '용어', src: '기관', st: '사용', name: '산출물ID', abbr: 'DLVRBL_ID', dom: 'ID V10', dg: '번호', eng: '산출물 식별자', ver: 1, cha: 12, dt: '2026-11-17', use: 2, syn: [], forbid: [], old: [], hist: [{ v: 'V1', at: '2026-11-17 11:58', act: '추가', doc: 'REQ-2026-0007', by: '김모델(자기 승인)', why: '산출물 테이블 표준화', diff: [] }] },
    { id: 'T-0411', k: 'term', kn: '용어', src: '기관', st: '사용', name: '산출물명', abbr: 'DLVRBL_NM', dom: '명V100', dg: '명칭', eng: '산출물의 이름', desc: '산출물의 이름', ver: 1, cha: 12, dt: '2026-11-17', use: 1, syn: [], forbid: [], old: [], pending: 'REQ-2026-0016', hist: [] },
    // items the excel round-trip sample rows point at (so change / unuse rows resolve to real items)
    { id: 'T-0412', k: 'term', kn: '용어', src: '기관', st: '사용', name: '요청부서명', abbr: 'REQ_DEPT_NM', dom: '명V100', dg: '명칭', eng: 'request department name', desc: '요청 부서명', ver: 2, cha: 12, dt: '2026-11-10', use: 2, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0388', k: 'term', kn: '용어', src: '기관', st: '사용', name: '요구사항상태코드', abbr: 'DEMND_MATER_STTS_CD', dom: '코드C1', dg: '코드', eng: 'requirement status code', desc: '요구사항 진행 상태', ver: 1, cha: 12, dt: '2026-11-03', use: 3, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0101', k: 'term', kn: '용어', src: '기관', st: '사용', name: '요구사항ID', abbr: 'DEMND_MATER_ID', dom: 'ID V10', dg: '번호', eng: 'requirement id', desc: '요구사항 식별자', ver: 1, cha: 12, dt: '2026-11-03', use: 6, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0425', k: 'term', kn: '용어', src: '기관', st: '사용', name: '산출물제출자명', abbr: 'DLVRBL_SBMTR_NM', dom: '명V100', dg: '명칭', eng: 'submitter name', desc: '제출자 이름', ver: 1, cha: 12, dt: '2026-11-12', use: 1, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0201', k: 'term', kn: '용어', src: '기관', st: '사용', name: '수주금액', abbr: 'WINCON_AMT', dom: '금액N15', dg: '금액·수량', eng: 'contract amount', desc: '계약 수주 금액(부가세 포함)', ver: 4, cha: 12, dt: '2026-11-16', use: 1, syn: [], forbid: [], old: [], hist: [{ v: 'V4', at: '2026-11-16 15:10', act: '변경', doc: 'REQ-2026-0008', by: '이데이터', why: '부가세 포함 명시', diff: [['설명', '수주한 금액', '계약 수주 금액(부가세 포함)']] }] },
    { id: 'T-0233', k: 'term', kn: '용어', src: '기관', st: '사용', name: '요청고객명', abbr: 'REQ_CUST_NM', dom: '명V100', dg: '명칭', eng: 'request customer name', desc: '요청 고객 이름', ver: 1, cha: 12, dt: '2026-11-03', use: 1, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0415', k: 'term', kn: '용어', src: '기관', st: '사용', name: '산출물유형코드', abbr: 'DLVRBL_TYPE_CD', dom: '코드C2', dg: '코드', eng: '산출물 유형 구분', ver: 2, cha: 12, dt: '2026-11-15', use: 1, syn: [], forbid: [], old: ['산출물구분코드'],
      hist: [{ v: 'V2', at: '2026-11-15 09:10', act: '변경', doc: 'REQ-2026-0005', by: '김모델 → 이현업', why: '구분 → 유형으로 통일', diff: [['용어명', '산출물구분코드', '산출물유형코드'], ['영문약어명', 'DLVRBL_SE_CD', 'DLVRBL_TYPE_CD']] }, { v: 'V1', at: '2026-11-03 10:00', act: '초기 적재', doc: '—', by: '이데이터', why: '', diff: [] }] },
    { id: 'T-0430', k: 'term', kn: '엔터티 용어', src: '기관', st: '신청 중', name: '산출물기본', abbr: 'DLVRBL_M', dom: '엔터티 용어', eng: '산출물 기본 정보 테이블', ver: 0, cha: null, dt: '2026-11-17', use: 1, syn: [], forbid: [], old: [], pending: 'REQ-2026-0013', hist: [] },
    { id: 'T-0021', k: 'term', kn: '용어', src: '공통', st: '사용', name: '산출근거내용', abbr: 'CALC_BASIS_CN', dom: '내용V1000', dg: '명칭', eng: '산출 근거 설명', ver: 1, cha: 3, dt: '2025-11-30', use: 0, syn: [], forbid: [], old: [], hist: [] },
    { id: 'T-0022', k: 'term', kn: '용어', src: '공통', st: '사용', name: '산출일자', abbr: 'PRDC_YMD', dom: '연월일C8', dg: '날짜', eng: '산출한 날짜', ver: 1, cha: 3, dt: '2025-11-30', use: 0, syn: [], forbid: [], old: [], hist: [] },
    { id: 'D-0031', k: 'domain', kn: '도메인', src: '기관', st: '사용', name: '코드C2', abbr: 'CD_C2', dom: '코드 · CHAR(2)', dg: '코드', eng: '2자리 코드', allow: '[A-Z]{2}', ver: 1, cha: 12, dt: '2026-11-17', use: 9, syn: [], forbid: [], old: [], pending: 'REQ-2026-0010', hist: [] },
    { id: 'D-0002', k: 'domain', kn: '도메인', src: '공통', st: '사용', name: '금액N15', abbr: 'AMT_N15', dom: '금액 · NUMERIC(15)', dg: '금액·수량', eng: '금액', ver: 1, cha: 3, dt: '2025-11-30', use: 4, syn: [], forbid: [], old: [], hist: [] },
    { id: 'W-0099', k: 'word', kn: '단어', src: '기관', st: '미사용', name: '산출서', abbr: 'CALC_DOC', dom: '—', eng: '산출물로 통합', ver: 2, cha: 12, dt: '2026-10-02', use: 0, syn: [], forbid: [], old: [], hist: [{ v: 'V2', at: '2026-10-02 14:20', act: '미사용', doc: 'REQ-2026-0001', by: '이데이터', why: '산출물로 통합', diff: [['사용상태', '사용', '미사용']] }] },
    { id: 'W-0003', k: 'word', kn: '단어', src: '공통', st: '사용', name: '산출내역', abbr: 'CALC_DTLS', dom: '—', eng: 'calculation details', ver: 1, cha: 3, dt: '2025-11-30', use: 0, syn: [], forbid: [], old: [], hist: [] },
    { id: 'C-0005', k: 'code', kn: '코드', src: '기관', st: '사용', name: '산출물유형', abbr: 'DLVRBL_TYPE', dom: '코드C2', dg: '코드', eng: '문서·코드·모델·기타', scope: '시스템', sys: 'RQMS', ctype: '자체', ver: 1, cha: 12, dt: '2026-11-17', use: 1, syn: [], forbid: [], old: [], hist: [],
      vals: [{ v: '01', nm: '문서', ord: 1, st: '사용' }, { v: '02', nm: '코드', ord: 2, st: '사용' }, { v: '03', nm: '모델', ord: 3, st: '사용' }, { v: '99', nm: '기타', ord: 4, st: '사용' }] },
    { id: 'C-0006', k: 'code', kn: '코드', src: '기관', st: '사용', name: '요구사항상태', abbr: 'DEMND_MATER_STTS', dom: '코드C1', dg: '코드', eng: '요구사항 진행 상태', scope: '공통', ctype: '자체', ver: 2, cha: 12, dt: '2026-11-10', use: 3, syn: [], forbid: [], old: [], hist: [],
      vals: [{ v: 'R', nm: '접수', ord: 1, st: '사용' }, { v: 'A', nm: '분석', ord: 2, st: '사용' }, { v: 'D', nm: '개발', ord: 3, st: '사용' }, { v: 'C', nm: '완료', ord: 4, st: '사용' }, { v: 'X', nm: '취소', ord: 5, st: '미사용' }] },
    { id: 'W-0210', k: 'word', kn: '단어', src: '공통', st: '사용', name: '수신자', abbr: 'RCVR', dom: '—', eng: 'receiver', ver: 1, cha: 3, dt: '2025-11-30', use: 3, syn: ['수취인'], forbid: ['수령인'], old: [], hist: [] },
    // V0 (삭제 보관) samples: one still referenced (permanent delete blocked), one free to purge
    { id: 'W-0097', k: 'word', kn: '단어', src: '기관', st: '삭제 보관', name: '산출근거문서', abbr: 'CALC_BSDC', dom: '—', eng: '산출근거로 통합', ver: 3, cha: 12, dt: '2026-11-05', use: 0, syn: [], forbid: [], old: [], delDoc: 'REQ-2026-0001', hist: [{ v: 'V0', at: '2026-11-05 10:00', act: '삭제 보관', doc: 'REQ-2026-0001', by: '이데이터', why: '산출근거로 통합', diff: [] }] },
    { id: 'W-0096', k: 'word', kn: '단어', src: '기관', st: '삭제 보관', name: '결과물품', abbr: 'RSLT_GDS', dom: '—', eng: '결과물로 통합', ver: 2, cha: 12, dt: '2026-11-05', use: 1, syn: [], forbid: [], old: [], delDoc: 'REQ-2026-0001', hist: [{ v: 'V0', at: '2026-11-05 10:00', act: '삭제 보관', doc: 'REQ-2026-0001', by: '이데이터', why: '결과물로 통합', diff: [] }] },
    { id: 'W-0211', k: 'word', kn: '단어', src: '공통', st: '사용', name: '검사', abbr: 'INSP', dom: '—', eng: 'inspection', ver: 1, cha: 3, dt: '2025-11-30', use: 6, syn: [], forbid: [], old: [], hist: [] }
  ];
  // the 59 행정표준코드 (common codes) join the dictionary once — also into a dictionary already saved by an older mockup version
  window.getDict = () => { const d = J('dbm-dict', clone(DICT0)); const sc = window.STD_CODES || [];
    if (sc.length && !d.some(x => x.id === sc[0].id)) { d.push(...clone(sc)); try { localStorage.setItem('dbm-dict', JSON.stringify(d)); } catch (e) {} } return d; };
  window.getCommonVer = () => J('dbm-common-ver', { ver: '2025.11', at: '2025-11-30', words: 3284, terms: 13176, domains: 129, codes: (window.STD_CODES || []).length, doc: '—' });
  window.saveCommonVer = v => S('dbm-common-ver', v);
  window.saveDict = d => S('dbm-dict', d);
  const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  /* ---- v7: dictionary apply is exact (S2) ----
     item operation is explicit: 추가 (new) · 변경 (existing id) · 미사용 (existing id).
     A change applies the changed FIELDS (not just the version); a missing target is a failure, never a new item. */
  const KIND_NAME = { word: '단어', term: '용어', domain: '도메인', code: '코드', entity: '엔터티 용어', class: '도메인분류' };
  window.KIND_NAME = KIND_NAME;
  const FIELD = { 단어명: 'name', 용어명: 'name', 도메인명: 'name', 코드명: 'name', 엔터티명: 'name', 이름: 'name', 영문약어명: 'abbr', 약어: 'abbr', 도메인: 'dom', 설명: 'desc', 영문명: 'eng', '허용 값': 'allow', 사용상태: 'st', 이음동의어: 'syn', 금칙어: 'forbid', 도메인그룹: 'dg', 코드값: 'vals', '적용 범위': 'scope', 형식단어: 'fmt', '보안 속성': 'sec', '물리 타입': 'dom', '대상 시스템': 'sys' };
  window.FIELD_KEY = FIELD;
  // editable fields per kind (DX-01 · G5: names too — the old name is kept as a past name; a domain's type/length is its name)
  window.EDIT_FIELDS = { word: ['단어명', '영문약어명', '영문명', '형식단어', '적용 범위', '설명', '이음동의어', '금칙어'], term: ['용어명', '영문약어명', '도메인', '영문명', '적용 범위', '설명'], entity: ['엔터티명', '영문약어명', '영문명', '적용 범위', '설명'], domain: ['도메인명', '물리 타입', '허용 값', '도메인그룹', '보안 속성', '적용 범위', '설명'], code: ['코드명', '영문명', '설명', '적용 범위', '대상 시스템', '코드값'] };
  /* decision Q3: one agency dictionary; each item says where it applies — '기관 공통' or a system code (SYSLIST) */
  window.SCOPES = () => [['공통', '기관 공통']].concat(SYSLIST.map(s => [s.code, s.name]));
  window.scopeName = v => !v || v === '공통' || v === '기관 공통' ? '기관 공통' : (SYSLIST.find(s => s.code === v || s.name === v) || {}).name || v;
  /* decision Q1: a word's new name / abbreviation travels to every term (and entity term) built from it — added to the SAME request as change rows */
  window.wordCascade = (d, chg) => {
    if (!d || d.k !== 'word' || !chg) return [];
    const nn = chg['단어명'] ? String(chg['단어명'][1]).trim() : d.name, na = chg['영문약어명'] ? String(chg['영문약어명'][1]).trim() : d.abbr;
    if (nn === d.name && na === d.abbr) return [];
    return getDict().filter(x => x.k === 'term' && x.ver > 0 && x.st !== '삭제 보관' && x.src !== '공통').map(t => {
      const ent = t.kn === '엔터티 용어', head = ent ? t.name.replace(/(기본|내역|이력|관계|정보)$/, '') : t.name, dc = decompose(head);
      if (!dc.parts.some(p => p.w === d.name)) return null;
      const name = dc.parts.map(p => p.w === d.name ? nn : p.w).join('') + (ent ? t.name.slice(head.length) : '');
      const parts = t.abbr.split('_'), i = dc.parts.findIndex(p => p.w === d.name);
      const abbr = parts.length >= dc.parts.length ? parts.map((p, j) => (j === i && p === d.abbr) ? na : p).join('_') : t.abbr.split(d.abbr).join(na);
      const c = {}; if (name !== t.name) c[ent ? '엔터티명' : '용어명'] = [t.name, name]; if (abbr !== t.abbr) c['영문약어명'] = [t.abbr, abbr];
      return Object.keys(c).length ? { k: ent ? 'entity' : 'term', id: t.id, name: t.name, act: '변경', chg: c, auto: d.id, from: `단어 ‘${d.name}’ 변경에 따름` } : null;
    }).filter(Boolean);
  };
  const opOf = it => it.act === '미사용' ? '미사용' : it.act === '삭제' ? '삭제' : (it.id && it.act !== '추가') ? '변경' : '추가';
  window.opOf = opOf;

  /* ---- DX-02·03·17: the request basket — one per user, kept across pages and reloads (a server draft in the product) ----
     the dictionary list, the detail panel, the model's dictionary panel and the excel import all add to it; the request panel submits it */
  const bKey = () => 'dbm-basket-' + (window.ME ? ME.id : 'kim');
  window.getBasket = () => J(bKey(), { items: [], reason: '', at: '' });
  window.saveBasket = b => { b.at = today() + ' ' + now().split(' ')[1]; S(bKey(), b); if (window.refreshTop) window.refreshTop(); document.dispatchEvent(new CustomEvent('basket')); };
  // add items; an item already in the basket (same id, or same kind + name for new ones) is skipped — returns [added, skipped]
  // two changes of the same item merge field by field (the later value wins); a different action on the same item is skipped and reported
  window.addToBasket = list => { const b = getBasket(); let a = 0, s = 0, m = 0;
    [].concat(list).forEach(it => { const same = b.items.find(x => (it.id && x.id === it.id) || (!it.id && !x.id && x.k === it.k && x.name === it.name));
      if (same && it.id && opOf(same) === '변경' && opOf(it) === '변경') { same.chg = Object.assign({}, same.chg, it.chg); if (!it.auto) delete same.auto; m++; return; }
      if (same) { s++; return; } b.items.push(Object.assign({ key: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }, it)); a++; });
    syncCascade(b); saveBasket(b); const r = [a + m, s]; r.merged = m; return r; };
  // decision Q1: keep the automatic term rows in step with the word rows of a basket (added, updated, or dropped with their word)
  window.syncCascade = b => {
    const words = b.items.filter(x => x.k === 'word' && opOf(x) === '변경' && x.chg && (x.chg['단어명'] || x.chg['영문약어명']));
    b.items = b.items.filter(x => !x.auto || words.some(w => w.id === x.auto));   // the word row is gone → its automatic rows go too
    words.forEach(w => { const d = getDict().find(x => x.id === w.id); wordCascade(d, w.chg).forEach(t => {
      const ex = b.items.find(x => x.id === t.id);
      if (!ex) b.items.push(Object.assign({ key: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }, t));
      else if (ex.auto === w.id) ex.chg = t.chg;   // a row the user edited by hand (no auto) is left alone
    }); });
    return b; };
  /* ---- domain groups → classes (→ domains): groups are kept by the DA directly (recorded), classes go through the same request as domains (30 MD-02·03) ---- */
  const GROUPS0 = { groups: [
      { id: 'G1', name: '날짜', desc: '연월일 · 연월 · 일시 등 날짜와 시각', st: '사용', src: '공통' }, { id: 'G2', name: '번호', desc: '식별자 · 번호 · 일련번호', st: '사용', src: '공통' },
      { id: 'G3', name: '명칭', desc: '이름 · 명 · 내용 등 문자 서술', st: '사용', src: '공통' }, { id: 'G4', name: '코드', desc: '코드 · 여부 · 구분 등 정해진 값', st: '사용', src: '기관' },
      { id: 'G5', name: '금액·수량', desc: '금액 · 수량 · 율 등 숫자', st: '사용', src: '기관' }],
    classes: [
      { id: 'K01', name: '연월일', group: 'G1', fw: '일자', st: '사용', src: '공통' }, { id: 'K02', name: '일시', group: 'G1', fw: '일시', st: '사용', src: '공통' },
      { id: 'K03', name: 'ID', group: 'G2', fw: 'ID', st: '사용', src: '공통' }, { id: 'K04', name: '번호', group: 'G2', fw: '번호', st: '사용', src: '공통' }, { id: 'K05', name: '일련번호', group: 'G2', fw: '순번', st: '사용', src: '공통' },
      { id: 'K06', name: '명', group: 'G3', fw: '명', st: '사용', src: '공통' }, { id: 'K07', name: '내용', group: 'G3', fw: '내용', st: '사용', src: '공통' },
      { id: 'K08', name: '코드', group: 'G4', fw: '코드', st: '사용', src: '기관' }, { id: 'K09', name: '여부', group: 'G4', fw: '여부', st: '사용', src: '기관' }, { id: 'K10', name: '구분', group: 'G4', fw: '구분', st: '사용', src: '기관' },
      { id: 'K11', name: '금액', group: 'G5', fw: '금액', st: '사용', src: '기관' }, { id: 'K12', name: '수량', group: 'G5', fw: '수량', st: '사용', src: '기관' }],
    log: [{ at: '2026-11-03 10:00', who: '이데이터', act: '그룹 추가', target: '금액·수량', why: '기관 사전 초기 구성' }] };
  window.getGroups = () => J('dbm-groups', clone(GROUPS0));
  window.saveGroups = g => S('dbm-groups', g);
  // format words: the last word of a class decides which domains a term may use (형식단어 → 도메인분류)
  window.formatWords = () => { const g = getGroups(); return [...new Set(g.classes.filter(c => c.st === '사용').map(c => c.fw).concat(getDict().filter(x => x.k === 'word' && x.fmt === 'Y' && x.ver > 0 && x.st === '사용').map(x => x.name)))]; };
  window.classOfFw = fw => getGroups().classes.find(c => c.fw === fw && c.st === '사용');
  /* ---- one item check for every screen (form, screen grid, excel, submit): problems = [{f: field, msg, lvl: 'block' | 'warn'}] ----
     ctx.batch = the other rows being written together (a new word in the same batch is a known word) */
  window.checkItem = (it, ctx = {}) => {
    const out = [], dict = getDict(), batch = (ctx.batch || []).filter(b => b !== it), pol = getPolicy(), B = (f, msg) => out.push({ f, msg, lvl: 'block' }), Wn = (f, msg) => out.push({ f, msg, lvl: 'warn' });
    const name = (it.name || '').trim(), k = it.k, live = x => x.ver > 0 && x.st !== '삭제 보관' && x.id !== ctx.self;   // ctx.self: a change is checked against everyone but itself
    const openNew = openItems().filter(x => opOf(x.it) === '추가');
    if (!name) { B('name', '이름이 비어 있음'); return out; }
    if (/\s/.test(name) && k !== 'class') B('name', '이름에 공백이 있음');
    const sameKind = x => x.k === k || (k === 'entity' && x.k === 'term');
    if (dict.some(x => sameKind(x) && x.name === name && live(x))) B('name', `같은 이름이 사전에 있음(${dict.find(x => sameKind(x) && x.name === name && live(x)).id}) — 변경으로`);
    else if (openNew.some(x => x.it.name === name && (!x.it.k || x.it.k === k))) B('name', `${openNew.find(x => x.it.name === name).doc}에서 같은 이름을 신청 중`);
    if (batch.some(b => b.k === k && (b.name || '').trim() === name)) B('name', '같이 작성 중인 행과 이름이 겹침');
    const forb = dict.find(x => x.k === 'word' && (x.forbid || []).includes(name)); if (forb) B('name', `금칙어 — '${forb.name}'을(를) 쓰세요`);
    const abbr = (it.abbr || '').trim();
    if (k === 'word') {
      const lim = pol.wordAbbr || 6;
      if (!abbr) B('abbr', '영문약어명이 비어 있음');
      else { if (!/^[A-Z][A-Z0-9]*$/.test(abbr)) B('abbr', '영문약어명은 대문자 · 숫자, 숫자로 시작 불가'); if (abbr.length > lim) B('abbr', `영문약어명 ${lim}자 초과(검수 기준 v${pol.ver})`);
        const same = dict.find(x => x.k === 'word' && x.abbr === abbr && x.name !== name && live(x)) || batch.find(b => b.k === 'word' && b.abbr === abbr && b.name !== name);
        if (same) B('abbr', `약어 ${abbr}를 '${same.name}'이(가) 씀`);
        else { const sim = dict.find(x => x.k === 'word' && live(x) && x.abbr !== abbr && abbr.length >= 3 && (x.abbr.startsWith(abbr.slice(0, 4)) || abbr.startsWith(x.abbr.slice(0, 4)))); if (sim) Wn('abbr', `비슷한 약어 ${sim.name} ${sim.abbr} — 다르면 중복 허용 사유`); } }
      if (it.fmt === 'Y' && !it.cls && !classOfFw(name)) Wn('fmt', '형식단어 — 연결할 도메인분류를 고르면 도메인 등록 때 바로 씁니다');
      [...(it.syn || []), ...(it.forbid || [])].forEach(s => { if (dict.some(x => x.k === 'word' && live(x) && (x.name === s || (x.syn || []).includes(s) || (x.forbid || []).includes(s)))) B('syn', `동의어 · 금칙어 '${s}'가 다른 단어와 겹침`); });
    }
    if (k === 'term' || k === 'entity') {
      const dc = decompose(k === 'entity' ? name.replace(/(기본|내역|이력|관계|정보)$/, '') : name, batch.filter(b => b.k === 'word'));
      const unk = dc.parts.filter(p => p.unknown).map(p => p.w), pend = dc.parts.filter(p => !p.unknown && !p.ok && !batch.some(b => b.k === 'word' && b.name === p.w)).map(p => p.w);
      if (unk.length) B('name', `미등록 단어: ${unk.join(', ')} — 단어를 같이 작성하세요`);
      if (pend.length) Wn('name', `승인 전 단어: ${pend.join(', ')}`);
      if (dc.sus) Wn('name', '1음절 분해 의심 — 단어 구성을 확인하세요');
      const want = dc.parts.map(p => p.abbr || '?').join('_') + (k === 'entity' ? (({ 기본: '_M', 내역: '_D', 이력: '_H', 관계: '_R', 정보: '_I' })[(name.match(/(기본|내역|이력|관계|정보)$/) || [])[1]] || '') : '');
      if (abbr && !unk.length && abbr !== want) B('abbr', `영문약어명은 단어 약어 조합 ${want}여야 함`);
      if (abbr.length > 30) B('abbr', `영문약어명 ${abbr.length}자 — 30자 초과(대상 DBMS)`);
      if (k === 'term') { const dom = (it.dom || '').trim(); if (!dom) B('dom', '도메인이 비어 있음'); else if (!knownDomains().has(dom) && !batch.some(b => b.k === 'domain' && b.name === dom)) B('dom', `도메인 '${dom}'이 사전에 없음`);
        const last = dc.parts.slice(-1)[0], fws = formatWords().concat(batch.filter(b => b.k === 'word' && b.fmt === 'Y').map(b => b.name)); if (last && !fws.includes(last.w)) Wn('name', `형식단어로 끝나지 않음(끝 단어 '${last.w}')`);
        else if (last && dom) { const c = classOfFw(last.w); if (c && !dom.startsWith(c.name) && !dom.startsWith(last.w)) Wn('dom', `끝 단어 '${last.w}'의 분류는 '${c.name}' — 도메인 ${dom}과 다름`); } }
      if (k === 'entity' && !/(기본|내역|이력|관계|정보)$/.test(name)) Wn('name', '엔터티 분류어(기본 · 내역 · 이력 · 관계 · 정보)로 끝나지 않음');
    }
    if (k === 'domain') {
      const m = name.match(/^(.+?)([CVNDT])(\d*)(?:,(\d+))?$/);
      if (!m) B('name', '도메인명은 분류명 + 타입(C/V/N/D/T) + 길이[,소수점] — 예: 금액N15, 금액N18,2');
      else { const [, cls, ty, len, sc] = m; if ('CVN'.includes(ty) && !len) B('name', `${ty} 타입은 길이가 필요`); if (sc && ty !== 'N') B('name', '소수점은 N 타입만'); if ('DT'.includes(ty) && len) B('name', `${ty} 타입은 길이를 쓰지 않음`);
        const c = getGroups().classes.find(x => x.name === cls && x.st === '사용') || batch.find(b => b.k === 'class' && b.name === cls);
        if (!c) B('name', `도메인분류 '${cls}'가 없음 — 분류를 같이 작성하세요`);
        else if (it.dg && c.group && getGroups().groups.find(g => g.id === c.group) && getGroups().groups.find(g => g.id === c.group).name !== it.dg) B('dg', `분류 '${cls}'의 그룹은 '${getGroups().groups.find(g => g.id === c.group).name}'`); }
    }
    if (k === 'class') {
      if (getGroups().classes.some(x => x.name === name && x.st === '사용')) B('name', '같은 이름의 분류가 있음');
      if (!it.fw) B('fw', '연결 형식단어가 비어 있음'); else if (!formatWords().includes(it.fw) && !batch.some(b => b.k === 'word' && b.name === it.fw && b.fmt === 'Y')) B('fw', `'${it.fw}'은 형식단어가 아님`);
      if (!it.group || !getGroups().groups.some(g => g.id === it.group && g.st === '사용')) B('group', '도메인그룹을 고르세요');
    }
    if (k === 'code') {
      const vals = it.vals || [], len = +(String(it.dom || '').match(/\d+$/) || [0])[0];
      if (!abbr) B('abbr', '영문 코드명이 비어 있음');
      if (!vals.length) B('vals', '코드값이 없음');
      const dup = vals.map(v => v.v).filter((v, i, a) => a.indexOf(v) !== i); if (dup.length) B('vals', `코드값 중복: ${[...new Set(dup)].join(', ')}`);
      if (len) { const bad = vals.filter(v => String(v.v).length !== len); if (bad.length) B('vals', `도메인 ${it.dom} 길이 ${len}과 다른 값: ${bad.map(v => v.v).join(', ')}`); }
      if (it.scope === '시스템' && !it.sys) B('scope', '시스템 코드인데 대상 시스템이 없음');
    }
    return out;
  };
  // the item as it would be after a change (labels → fields; list fields from comma text)
  window.mergedOf = (d, it) => { const m = JSON.parse(JSON.stringify(d)); Object.entries(it.chg || {}).forEach(([l, v]) => { const key = FIELD[l] || l; m[key] = Array.isArray(d[key]) && typeof v[1] === 'string' ? v[1].split(/\s*,\s*/).filter(Boolean) : v[1]; }); return m; };
  /* one usage lookup for the detail panel, delete checks and rename warnings: columns of saved working models that carry the item (by name or abbreviation part) + the seeded count */
  window.usageOf = d => { const hits = []; if (!d) return { n: 0, hits }; try { const ms = getModels(); Object.keys(ms).forEach(a => { const md = modelOf(a, ms[a].ver); (md.E || []).forEach(e => (e.a || []).forEach(x => {
      const byName = x.n === d.name, byAbbr = d.k !== 'domain' && d.abbr && d.abbr !== '—' && x.p && (x.p === d.abbr || (d.k === 'word' && x.p.split('_').includes(d.abbr))), byDom = d.k === 'domain' && x.dom === d.name;
      if (byName || byAbbr || byDom) hits.push([a, ms[a].name, e, x]); })); }); } catch (e) {}
    return { n: Math.max(hits.length, d.use || 0), hits, seed: d.use || 0 }; };
  /* named drafts: park a basket, start another, come back later (DX-03) */
  const dKey = () => 'dbm-drafts-' + (window.ME ? ME.id : 'kim');
  window.getDrafts = () => J(dKey(), [{ id: 'dr1', name: '리스크 영역 용어 정리(작성 중)', at: '2026-11-18 17:40', reason: '리스크 관리 화면 개편', items: [{ key: 'bs1', k: 'term', name: '리스크대응완료일자', abbr: 'RISK_RSPNS_CMPTN_YMD', dom: '연월일C8', act: '추가' }, { key: 'bs2', k: 'word', name: '완화', abbr: 'MTGT', eng: 'mitigation', act: '추가' }] }]);
  window.saveDrafts = d => S(dKey(), d);
  /* DX-09: dependency order inside one request — new words, then domains, then terms / entity terms / codes; a term that uses a word added in the same request says so */
  window.orderItems = items => { const rank = it => opOf(it) !== '추가' ? 4 : ({ word: 0, class: 0.5, domain: 1, term: 2, entity: 2, code: 3 })[it.k] ?? 2;
    const out = items.slice().sort((a, b) => rank(a) - rank(b));
    out.forEach(it => { delete it.dep; if (opOf(it) === '추가' && (it.k === 'term' || it.k === 'entity')) { const ws = decompose(it.name, out.filter(o => o.k === 'word' && opOf(o) === '추가')).parts.map(p => p.w); const dep = out.filter(o => o !== it && o.k === 'word' && opOf(o) === '추가' && ws.includes(o.name)).map(o => o.name);
      const dd = out.find(o => o.k === 'domain' && opOf(o) === '추가' && o.name === it.dom); if (dd) dep.push(dd.name); if (dep.length) it.dep = dep; } });
    return out; };
  const kindOf = it => it.k && it.k !== 'chg' ? it.k : null;
  /* items currently in an open (DA/final) document — used for duplicate checks before a doc exists in the dictionary */
  window.openItems = (exceptDoc) => getDocs().filter(d => d.type === 'dict' && ['da', 'final'].includes(d.step) && d.id !== exceptDoc).flatMap(d => (d.items || []).filter(it => !it.rej).map(it => ({ doc: d.id, it })));   // an item the approver rejected (DX-12) went back to the basket and no longer blocks a new request
  /* checkDictDoc: the same judgement for the approval screen's check tab, the final-approval re-check, and submit */
  window.checkDictDoc = doc => {
    const dict = getDict(), out = [];
    const open = openItems(doc.id);
    (doc.items || []).forEach(it => {
      const op = opOf(it), k = kindOf(it), name = (it.name || '').trim();
      const res = { name: name || '(이름 없음)', op, problems: [] };
      if (!name) res.problems.push('이름이 비어 있음');
      // shared business rules — the same set the excel validation and the dictionary form use (CL12-26)
      const forbid = dict.find(x => x.k === 'word' && (x.forbid || []).some(f => f && name.includes(f)));
      if (forbid && op !== '미사용') res.problems.push(`금칙어 '${forbid.forbid.find(f => name.includes(f))}' 포함 — '${forbid.name}' 사용`);
      if (it.rej) { res.problems = []; res.skip = '항목 반려'; out.push(res); return; }   // DX-12: a rejected item is no longer judged
      // the shared item check (same rules as the form, the screen grid and the excel validation); the rest below adds doc-level checks
      if (op === '추가') checkItem(Object.assign({}, it, { k: k || it.k }), { batch: (doc.items || []).filter(o => o !== it && !o.rej && opOf(o) === '추가') }).filter(p => p.lvl === 'block' && !/신청 중|사전에 있음/.test(p.msg)).forEach(p => res.problems.push(p.msg));
      if (op === '추가' && k === 'code') {
        const vals = it.vals || [], len = +(String(it.dom || '').match(/\d+$/) || [0])[0];
        if (!vals.length) res.problems.push('코드값이 없음');
        const dup = vals.map(v => v.v).filter((v, i, a) => a.indexOf(v) !== i); if (dup.length) res.problems.push(`코드값 중복: ${[...new Set(dup)].join(', ')}`);
        if (len) { const bad = vals.filter(v => String(v.v).length !== len); if (bad.length) res.problems.push(`도메인 ${it.dom} 길이 ${len}과 다른 코드값: ${bad.map(v => v.v).join(', ')}`); }
        if (it.scope === '시스템' && !it.sys) res.problems.push('시스템 코드인데 대상 시스템이 없음');
      }
      if (op === '추가' && (k === 'term' || k === 'entity')) {
        if (it.dom && !knownDomains().has(it.dom) && !(doc.items || []).some(o => o.k === 'domain' && o.name === it.dom && !o.rej && opOf(o) === '추가')) res.problems.push(`도메인 '${it.dom}'이 사전에 없음`);
        if ((it.abbr || '').length > 30) res.problems.push(`영문약어명 ${it.abbr.length}자 — 30자 초과(대상 DBMS 기준)`);
        { const dc = decompose(name, (doc.items || []).filter(o => o.k === 'word' && !o.rej && opOf(o) === '추가')); const inDoc = w => (doc.items || []).some(o => o.k === 'word' && o.name === w && !o.rej);
          const pend = dc.pending.filter(p => !inDoc(p.w)); if (pend.length) res.problems.push(`구성 단어 미승인: ${pend.map(p => p.w + (p.doc ? `(${p.doc} 진행 중)` : '')).join(', ')}`);
          /* unknown words and the abbreviation rule come from checkItem above */ }
      }
      if (op === '추가') {
        if (k === 'word' && !(it.abbr || '').trim()) res.problems.push('영문약어명이 비어 있음');
        { const lim = (window.getPolicy ? getPolicy().wordAbbr : 0) || 6; if (k === 'word' && (it.abbr || '').length > lim) res.problems.push(`단어 영문약어명 ${lim}자 초과(검수 기준)`); }
        const same = dict.find(x => x.name === name && (!k || x.k === k) && x.ver > 0);
        if (same) res.problems.push(`같은 이름의 ${same.kn}이 이미 있음(${same.id} · ${same.src}) — 변경 신청으로`);
        const o = open.find(x => x.it.name === name && (!x.it.k || !k || x.it.k === k) && opOf(x.it) === '추가');
        if (o) res.problems.push(`${o.doc}에서 같은 이름을 신청 중`);
      } else if (k === 'class') {
        // decision Q7: a class change / unuse goes through the request; unuse is blocked while a domain uses the class
        const g = getGroups(), c = g.classes.find(x => x.id === it.id);
        if (!c) res.problems.push(`대상 분류 ${it.id}가 없음`);
        else { if (c.src === '공통' && doc.kind !== 'common') res.problems.push('공통 분류는 기관에서 바꿀 수 없음');
          const doms = [...knownDomains()].filter(n => new RegExp('^' + c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s?[CVNDT]\\d*(,\\d+)?$').test(n));   // 'ID V10' (a space in older names) counts too
          if (op === '미사용' && doms.length) res.problems.push(`도메인 ${doms.length}개(${doms.slice(0, 3).join(', ')})가 쓰는 분류 — 미사용으로 바꿀 수 없음`);
          const nn = it.chg && it.chg['분류명']; if (nn && doms.length) res.problems.push('도메인이 쓰는 분류는 이름을 바꿀 수 없음(도메인명이 분류명으로 시작)');
          const fw = it.chg && it.chg['연결 형식단어']; if (fw && !formatWords().includes(String(fw[1])) && !(doc.items || []).some(o => o.k === 'word' && o.name === fw[1] && o.fmt === 'Y')) res.problems.push(`'${fw[1]}'은 형식단어가 아님`);
          const gr = it.chg && it.chg['도메인그룹']; if (gr && !g.groups.some(x => x.id === gr[1] && x.st === '사용')) res.problems.push('사용 중인 도메인그룹을 고르세요'); }
      } else {
        const d = dict.find(x => x.id === it.id);
        if (!d) res.problems.push(`대상 항목 ${it.id}가 사전에 없음`);
        else {
          if (d.src === '공통' && doc.kind !== 'common') res.problems.push('공통 표준은 기관에서 바꿀 수 없음(공통표준 새 판은 공통표준 관리에서 품의)');
          if (d.pending && d.pending !== doc.id && getDocs().some(x => x.id === d.pending && ['da', 'final'].includes(x.step))) res.problems.push(`${d.pending}에서 같은 항목을 신청 중`);
          if (op === '변경' && !Object.keys(it.chg || {}).length && !Object.keys(it.set || {}).length) res.problems.push('바뀌는 칸이 없음');
          if (op === '미사용' && d.st === '미사용') res.problems.push('이미 미사용');
          if (op === '삭제') { const u = usageOf(d).n; if (u > 0) res.problems.push(`모델 ${u}곳에서 쓰는 중 — 삭제할 수 없음(미사용을 쓰세요)`); }
          if (op === '삭제' && d.k === 'domain' && dict.some(x => x.k === 'term' && x.dom === d.name && x.ver > 0 && x.st !== '삭제 보관')) res.problems.push('이 도메인을 쓰는 용어가 있어 삭제할 수 없음');
          if (op === '삭제' && d.st === '삭제 보관') res.problems.push('이미 삭제 보관');
          // G5: a renamed item must not collide; a domain rename re-checks the naming rule
          const nn = it.chg && Object.entries(it.chg).find(([l]) => FIELD[l] === 'name');
          if (op === '변경' && nn) { const nv = String(nn[1][1]).trim(); if (dict.some(x => x.id !== d.id && x.k === d.k && x.name === nv && x.ver > 0)) res.problems.push(`새 이름 '${nv}'이 이미 있음`); }
          // the FINAL values of a change pass the same item rules as a new item (only for the fields that change; the item itself is excluded from duplicate checks)
          if (op === '변경' && it.chg) { const merged = mergedOf(d, it), kk = d.kn === '엔터티 용어' ? 'entity' : d.k, fields = Object.keys(it.chg).map(l => FIELD[l] || l);
            // only problems the change INTRODUCES: a rule the stored item already broke (legacy abbreviation) is not blamed on this change
            const sig = p => p.f + '|' + p.msg.replace(/[A-Z0-9_]+/g, '#'), batchO = (doc.items || []).filter(o => o !== it && !o.rej);
            const before = new Set(checkItem(Object.assign({}, d, { k: kk }), { self: d.id }).filter(p => p.lvl === 'block').map(sig));
            checkItem(Object.assign({}, merged, { k: kk }), { self: d.id, batch: batchO }).filter(p => p.lvl === 'block' && fields.includes(p.f) && !before.has(sig(p))).forEach(p => res.problems.push(p.msg)); }
        }
      }
      res.problems = [...new Set(res.problems)];
      out.push(res);
    });
    return out;
  };
  window.applyDictDoc = doc => {
    const dict = getDict(), ch = getChanges(), at = today() + ' ' + now().split(' ')[1];
    const items = doc.items || [], applied = [], failed = [];
    items.forEach(it => {
      if (it.rej) return;   // DX-12: items the approver rejected are not applied (they went back to the requester's basket)
      const op = opOf(it), k0 = kindOf(it) || 'term', k = k0 === 'entity' ? 'term' : k0;
      if (k0 === 'class' && op === '추가') {   // G3: a domain class lives in the group store (it travels with the domain request)
        const g = getGroups(); if (g.classes.some(c => c.name === it.name && c.st === '사용')) { failed.push([it.name, '같은 분류가 이미 있음']); return; }
        const id = 'K' + String(g.classes.length + 1).padStart(2, '0') + Date.now().toString(36).slice(-2); g.classes.push({ id, name: it.name, group: it.group, fw: it.fw, desc: it.desc || '', st: '사용', src: '기관', doc: doc.id, why: it.why || '' }); saveGroups(g);
        ch.unshift({ at, item: it.name, kind: '도메인분류', act: '추가', ver: 'V1', doc: doc.id, by: ME.name, diff: `그룹 ${(g.groups.find(x => x.id === it.group) || {}).name || it.group} · 형식단어 ${it.fw}`, itemId: id, firstVer: true });
        applied.push(id); return;
      }
      if (k0 === 'class') {   // decision Q7: class change (분류명 · 연결 형식단어 · 도메인그룹 · 설명) / unuse through the request
        const g = getGroups(), c = g.classes.find(x => x.id === it.id); if (!c) { failed.push([it.name, `대상 분류 ${it.id} 없음`]); return; }
        const CF = { 분류명: 'name', '연결 형식단어': 'fw', 도메인그룹: 'group', 설명: 'desc' }, diff = [];
        if (op === '미사용') { diff.push(['사용상태', c.st, '미사용']); c.st = '미사용'; }
        else Object.entries(it.chg || {}).forEach(([l, v]) => { const key = CF[l] || l; diff.push([l, c[key] == null ? '' : c[key], v[1]]); c[key] = v[1]; });
        c.ver = (c.ver || 1) + 1; c.doc = doc.id; (c.hist = c.hist || []).unshift({ v: 'V' + c.ver, at, act: op, doc: doc.id, by: ME.name, why: it.why || doc.reason, diff }); saveGroups(g);
        ch.unshift({ at, item: c.name, kind: '도메인분류', act: op, ver: 'V' + c.ver, doc: doc.id, by: ME.name, diff: diff.map(x => `${x[0]}: ${x[1] || '(빈 값)'} → ${x[2]}`).join(' · '), fields: diff, itemId: c.id });
        applied.push(c.id); return;
      }
      let d = it.id ? dict.find(x => x.id === it.id) : null;
      let diff = [], act = op;
      if (op === '삭제') {
        if (!d) { failed.push([it.name, `대상 ${it.id} 없음`]); return; }
        diff = [['사용상태', d.st, '삭제 보관']]; d.st = '삭제 보관'; d.delDoc = doc.id; act = '삭제 보관';
        d.dt = today(); if (d.pending === doc.id) delete d.pending;
        d.hist = d.hist || []; d.hist.unshift({ v: 'V0', at, act, doc: doc.id, by: ME.name, why: it.why || doc.reason, diff });
        ch.unshift({ at, item: d.name, kind: d.kn, act, ver: 'V0', doc: doc.id, by: ME.name, diff: '사용상태 → 삭제 보관', fields: diff, itemId: d.id });
        applied.push(d.id); return;
      }
      if (op === '미사용') {
        if (!d) { failed.push([it.name, `대상 ${it.id} 없음`]); return; }
        diff = [['사용상태', d.st, '미사용']]; d.st = '미사용'; d.ver += 1;
      } else if (op === '변경') {
        if (!d) { failed.push([it.name, `대상 ${it.id} 없음`]); return; }
        const show = x => Array.isArray(x) ? x.map(y => typeof y === 'object' ? `${y.v} ${y.nm}${y.st === '미사용' ? '(미사용)' : ''}` : y).join(', ') : x == null ? '' : x;
        Object.entries(it.chg || {}).forEach(([label, v]) => { const key = FIELD[label] || label; const nv = Array.isArray(d[key]) && typeof v[1] === 'string' ? v[1].split(/\s*,\s*/).filter(Boolean) : v[1];
          diff.push([label, show(d[key]), show(nv)]); d[key] = nv; });
        Object.entries(it.set || {}).forEach(([key, v]) => { if (diff.some(x => (FIELD[x[0]] || x[0]) === key)) return; diff.push([key, d[key] == null ? '' : d[key], v]); d[key] = v; });
        { const nd = diff.find(x => FIELD[x[0]] === 'name'); if (nd && nd[1]) d.old = (d.old || []).concat([nd[1]]);   // the previous name stays searchable as a past name
          // a domain is referenced by name: its terms and codes follow the rename, each with its own history line (models are re-reviewed, never edited)
          if (nd && nd[1] && d.k === 'domain') dict.filter(x => (x.k === 'term' || x.k === 'code') && x.dom === nd[1]).forEach(x => { x.dom = nd[2]; x.ver += 1; x.dt = today(); x.review = `도메인 ${nd[1]} → ${nd[2]}`;
            x.hist = x.hist || []; x.hist.unshift({ v: 'V' + x.ver, at, act: '변경', doc: doc.id, by: ME.name, why: `도메인 이름 변경을 따라감`, diff: [['도메인', nd[1], nd[2]]] });
            ch.unshift({ at, item: x.name, kind: x.kn, act: '변경', ver: 'V' + x.ver, doc: doc.id, by: ME.name, diff: `도메인: ${nd[1]} → ${nd[2]} (도메인 이름 변경 따라감)`, fields: [['도메인', nd[1], nd[2]]], itemId: x.id }); }); }
        d.ver += 1;
      } else {
        // a placeholder created by the document itself (e.g. 엔터티 용어 '신청 중', ver 0) becomes V1; anything else with the same name is a conflict
        const ph = dict.find(x => x.name === it.name && x.k === k && x.ver === 0 && (!x.pending || x.pending === doc.id));
        const clash = dict.find(x => x.name === it.name && x.k === k && x.ver > 0);
        if (clash) { failed.push([it.name, `같은 이름 ${clash.id} 이미 있음`]); return; }
        if (ph) { d = ph; d.ver = 1; d.st = '사용'; }
        else { d = { id: (() => { const pre = k === 'word' ? 'W-' : k === 'domain' ? 'D-' : k === 'code' ? 'C-' : 'T-'; const seq = Math.max(+store.get('dbm-idseq', '500'), ...dict.map(x => +String(x.id).slice(2) || 0)) + 1; store.set('dbm-idseq', String(seq)); return pre + String(seq).padStart(4, '0'); })(), k, kn: KIND_NAME[k0] || '용어', src: doc.kind === 'common' ? '공통' : '기관', st: '사용', name: it.name, abbr: it.abbr || '—', scope: it.scope || '공통', dom: k0 === 'entity' ? '엔터티 용어' : it.dom || '—', dg: it.dg, allow: it.allow, sec: it.sec, fmt: it.fmt, eng: it.eng || '', desc: it.desc || '', ver: 1, cha: doc.kind === 'common' ? doc.commonVer : null, dt: today(), use: 0, syn: it.syn || [], forbid: it.forbid || [], old: [], hist: [] };
          if (k === 'code') Object.assign(d, { vals: (it.vals || []).map(v => Object.assign({ st: '사용' }, v)), scope: it.scope || '공통', sys: it.sys, ctype: it.ctype || '자체' });
          dict.push(d); }
      }
      d.dt = today(); if (d.pending === doc.id) delete d.pending;
      d.hist = d.hist || []; d.hist.unshift({ v: 'V' + d.ver, at, act, doc: doc.id, by: ME.name, why: it.why || doc.reason, diff });
      ch.unshift({ at, item: d.name, kind: d.kn, act, ver: 'V' + d.ver, doc: doc.id, by: ME.name, diff: diff.map(x => `${x[0]}: ${x[1] === '' ? '(빈 값)' : x[1]} → ${x[2]}`).join(' · ') + (doc.batch ? `${diff.length ? ' · ' : ''}업로드 ${doc.batch}` : ''), fields: diff, itemId: d.id, firstVer: op === '추가' });
      applied.push(d.id);
    });
    saveDict(dict); saveChanges(ch);
    // decision Q2: a new common-standard edition is applied through a normal request — the edition becomes current when it is approved
    if (doc.kind === 'common' && doc.commonVer) { const cv = getCommonVer(); saveCommonVer(Object.assign({}, cv, { ver: doc.commonVer, at, doc: doc.id, prev: cv.ver })); }
    return { applied: applied.length, failed };
  };
  /* reject / withdraw: release every pending marker that belongs to this document (MD-10 lifecycle) */
  window.releaseDoc = doc => {
    const dict = getDict(); let n = 0;
    dict.forEach(d => { if (d.pending === doc.id) { delete d.pending; if (d.ver === 0 && d.st === '신청 중') d.st = '보완 필요'; n++; } });
    saveDict(dict); return n;
  };
  /* the role that is CURRENTLY selected (another tab may have switched it after this page loaded) */
  window.liveRoleChanged = () => store.get('dbm-role', 'kim') !== ME.id;
  // the account as saved right now — another tab may have taken a role or a system away since this page loaded
  window.freshUser = () => { try { const db = JSON.parse(store.get('dbm-users', 'null')); if (db) return db[ME.id] || null; } catch (e) {} return USERS[ME.id] || null; };
  window.liveCanEdit = area => { const u = freshUser(); return !!u && u.status !== 'stopped' && canUser(u, 'model.edit', { area }); };
  window.staleRoleToast = () => toast(`다른 탭에서 사용자가 바뀌었습니다(지금 ${USERS[store.get('dbm-role', 'kim')] ? USERS[store.get('dbm-role', 'kim')].name : ''}) — 새로고침한 뒤 다시 처리하세요`, 'danger', { label: '새로고침', fn: () => location.reload() });
  /* one batch-state function for every screen (upload history, excel step 1) */
  window.batchState = b => {
    const docs = getDocs(); const d = (b.docs || []).map(id => docs.find(x => x.id === id)).filter(Boolean).slice(-1)[0];
    if (d && ['rejected', 'withdrawn'].includes(d.step)) return '보완';
    if (d && d.step === 'done') return '반영됨';
    if (d && ['da', 'final'].includes(d.step)) return '신청됨';
    return b.status;
  };
  window.batchStateLabel = s => s === '보완' ? '반려·회수 — 보완 필요' : s;
  /* one classification for "my requests" everywhere (user menu, mypage, approvals): live · fix (rejected/withdrawn) · done */
  window.docGroup = d => ['da', 'final'].includes(d.step) ? 'live' : ['rejected', 'withdrawn'].includes(d.step) ? 'fix' : 'done';
  window.DOC_GROUP_NAME = { live: '진행 중', fix: '보완 필요', done: '완료' };

  /* ---- organisation settings (SC-40/41): approval line — the final (기관 담당자) step is a setting, snapshotted into each document ---- */
  window.getOrg = () => J('dbm-org', { finalDict: true, finalModel: { rq: true, risk: true }, mail: '결재 요청은 지금 차례인 결재자에게, 결과는 신청자에게 앱 알림 · 메일은 결재선 담당자에게만' });
  window.saveOrg = o => S('dbm-org', o);
  window.lineFor = (type, area) => { const o = getOrg(); const fin = type === 'model' ? (o.finalModel[area] !== false) : o.finalDict; return fin ? ['da', 'final'] : ['da']; };
  window.hasFinal = d => (d.line || ['da', 'final']).includes('final');

  /* ---- audit events: one append-only source written by actions (settings, publish, purge, role change); audit screen merges it with document history ---- */
  const txt = v => typeof v === 'string' ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : v;
  window.pushAudit = e => { e = Object.assign({}, e, { target: txt(e.target), why: txt(e.why) }); const all = J('dbm-audit', []); all.unshift(Object.assign({ id: 'au' + Date.now() + Math.random().toString(36).slice(2, 5), at: today() + ' ' + now().split(' ')[1], who: ME.name, whoId: ME.id }, e)); S('dbm-audit', all.slice(0, 300)); };
  window.getAudit = () => J('dbm-audit', []);

  /* ---- validation policy (검수 기준) with a version number — documents and upload validations remember the version they were checked with ---- */
  window.getPolicy = () => J('dbm-policy', { ver: 3, at: '2026-11-10 09:00', by: '이데이터', hist: [{ ver: 3, at: '2026-11-10 09:00', by: '이데이터', what: '용어 영문약어명 상한 30자(Oracle 기준)' }, { ver: 2, at: '2026-10-20 14:00', by: '이데이터', what: '단어 영문약어명 6자 이내' }] });
  window.savePolicy = p => S('dbm-policy', p);
  window.dictRev = () => getChanges().length;   // a cheap "dictionary changed" marker for validation tokens

  /* ---- word decomposition for analysis (term names → standard words). Common words are seeded here for the mockup ---- */
  const COMMON_WORDS = { 요구사항: 'DEMND_MATER', 프로젝트: 'PRJ', 제출: 'SBMT', 일자: 'YMD', 명: 'NM', ID: 'ID', 코드: 'CD', 결과: 'RSLT', 내용: 'CN', 이력: 'HIST', 순번: 'SN', 상태: 'STTS', 우선순위: 'PRIOR', 부서: 'DEPT', 요청: 'REQ', 고객: 'CUST', 금액: 'AMT', 수주: 'WINCON', 기본: 'M', 승인: 'APRV', 완료: 'CMPTN', 리스크: 'RISK', 등급: 'GRD', 대응: 'RSPNS', 발주처: 'ORDR_OFC', 종료: 'END', 유형: 'TYPE', 구분: 'SE', 번호: 'NO', 여부: 'YN', 일시: 'DT', 등록: 'REG', 수정: 'MDFCN', 자: 'R', 물품: 'GOODS', 사원: 'EMP', 팀원: 'TMBR', 투입: 'INPT', 시작: 'BEGIN', 역할: 'ROLE', 구성: 'CMPS', 내역: 'D', 날짜: 'DATE' };
  // extra = words being written together (basket · screen grid · same request): they count as known words for the split (MD-14)
  window.decompose = (name, extra) => {
    const dict = getDict(); const open = openItems();
    const words = {};
    Object.entries(COMMON_WORDS).forEach(([w, ab]) => { words[w] = { w, abbr: ab, src: '공통', ok: true }; });
    dict.filter(x => x.k === 'word').forEach(x => { words[x.name] = { w: x.name, abbr: x.abbr, src: x.src, ok: x.ver > 0 && x.st === '사용', id: x.id }; });
    open.filter(o => o.it.k === 'word' && (o.it.act || '추가') === '추가').forEach(o => { if (!words[o.it.name]) words[o.it.name] = { w: o.it.name, abbr: o.it.abbr, src: '신청 중', ok: false, doc: o.doc }; else if (!words[o.it.name].ok) words[o.it.name].doc = o.doc; });
    // words written together win over the stored ones: new words, and CHANGED words (their name / abbreviation after the change) — decision Q1
    (extra || []).forEach(x => { if (!x) return; let w = x;
      if (x.id && opOf(x) === '변경') { const d = dict.find(y => y.id === x.id); if (!d) return; w = mergedOf(d, x); if (w.name !== d.name) delete words[d.name]; }
      if (w.name && w.abbr) words[w.name] = { w: w.name, abbr: w.abbr, src: '작성 중', ok: true, batch: true }; });
    const keys = Object.keys(words).sort((a, b) => b.length - a.length);
    const parts = []; let i = 0, unknown = '';
    while (i < name.length) { const k = keys.find(w => name.startsWith(w, i)); if (k) { if (unknown) { parts.push({ w: unknown, unknown: true }); unknown = ''; } parts.push(words[k]); i += k.length; } else { unknown += name[i]; i++; } }
    if (unknown) parts.push({ w: unknown, unknown: true });
    const unk = parts.filter(p => p.unknown), pend = parts.filter(p => !p.unknown && !p.ok);
    return { parts, unknown: unk, pending: pend, abbr: parts.map(p => p.abbr || '?').join('_'), ok: !unk.length && !pend.length, sus: parts.some(p => !p.unknown && p.w.length === 1 && !['명', '자'].includes(p.w)) };
  };
  window.knownDomains = () => new Set(getDict().filter(x => x.k === 'domain' && x.ver > 0 && x.st === '사용').map(x => x.name).concat(['연월일C8', '명V100', 'ID V10', '코드C1', '코드C2', '여부C1', '내용V1000', '금액N15', '일련번호N10', '일시T', '엔터티 용어', '엔터티']));

  /* ---- candidate queue lives in the state layer: model / standardize register, candidate queue / home / nav read (CX13-03) ---- */
  const CANDS0 = [
    { id: 'c1', t: '단어', name: '수령자', abbr: 'RCPNT', sim: ['수신자', 'RCVR', '공통'], doc: 'REQ-2026-0012', loc: [{ area: 'rq', e: 'dlv', ent: '산출물기본', attr: '산출물수령자명', by: 'kim' }, { area: 'rq', e: 'hist', ent: '산출물이력', attr: '수령자ID', by: 'kim' }, { area: 'hr', ent: '교재배부', attr: '수령자명', by: 'park', sys: '인사시스템' }, { area: 'hr', ent: '교재배부', attr: '수령일자', by: 'park', sys: '인사시스템' }] },
    { id: 'c2', t: '단어', name: '검수', abbr: 'INSPCT', sim: ['검사', 'INSP', '공통'], loc: [{ area: 'rq', e: 'dlv', ent: '산출물기본', attr: '산출물검수결과코드', by: 'park' }, { area: 'rq', e: 'hist', ent: '산출물이력', attr: '검수일자', by: 'park' }] },
    { id: 'c3', t: '용어', name: '요구사항변경사유내용', abbr: 'DEMND_MATER_CHG_RSN_CN', sim: null, loc: [{ area: 'rq', e: 'rqrm', ent: '요구사항내역', attr: '변경사유', by: 'kim' }] }
  ];
  /* linked term request state — model, standardize and approvals read the same rule (CX14-02/03) */
  // name (optional) = the term this link waits for: an item rejected inside a finished document ends the link for that term only (DX-12)
  window.linkState = (docId, name) => { const d = docId && getDocs().find(x => x.id === docId); if (!d) return { s: 'none', d: null };
    const it = name && (d.items || []).find(x => x.name === name); if (it && it.rej) return { s: 'ended', d, rej: it.rejWhy || '항목 반려' };
    return { s: d.step === 'done' ? 'done' : ['rejected', 'withdrawn'].includes(d.step) ? 'ended' : 'live', d }; };
  window.getCands = () => J('dbm-cand-list', clone(CANDS0));
  window.saveCands = c => S('dbm-cand-list', c);
  /* state follows the linked document: 대기 → 신청 전환(진행 중) → 등록 완료 / 반려(DA) / 기존 표준 안내; a rejected/withdrawn conversion re-opens */
  window.candState = c => {
    if (c.closed) return c.closed;   // 반려 · 기존 표준어 안내 (DA decision on the candidate itself)
    const d = c.doc && getDocs().find(x => x.id === c.doc);
    if (!d) return '대기';
    if (['da', 'final'].includes(d.step)) return '신청 전환';
    if (d.step === 'done') return '등록 완료';
    return '대기';   // conversion rejected/withdrawn → open again
  };
  window.candOpenCount = () => getCands().filter(c => candState(c) === '대기').length;
  window.addCandidate = (o, loc) => {
    const all = getCands(); let c = all.find(x => x.name === o.name && x.t === o.t);
    if (!c) { c = Object.assign({ id: 'c' + (Date.now() % 100000), loc: [] }, o); all.push(c); }
    if (loc && !c.loc.some(l => l.area === loc.area && l.ent === loc.ent && l.attr === loc.attr)) c.loc.push(Object.assign({ by: ME.id }, loc));
    if (c.closed && loc) delete c.closed;
    saveCands(all);
    pushNotif({ to: Object.values(USERS).filter(u => u.roles.includes('da') && u.id !== ME.id).map(u => u.id), k: 'cand', t: `후보 '${c.name}' 등록 — 발생 위치 ${c.loc.length}곳`, m: `${ME.name} · ${loc ? loc.ent + '.' + loc.attr : ''}`, href: `candidates.html?c=${c.id}` });
    return c;
  };
  /* one visibility rule for lists, deep links and file actions */
  window.inReview = d => !!d && ['da', 'final'].includes(d.step);
  window.onLine = (u, d) => !!u && u.status !== 'stopped' && (canUser(u, 'appr.da', { doc: d }) || ((d.line || ['da', 'final']).includes('final') && canUser(u, 'appr.final', { doc: d })) || (d.hist || []).some(h => h.whoId === u.id));
  window.canUserSeeDoc = (u, d) => !!d && !!u && (d.req === u.id || (inReview(d) ? onLine(u, d) : (canUser(u, 'appr.viewall') || (d.cc || []).includes(u.id) || onLine(u, d))));
  window.canSeeDoc = d => canUserSeeDoc(USERS[ME.id] || ME, d);
  // what a viewer may see of an area: a version under review is shown only to its requester and approvers — others see the last confirmed copy
  window.confirmedCopy = area => { const m = getModel(area); if (!m.base) return null; const d = getDocs().find(x => x.type === 'model' && x.area === area && x.ver === m.base && x.step === 'done'); return (d && d.model) || getModelData(area, m.base) || modelSeed(area); };
  window.areaView = area => { const L = modelLock(area), m = getModel(area); if (L.state === 'review' && L.doc && !canSeeDoc(L.doc)) { const c = confirmedCopy(area); return { model: c || { E: [], R: [], M: [] }, hidden: true, ver: m.base, label: m.base ? `v${m.base} 확정본 (v${m.ver} 결재 중)` : `v${m.ver} 결재 중 · 열람 제한` }; } if (L.state !== 'edit' && L.doc && L.doc.model) return { model: L.doc.model, hidden: false, ver: m.ver }; return { model: modelOf(area, m.ver), hidden: false, ver: m.ver }; };
  window.canSeeBatch = b => !!b && (b.by === ME.id || can('excel.viewall'));
  /* model diff between two stored structures (by entity id / attribute logical name) */
  window.modelDiff = (a, b) => {
    const out = []; if (!a || !b) return null;
    const ea = new Map(a.E.map(e => [e.id, e])), eb = new Map(b.E.map(e => [e.id, e]));
    const refTxt = e => `${e.refName || e.refArea || '다른 영역'} v${e.refVer || '?'} 확정본`;
    b.E.forEach(e => { if (!ea.has(e.id)) out.push(e.ref ? ['참조 추가', `${e.n} ${e.p}`, '—', refTxt(e)] : ['추가', `${e.n} ${e.p}`, '—', `엔터티 · 속성 ${e.a.length}`]); });
    a.E.forEach(e => { if (!eb.has(e.id)) out.push(e.ref ? ['참조 해제', `${e.n} ${e.p}`, refTxt(e), '—'] : ['삭제', `${e.n} ${e.p}`, `엔터티 · 속성 ${e.a.length}`, '—']); });
    b.E.forEach(e => { const o = ea.get(e.id); if (!o || !e.ref) return; if ((o.refVer || 0) !== (e.refVer || 0)) out.push(['참조 갱신', `${e.n} ${e.p}`, refTxt(o), refTxt(e)]); });
    // relations (18): structure changes are rows of the main table; ON DELETE / 1:1 UK change how the operating DB behaves — flagged 'db'
    // a relation is the same one by its FK group; copies saved before groups existed fall back to parent › child › name, then parent › child when only one is left
    const eN = id => (eb.get(id) || ea.get(id) || {}).n || id;
    const KN = { nonid: '1:N 비식별', id: '1:N 식별', one: '1:1', mn: 'M:N' }, DN = { none: '막기', cascade: 'CASCADE', setnull: 'SET NULL' };
    const CN = { '0n': '0개 이상', '1n': '1개 이상', '01': '0~1개', '1': '정확히 1개' }, cardOf = r => r.card || (r.k === 'one' ? '1' : '0n');
    const pair = new Map(), left = new Set(a.R || []);
    const take = (r, test) => { if (pair.has(r)) return; const o = [...left].filter(test); if (o.length === 1) { pair.set(r, o[0]); left.delete(o[0]); } };
    (b.R || []).forEach(r => r.g && take(r, o => o.g === r.g));
    (b.R || []).forEach(r => take(r, o => !o.g && o.f === r.f && o.t === r.t && (o.name || '') === (r.name || '')));
    (b.R || []).forEach(r => take(r, o => !o.g && o.f === r.f && o.t === r.t));
    (b.R || []).forEach(r => take(r, o => o.f === r.f && o.t === r.t && (o.name || '') === (r.name || '')));
    // effective values, computed the same way the panel does (older copies have no opt: the FK columns' NOT NULL decides)
    const colsOf = (m, r) => { const c = (m.E || []).find(e => e.id === r.t); return c && r.g ? c.a.filter(x => x.fk && x.fkg === r.g) : []; };
    const optOf = (m, r) => r.k === 'id' ? 'must' : r.opt || (colsOf(m, r).some(x => x.nn) ? 'must' : 'may');
    const mapOf = (m, r) => colsOf(m, r).map(x => `${x.fkp || '?'}→${x.p}`).sort().join(', ');
    const shape = k => k === 'one' ? 'nonid' : k;   // 1:N ↔ 1:1 (non-identifying) is the cardinality row, not a type change
    (b.R || []).forEach(r => { const o = pair.get(r), nm = `${eN(r.f)} → ${eN(r.t)}`;
      if (!o) { out.push(['관계 추가', nm, '—', KN[r.k] || r.k]); if (r.del && r.del !== 'none') out.push(['DB 동작', `${nm} · 부모 행 삭제 시`, '—', DN[r.del], 'db']); if (r.uk) out.push(['DB 동작', `${nm} · 보장 UK`, '—', r.uk, 'db']); return; }
      if (shape(o.k) !== shape(r.k)) out.push(['관계 변경', nm, KN[o.k] || o.k, KN[r.k] || r.k]);
      if ((o.name || '') !== (r.name || '')) out.push(['관계 변경', `${nm} · 관계명`, o.name || '—', r.name || '—']);
      if (cardOf(o) !== cardOf(r)) out.push(['관계 변경', `${nm} · 자식 쪽 개수`, CN[cardOf(o)], CN[cardOf(r)]]);
      const oo = optOf(a, o), ro = optOf(b, r); if (oo !== ro) out.push(['관계 변경', `${nm} · 부모 쪽`, oo === 'may' ? '없어도 됨' : '반드시', ro === 'may' ? '없어도 됨' : '반드시']);
      const om = mapOf(a, o), rm = mapOf(b, r); if (om && rm && om !== rm) out.push(['관계 변경', `${nm} · FK 짝`, om, rm]);
      if ((o.del || 'none') !== (r.del || 'none')) out.push(['DB 동작', `${nm} · 부모 행 삭제 시`, DN[o.del || 'none'], DN[r.del || 'none'], 'db']);
      if ((o.uk || '') !== (r.uk || '')) out.push(['DB 동작', `${nm} · 보장 UK`, o.uk || '—', r.uk || '—', 'db']); });
    left.forEach(r => { const nm = `${eN(r.f)} → ${eN(r.t)}`; out.push(['관계 삭제', nm, KN[r.k] || r.k, '—']); if (r.uk) out.push(['DB 동작', `${nm} · 보장 UK`, r.uk, '—', 'db']); });
    // layout only (12 §3.2): positions · views · placement · hidden lines — listed apart, flagged with a 5th field
    const moved = b.E.filter(e => { const o = ea.get(e.id); return o && (o.x !== e.x || o.y !== e.y || o.px !== e.px || o.py !== e.py); });
    if (moved.length) out.push(['배치', '위치 이동', '—', `${moved.length}개 · ${moved.slice(0, 4).map(e => e.n).join(', ')}${moved.length > 4 ? ' …' : ''}`, 'layout']);
    const va = new Map((a.V || []).map(v => [v.id, v])), vb = new Map((b.V || []).map(v => [v.id, v]));
    if (a.V && b.V) {
      b.V.forEach(v => { const o = va.get(v.id); const nm = id => (eb.get(id) || ea.get(id) || {}).n || id;
        if (!o) { out.push(['배치', `보기 추가 · ${v.n}`, '—', `엔터티 ${(v.ents || []).length}`, 'layout']); return; }
        if (o.n !== v.n) out.push(['배치', '보기 이름', o.n, v.n, 'layout']);
        const add = (v.ents || []).filter(id => !(o.ents || []).includes(id)), del = (o.ents || []).filter(id => !(v.ents || []).includes(id));
        if (add.length) out.push(['배치', `보기 ‘${v.n}’에 배치`, '—', add.map(nm).join(', '), 'layout']);
        if (del.length) out.push(['배치', `보기 ‘${v.n}’에서 뺌`, del.map(nm).join(', '), '—', 'layout']);
        const pm = Object.keys(v.pos || {}).filter(id => JSON.stringify((o.pos || {})[id]) !== JSON.stringify(v.pos[id]) && (o.ents || []).includes(id));
        if (pm.length) out.push(['배치', `보기 ‘${v.n}’ 위치 이동`, '—', `${pm.length}개`, 'layout']);
        const ha = (v.hide || []).filter(k => !(o.hide || []).includes(k)), hd = (o.hide || []).filter(k => !(v.hide || []).includes(k));
        if (ha.length || hd.length) out.push(['배치', `보기 ‘${v.n}’ 관계선`, hd.length ? `숨김 ${hd.length}` : '—', ha.length ? `숨김 ${ha.length}` : '다시 보임', 'layout']); });
      a.V.forEach(v => { if (!vb.has(v.id)) out.push(['배치', `보기 삭제 · ${v.n}`, `엔터티 ${(v.ents || []).length}`, '—', 'layout']); });
    }
    b.E.forEach(e => { const o = ea.get(e.id); if (!o || e.ref) return;
      if (o.p !== e.p) out.push(['변경', `${e.n} (물리명)`, o.p, e.p]);
      e.a.forEach(x => { const y = o.a.find(z => z.n === x.n); if (!y) out.push(['추가', `${e.n}.${x.n}`, '—', `${x.p} ${x.t || ''}`]); else { if (y.p !== x.p || (y.t || '') !== (x.t || '')) out.push(['변경', `${e.n}.${x.n}`, `${y.p} ${y.t || ''}`, `${x.p} ${x.t || ''}`]); if (x.s === 'ex' && y.s !== 'ex') out.push(['예외', `${e.n}.${x.n}`, '—', x.exReason || '사유']); if (x.s === 'na' && y.s !== 'na') out.push(['비대상', `${e.n}.${x.n}`, '—', x.naReason || '사유']); } });
      o.a.forEach(y => { if (!e.a.find(z => z.n === y.n)) out.push(['삭제', `${e.n}.${y.n}`, `${y.p} ${y.t || ''}`, '—']); }); });
    return out;
  };
  /* compliance counted from a stored structure (so approval re-checks the SUBMITTED model, not the shared cache) */
  /* attributes counted as "term requested" whose request has since been rejected / withdrawn — they are NOT compliant (CX11-07) */
  window.reqEnded = m => { if (!m) return []; const docs = getDocs(); const out = []; m.E.forEach(e => e.a.forEach(a => { if (a.s !== 'req' || !a.reqDoc) return; const d = docs.find(x => x.id === a.reqDoc); if (d && ['rejected', 'withdrawn'].includes(d.step)) out.push(`${e.n}.${a.n}(${d.id} ${STEP_NAME[d.step]})`); }));
    m.E.forEach(e => { if (!e.st || !e.reqDoc) return; const d = docs.find(x => x.id === e.reqDoc); if (d && ['rejected', 'withdrawn'].includes(d.step)) out.push(`${e.n} 엔터티 용어(${d.id} ${STEP_NAME[d.step]})`); }); return out; };
  /* compliance of a model copy — the model screen, system ERD and outputs use this one formula (CX15-04/05) */
  window.compOf = m => { let tot = 0, ok = 0, bad = 0, ex = 0, na = 0, req = 0; (m ? m.E : []).forEach(e => { if (e.ref) return; tot++; if (e.p === '—') bad++; else ok++; e.a.forEach(a => { if (a.edit) return; if (a.s === 'na') { na++; return; } tot++; if (a.s === 'ok') ok++; else if (a.s === 'ex') { ok++; ex++; } else if (a.s === 'req') { ok++; req++; } else bad++; }); }); return { rate: tot ? Math.floor(ok / tot * 100) : 0, bad, ex, na, req, tot }; };
  window.modelBad = m => m ? m.E.reduce((n, e) => n + (e.ref ? 0 : (e.p === '—' ? 1 : 0) + e.a.filter(a => !a.edit && (a.s === 'comb' || a.s === 'unreg')).length), 0) : null;
  /* baselines: every editable download is recorded (range, item ids, versions) — round-trip judgement uses this, not the file alone */
  window.recordBaseline = (scope, ids) => { const all = J('dbm-baselines', []); const t = new Date(); const id = `BL-${today().replace(/-/g, '')}-${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`; all.unshift({ id, at: now(), by: ME.id, scope, n: ids.length, ids }); S('dbm-baselines', all.slice(0, 20)); return id; };
  window.latestBaseline = () => (J('dbm-baselines', [])).find(b => b.by === ME.id) || { id: 'BL-20261116-0905', at: '11/16 09:05', by: 'kim', scope: '용어 · 필터: 요구사항', n: 13 };
  /* per-version model data (S5): edits persist per area+version; a confirmation stores its own snapshot */
  window.getModelData = (area, ver) => J(`dbm-mdata-${area}-v${ver}`, null);
  window.setModelData = (area, ver, data) => S(`dbm-mdata-${area}-v${ver}`, data);

  /* ---- notifications: addressed to people, created by events ---- */
  window.NOTIFY_KINDS = [['appr', '결재 요청 (내 차례)', 'must'], ['res', '내 신청 결과 (승인·반려·회수)', 'opt'], ['cc', '참조', ''], ['cand', '후보 등록·처리 결과', ''], ['job', '긴 작업 완료 (엑셀 검증·산출물)', ''], ['rev', '표준 재검토 가능 · 공동 편집 충돌', '']];
  window.getNotifyPref = uid => J('dbm-notify-' + uid, {});
  window.saveNotifyPref = (uid, p) => S('dbm-notify-' + uid, p);
  window.pushNotif = n => { if (n.to && n.k !== 'sys') { n = Object.assign({}, n, { to: n.to.filter(u => { const p = getNotifyPref(u)[n.k]; return !p || p.app !== false; }) }); if (!n.to.length) return; } const all = J('dbm-notifs', []); n = Object.assign({}, n, { t: txt(n.t), m: txt(n.m) }); /* user-typed reasons are text, never markup */ all.unshift(Object.assign({ id: 'd' + Date.now() + Math.random().toString(36).slice(2, 5), at: now() }, n)); S('dbm-notifs', all.slice(0, 50)); };

  /* ---- notifications ---- */
  const NOTIFS0 = [
    { id: 'n1', k: 'appr', t: 'REQ-2026-0011 모델 확정(리스크 v2) — DA 승인 차례', m: '박설계 · 요구사항관리 › 리스크', href: 'approvals.html?doc=REQ-2026-0011', at: '11/16 18:02', to: ['kim', 'lee'] },
    { id: 'n2', k: 'job', t: '엑셀 검증 완료 — 요구사항_용어_1차.xlsx', m: '신규 112 · 변경 4 · 후보 확정 4 · 오류 4 → REQ-2026-0016', href: 'uploads.html?b=UP-2026-0007', at: '11/16 09:15', to: ['kim'] },
    { id: 'n3', k: 'cand', t: "후보 '수령자'가 단어 신청으로 전환됐습니다", m: 'REQ-2026-0012 · 내가 등록한 후보 2건', href: 'approvals.html?doc=REQ-2026-0012', at: '11/17 11:05', to: ['kim', 'park'] },
    { id: 'n4', k: 'cc', t: '참조: REQ-2026-0009 단어 3건 등록', m: '박설계 신청 · DA 승인 대기', href: 'approvals.html?box=cc&doc=REQ-2026-0009', at: '11/16 09:12', to: ['kim'] },
    { id: 'n5', k: 'appr', t: "REQ-2026-0010 도메인 '코드C2' — 최종 승인 차례", m: '이데이터 신청 · DA 승인 완료', href: 'approvals.html?doc=REQ-2026-0010', at: '11/16 17:40', to: ['hyun'] },
    { id: 'n6', k: 'sys', t: `NeoDB ${PRODUCT.version} 새 기능`, m: '산출물 화면 · 표 보기 · 모델 검토 — 릴리스 노트', href: '#about', at: '11/17 09:00', to: ['kim', 'park', 'lee', 'hyun'] }
  ];
  const readSet = new Set((store.get('dbm-read-' + ME.id, '') || '').split(',').filter(Boolean));
  const myNotifs = () => J('dbm-notifs', []).concat(NOTIFS0).filter(n => (n.to || []).includes(ME.id));
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
  /* v8 icon set (Lucide paths, ISC) — 16px/1.5 stroke, 12px/2 stroke inside tags; meaning-bearing places only */
  const LU = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    err: '<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.31 2a2 2 0 0 1 1.42.59l4.68 4.68A2 2 0 0 1 22 8.69v6.62a2 2 0 0 1-.59 1.42l-4.68 4.68a2 2 0 0 1-1.42.59H8.69a2 2 0 0 1-1.42-.59l-4.68-4.68A2 2 0 0 1 2 15.31V8.69a2 2 0 0 1 .59-1.42l4.68-4.68A2 2 0 0 1 8.69 2z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>',
    pointer: '<path d="M4.04 4.65a.5.5 0 0 1 .61-.61l15.95 5.58a.5.5 0 0 1 .02.94l-6.2 2.48a2 2 0 0 0-1.1 1.1l-2.49 6.2a.5.5 0 0 1-.94-.02z"/>',
    moveh: '<path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 8-4 4 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    compare: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    table: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    col: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    flow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    term: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    star: '<path d="M11.5 2.8a.5.5 0 0 1 1 0l2.3 4.7 5.2.8a.5.5 0 0 1 .3.9l-3.8 3.6.9 5.2a.5.5 0 0 1-.8.6L12 16.1l-4.6 2.5a.5.5 0 0 1-.8-.6l.9-5.2-3.8-3.6a.5.5 0 0 1 .3-.9l5.2-.8z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    wand: '<path d="m15 4 5 5"/><path d="M14 5 3 16l5 5L19 10"/><path d="M8 3v2"/><path d="M4 7h2"/><path d="M19 15v2"/><path d="M17 19h2"/>',
    basket: '<path d="M5 11 9 4"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
  };
  window.icon = (n, s = 16) => `<svg class="ic${s === 12 ? ' s12' : ''}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${s === 12 ? 2 : 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LU[n] || ''}</svg>`;
  /* <i data-ic=name> placeholders (usable in any HTML or JS string) become SVG icons — also for content rendered later */
  const fillIc = root => { if (!root || !root.querySelectorAll) return; root.querySelectorAll('i[data-ic]:not([data-done])').forEach(e => { e.innerHTML = icon(e.dataset.ic, e.dataset.s ? +e.dataset.s : 16); e.setAttribute('data-done', '1'); e.setAttribute('aria-hidden', 'true'); }); };
  document.addEventListener('DOMContentLoaded', () => { fillIc(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) fillIc(n.matches && n.matches('i[data-ic]') ? n.parentElement : n); }))).observe(document.body, { childList: true, subtree: true }); });
  /* ⋯ menus: a [data-menu-btn] opens the .menu[data-auto] next to it; outside click / Esc closes */
  document.addEventListener('click', e => { const b = e.target.closest('[data-menu-btn]'); const inMenu = e.target.closest('.menu[data-auto]'); document.querySelectorAll('.menu[data-auto].open').forEach(m => { if (inMenu === m && !e.target.closest('a')) return; if (!b || m !== b.nextElementSibling) { m.classList.remove('open'); const ob = m.previousElementSibling; if (ob) ob.setAttribute('aria-expanded', 'false'); } });
    if (b) { const m = b.nextElementSibling; if (m && m.matches('.menu[data-auto]')) { const on = !m.classList.contains('open'); m.classList.toggle('open', on); b.setAttribute('aria-expanded', on); if (on) { const f = m.querySelector('.mi'); f && f.focus(); } } } });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; const m = document.querySelector('.menu[data-auto].open'); if (m) { m.classList.remove('open'); const b = m.previousElementSibling; if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); } } });
  /* buttons that start work show a short "in progress" state ([data-busy]) — the action itself runs as before */
  document.addEventListener('click', e => { const b = e.target.closest('[data-busy]'); if (!b || b.disabled || b.classList.contains('loading')) return; b.classList.add('loading'); b.setAttribute('aria-busy', 'true'); setTimeout(() => { b.disabled = true; }, 0); setTimeout(() => { b.classList.remove('loading'); b.removeAttribute('aria-busy'); b.disabled = false; }, +b.dataset.busy || 600); }, true);
  /* status: one badge for every screen (01 v2 §2.3) — ok · run · mine · warn · err · ex · end map onto .badge variants */
  const TAG_IC = { ex: 'flag' };   // Geist: no check / X icons inside status badges — colour + words
  const TAG_CLS = { ok: 'b-success', run: '', mine: 'b-info', warn: 'b-warning', err: 'b-danger', ex: 'b-ex', end: 'b-end' };   // 진행 중 = neutral, 내 차례 = blue — what you act on is the strongest (01 v2 §2.3)
  window.tag = (kind, label) => `<span class="badge ${TAG_CLS[kind] || ''}">${TAG_IC[kind] ? icon(TAG_IC[kind], 12) : ''}${label}</span>`;
  /* display density (01 v2 §6.4): 촘촘 32 · 기본 36 · 넓게 44 — a personal setting (마이페이지) */
  window.DENSITY = { compact: '촘촘 32px', default: '기본 36px', comfy: '넓게 44px' };
  window.setDensity = v => { store.set('dbm-density', v); document.documentElement.dataset.density = v; };
  document.documentElement.dataset.density = store.get('dbm-density', 'default');
  /* the mock's reference day and the age of a document in its current step (home · approvals use the same count) */
  window.MOCK_TODAY = new Date(2026, 10, 19);
  const toDay = s => { if (!s) return null; let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return new Date(+m[1], m[2] - 1, +m[3]); m = /(\d{1,2})\/(\d{1,2})/.exec(s); return m ? new Date(2026, m[1] - 1, +m[2]) : null; };
  window.toDay = toDay;
  /* days in the current step: DA waits from submission, final waits from the DA approval — failed re-checks do not restart the clock */
  window.docAge = d => { let from = d.date; if (d.step === 'final') { const a = (d.hist || []).filter(x => x.step === 'da' && /승인/.test(x.act || '') && !/실패|취소/.test(x.act || '')).pop(); if (a) from = a.at; }
    const t = toDay(from) || MOCK_TODAY; return Math.max(0, Math.round((MOCK_TODAY - t) / 864e5)); };
  window.docLate = d => ['da', 'final'].includes(d.step) && docAge(d) >= ((getOrg && getOrg().sla) || 3);
  /* document state as a tag: in progress = outline (accent when it is my turn), late = error, rejected = error, done = ok, withdrawn = faint */
  window.docTag = d => { const mineTurn = canActOn(d);
    if (d.step === 'rejected') return tag('err', STEP_NAME[d.step]);
    if (d.step === 'withdrawn') return tag('end', STEP_NAME[d.step]);
    if (d.step === 'done') return tag('ok', '완료');
    return tag(mineTurn ? 'mine' : 'run', STEP_NAME[d.step] + (mineTurn ? ' · 내 차례' : '')); };

  /* ---- screen map (mockup review tool): one registry for the per-screen info panel and the index map ----
     docs are relative to /mockups/ — serve.ps1 serves ../*.md (docs/ux) and ../../spec/*.md (docs/spec) read-only */
  const D = { flows: '../02-flows.md', erd: '../03-erd-editor.md', plan: '../06-ux-review-plan.md', excel: '../07-dict-excel-roundtrip.md', da: '../05-mockup-vs-da.md', meta: '../../spec/da-feature-spec/30-metadata-design.md', prio: '../../spec/da-feature-spec/20-priority.md', sws: '../../spec/da-feature-spec/22-sws-comparison.md', perf: '../../spec/da-feature-spec/23-performance-spike.md', guide: '../01-design-guide.md' };
  const SCREENS = [
    { file: 'home.html', ids: 'SC-55', name: '홈', menu: '홈', docs: [['02 §1 화면 목록', D.flows], ['06 §3 새 화면 명세', D.plan]], states: [['김모델(모델러·DA)', 'home.html?as=kim'], ['박설계(모델러)', 'home.html?as=park'], ['이현업(기관 담당자)', 'home.html?as=hyun']] },
    { file: 'dictionary.html', ids: 'SC-10 · PN-11 · PN-12', name: '사전 통합 검색 · 상세 · 등록 신청', menu: '사전', docs: [['02 §3.1~3.2', D.flows], ['30 MD-01~12 사전 규칙', D.meta], ['07 E6 검색', D.excel], ['23 §6-1 검색 숫자', D.perf]], states: [['기본(최근 변경)', 'dictionary.html'], ['도메인 신청', 'dictionary.html?req=domain'], ['편집용 내려받기', 'dictionary.html#download'], ['검색: 산출', 'dictionary.html?q=산출']] },
    { file: 'dict-history.html', ids: 'SC-16', name: '사전 변경 내역 · 공표', menu: '사전', docs: [['07 E5 버전·이력', D.excel], ['30 MD-23', D.meta]], states: [['전체', 'dict-history.html'], ['미공표만', 'dict-history.html?unpub=1']] },
    { file: 'excel-import.html', ids: 'SC-13', name: '엑셀 가져오기(왕복 편집)', menu: '사전', docs: [['02 §3.3', D.flows], ['07 E1~E4 왕복 편집', D.excel], ['30 MD-08·09', D.meta], ['23 §6-4 행 상한', D.perf]], states: [['1단계부터(실제 작업)', 'excel-import.html'], ['5단계 예시(저장 안 함)', 'excel-import.html?step=5'], ['신청된 묶음 열람', 'excel-import.html?resume=UP-2026-0007'], ['반영본 확인', 'excel-import.html?verify=UP-2026-0007']] },
    { file: 'uploads.html', ids: 'SC-15', name: '업로드 이력', menu: '사전', docs: [['07 E4', D.excel]], states: [['전체', 'uploads.html'], ['UP-2026-0007', 'uploads.html?b=UP-2026-0007']] },
    { file: 'candidates.html', ids: 'SC-14', name: '후보 큐', menu: '사전', docs: [['02 §3.4', D.flows], ['30 MD-42·43', D.meta]], states: [['DA로 보기', 'candidates.html?as=lee'], ['모델러로 보기', 'candidates.html?as=park']] },
    { file: 'approvals.html', ids: 'SC-20 · PN-21 · MO-22 · MO-23', name: '결재함 · 문서 상세 · 자기 승인 · 반려', menu: '결재', docs: [['02 §4 결재 흐름', D.flows], ['30 MD-20~27', D.meta]], states: [['대기함(김모델)', 'approvals.html'], ['엑셀 문서', 'approvals.html?doc=REQ-2026-0016'], ['모델 확정(리스크 v2)', 'approvals.html?doc=REQ-2026-0011'], ['최종 승인 차례(이현업)', 'approvals.html?doc=REQ-2026-0010&as=hyun'], ['완료 문서', 'approvals.html?doc=REQ-2026-0007']] },
    { file: 'system.html', ids: 'SC-30', name: '시스템 홈', menu: '시스템', docs: [['02 §1', D.flows]], states: [['요구사항관리', 'system.html']] },
    { file: 'model.html', ids: 'SC-31 · PN-32 · PN-33 · PN-31G · PN-39 · PN-35 · PN-38', name: '모델(ERD 캔버스 · 사전 패널 · 엔터티 패널 · 표 보기 · 모델 검토 · 게이트 A · 확정 신청)', menu: '시스템', docs: [['03 ERD 편집기', D.erd], ['02 §5.1~5.4·5.7', D.flows], ['22 §6 SWS 비교 결정', D.sws], ['23 §6-2·5·6 캔버스 숫자', D.perf]], states: [['요구사항·프로젝트(편집)', 'model.html'], ['리스크(검토 중)', 'model.html?area=risk'], ['v4 확정본 사본', 'model.html?area=rq&snap=REQ-2026-0003'], ['예시: 미준수 해결 후(조회 전용)', 'model.html?state=resolved']] },
    { file: 'standardize.html', ids: 'SC-34', name: '표준 맞추기', menu: '시스템', docs: [['02 §5.3', D.flows], ['30 MD-42·50~55', D.meta]], states: [['요구사항·프로젝트', 'standardize.html'], ['예외만', 'standardize.html?f=ex'], ['DDL 가져오기 직후', 'standardize.html?from=import'], ['리스크(대상 없음)', 'standardize.html?area=risk']] },
    { file: 'import.html', ids: 'SC-36', name: '가져오기(엑셀·DDL → 모델)', menu: '시스템', docs: [['02 §5.6', D.flows]], states: [['기본', 'import.html']] },
    { file: 'ddl.html', ids: 'SC-37 · PN-37', name: 'DDL 출력 · 게이트 B · DBMS 비교', menu: '시스템', docs: [['02 §5.5', D.flows]], states: [['기본', 'ddl.html']] },
    { file: 'outputs.html', ids: 'SC-38', name: '산출물', menu: '시스템', docs: [['05 §8 DA# 비교', D.da]], states: [['테이블 정의서', 'outputs.html?k=tbl']] },
    { file: 'settings.html', ids: 'SC-40 · SC-41 · SC-42 · SC-43', name: '설정(기관 · 시스템 · 사용자·역할 · 검수 기준)', menu: '관리', docs: [['02 §6 설정 흐름', D.flows], ['30 §4 검수 기준', D.meta]], states: [['기관(이데이터 Admin)', 'settings.html?as=lee'], ['시스템', 'settings.html?as=lee#sys'], ['검수 기준', 'settings.html?as=lee#rules'], ['Admin 아님 → 403', 'settings.html?as=kim']] },
    { file: 'audit.html', ids: 'SC-58', name: '감사 로그', menu: '관리', docs: [['06 §3', D.plan]], states: [['DA로 보기', 'audit.html?as=lee']] },
    { file: 'mypage.html', ids: 'SC-51 · PN-50', name: '마이페이지 · 사용자 메뉴', menu: '사용자', docs: [['06 §3', D.plan]], states: [['프로필', 'mypage.html'], ['내 신청', 'mypage.html#mine'], ['알림 설정', 'mypage.html#notify']] },
    { file: 'login.html', ids: 'SC-56', name: '로그인', menu: '공통', docs: [['06 §3', D.plan]], states: [['처음 로그인', 'login.html'], ['세션 만료 후 복귀', 'login.html?from=model.html%3Farea%3Drq&expired=1'], ['SSO 실패', 'login.html?fail=1']] },
    { file: 'error.html', ids: 'SC-57', name: '오류·안내', menu: '공통', docs: [['06 §3', D.plan]], states: [['403', 'error.html?code=403&need=Admin&what=설정'], ['404', 'error.html?code=404'], ['500', 'error.html?code=500'], ['점검', 'error.html?code=maint'], ['로그아웃', 'error.html?code=logout'], ['세션 만료', 'error.html?code=expired&from=model.html%3Farea%3Drq'], ['500 오류 ID 복사', 'error.html?code=500']] }
  ];
  /* decisions made after the v7.1 freeze that the screens do not show yet (22 §6 · 23 §6 · 03 §13.1 · 06 남은 범위) */
  const TODO = {
    'dictionary.html': [['사전 목록 가상화(행 40개만 그림) — 목업은 일부만 표시, 구현 단계', '23 §6-3'], ['상세 패널 재검토 사유를 진단 코드 목록으로', '30 v1.2 ⑥']],
    'excel-import.html': [['결과 표 가상화 — 구현 단계', '23 §6-3']],
    'model.html': [['카드 안 편집은 속성 추가·이름 바꾸기만, 나머지는 오른쪽 패널', '03 §0'], ['관계선을 FK 속성 행에 붙이기(컬럼 단위)', '22 §6-5'], ['부모 PK를 자식에 끌어다 놓아 키 전달', '22 §6-5'], ['ERD 편집 완결(남은 범위)', '06 남은 범위']],
    'import.html': [['엑셀 테이블 정의서 → ERD 초안(가져올 때 중복만, 표준 검사는 표준 맞추기)', '20 · W2 후보']],
    'settings.html': [['T11 가져오기·출력 결과물 / T12 운영·관리 테마', '06 남은 범위']]
  };
  SCREENS.forEach(s => { s.todo = TODO[s.file] || []; });
  window.SCREENS = SCREENS; window.SCREEN_DOCS = D;
  const curFile = () => (location.pathname.split('/').pop() || 'index.html');
  /* per-screen review notes — kept across ↺ reset; exported as markdown for planning */
  const getNotes = () => J('dbm-notes', {});
  const saveNotes = n => S('dbm-notes', n);
  window.getNotes = getNotes;
  window.notesMarkdown = () => { const n = getNotes(); const rows = []; SCREENS.forEach(s => (n[s.file] || []).forEach(x => rows.push(`| ${s.ids} | ${s.name} | ${x.done ? '✅' : '☐'} | ${x.text.replace(/\|/g, '\\|').replace(/\n/g, '<br>')} | ${x.by} · ${x.at} |`))); return rows.length ? `| 화면 | 이름 | 처리 | 메모 | 작성 |\n|---|---|---|---|---|\n${rows.join('\n')}` : '(메모 없음)'; };
  function screenPanel() {
    const f = curFile(); const i = SCREENS.findIndex(s => s.file === f); const s = SCREENS[i];
    const p = document.getElementById('scr-panel'); if (!p) return;
    if (!s) { p.innerHTML = '<div class="scr-b">이 화면은 화면 목록에 없습니다.</div>'; return; }
    const prev = SCREENS[(i - 1 + SCREENS.length) % SCREENS.length], next = SCREENS[(i + 1) % SCREENS.length];
    const notes = getNotes()[f] || [];
    p.innerHTML = `<div class="scr-h"><div><span class="badge">${s.menu}</span> <b class="mono">${s.ids}</b></div><button class="iconbtn" id="scr-x" aria-label="화면 정보 닫기" style="width:26px;height:26px">${ICON.x}</button></div>
      <div class="scr-b">
        <div class="scr-name">${s.name}</div>
        <div class="scr-sec">상태별 바로가기</div><div class="scr-links">${s.states.map(([l, u]) => `<a href="${u}">${l}</a>`).join('')}</div>
        <div class="scr-sec">관련 설계 문서</div><div class="scr-links">${s.docs.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('')}</div>
        <div class="scr-sec">설계 결정 반영 대기 <span class="badge">${s.todo.length}</span> <span class="caption muted">목업 동결 뒤 결정 — 아직 화면에 없음</span></div>
        ${s.todo.length ? `<ul class="scr-todo">${s.todo.map(([t, r]) => `<li>${t} <span class="caption faint">${r}</span></li>`).join('')}</ul>` : '<div class="caption muted">없음</div>'}
        <div class="scr-sec">검토 메모 <span class="caption muted">${notes.filter(x => !x.done).length}건 남음 · 이 브라우저에 저장(↺ 초기화에도 유지)</span></div>
        <div class="scr-notes">${notes.map((x, k) => `<div class="scr-note ${x.done ? 'done' : ''}"><label><input type="checkbox" data-nd="${k}" ${x.done ? 'checked' : ''} aria-label="처리 표시"></label><div class="grow"><div class="t">${x.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div><div class="caption faint">${x.by} · ${x.at}</div></div><button class="btn ghost sm" data-nx="${k}" aria-label="메모 삭제">삭제</button></div>`).join('') || '<div class="caption muted">아직 메모가 없습니다.</div>'}</div>
        <textarea class="input" id="scr-text" rows="3" placeholder="이 화면에서 고칠 점·확인할 점 (Ctrl+Enter 추가)"></textarea>
        <div class="flex" style="margin-top:6px"><button class="btn sm" id="scr-export">전체 메모 복사(마크다운)</button><span class="grow"></span><button class="btn sm primary" id="scr-add">메모 추가</button></div>
      </div>
      <div class="scr-f"><a href="${prev.file}">← ${prev.ids.split(' · ')[0]} ${prev.name.split('(')[0]}</a><a href="index.html">목업 지도</a><a href="${next.file}">${next.ids.split(' · ')[0]} ${next.name.split('(')[0]} →</a></div>`;
    p.querySelector('#scr-x').onclick = () => toggleScreenPanel(false);
    const add = () => { const v = p.querySelector('#scr-text').value.trim(); if (!v) return; const n = getNotes(); (n[f] = n[f] || []).push({ text: v, at: now(), by: ME.name, done: false }); saveNotes(n); screenPanel(); const t2 = document.getElementById('scr-text'); if (t2) t2.focus(); toast('메모를 추가했습니다', 'info'); };
    p.querySelector('#scr-add').onclick = add;
    p.querySelector('#scr-text').onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); add(); } };
    p.querySelectorAll('[data-nd]').forEach(c => c.onchange = () => { const n = getNotes(); n[f][+c.dataset.nd].done = c.checked; saveNotes(n); const k = c.dataset.nd; screenPanel(); const back = document.querySelector(`#scr-panel [data-nd="${k}"]`); if (back) back.focus(); });
    p.querySelectorAll('[data-nx]').forEach(b => b.onclick = () => { const n = getNotes(); n[f].splice(+b.dataset.nx, 1); saveNotes(n); screenPanel(); });
    p.querySelector('#scr-export').onclick = () => { const md = notesMarkdown(); (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(() => toast('전체 화면의 메모를 마크다운 표로 복사했습니다', 'success'), () => { window.prompt('복사해서 쓰세요', md); }); };
  }
  function toggleScreenPanel(on) {
    const p = document.getElementById('scr-panel'); if (!p) return;
    const open = on == null ? !p.classList.contains('open') : on;
    p.classList.toggle('open', open); store.set('dbm-scr-open', open ? '1' : '0');
    const b = document.getElementById('mk-scr'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    // focus moves into the panel and back to the trigger (CX12-03)
    if (open) { screenPanel(); const t = p.querySelector('#scr-text'); if (t && on !== true) t.focus(); } else if (p.contains(document.activeElement)) { const v = b && b.offsetParent ? b : document.getElementById('mk-fab'); if (v) v.focus(); }
  }
  window.toggleScreenPanel = toggleScreenPanel;

  /* global search (Ctrl+K): dictionary items, approval documents, entities/attributes of every area, screens — one overlay in the shell */
  function gsearchOpen() {
    let ov = document.getElementById('gs-ov');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'gs-ov'; ov.className = 'overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', '전체 검색');
      ov.innerHTML = `<div class="modal gs-modal"><div class="gs-in">${ICON.search}<input id="gs-q" class="input" placeholder="단어·용어·도메인, 신청번호, 엔터티·속성, 화면 이름" aria-label="검색어" aria-controls="gs-list" autocomplete="off"><kbd>Esc</kbd></div><div id="gs-list" class="gs-list" role="listbox"></div><div class="gs-foot caption muted">↑↓ 이동 · Enter 열기 · 사전은 2글자 이하면 앞부분 일치(23 §6-1)</div></div>`;
      document.body.appendChild(ov);
      const q = ov.querySelector('#gs-q'), list = ov.querySelector('#gs-list'); let sel = 0, items = [];
      const close = () => { ov.classList.remove('open'); const b = document.getElementById('gsearch'); if (b) b.focus(); };
      const esc = s => String(s).replace(/</g, '&lt;');
      const draw = () => {
        const v = q.value.trim(); items = [];
        if (v) {
          const m = x => !x ? false : v.length <= 2 ? String(x).startsWith(v) || String(x).toUpperCase().startsWith(v.toUpperCase()) : String(x).toUpperCase().includes(v.toUpperCase());
          const KN = { word: '단어', term: '용어', domain: '도메인', code: '코드' };
          getDict().filter(x => m(x.name) || m(x.abbr)).slice(0, 6).forEach(x => items.push({ g: '표준 사전', t: `${x.name} <span class="mono caption">${x.abbr || ''}</span>`, s: `${KN[x.k] || x.k} · ${x.id}${x.st === '미사용' ? ' · 미사용' : ''}`, href: `dictionary.html?q=${encodeURIComponent(x.name)}&sel=${x.id}` }));
          getDocs().filter(d => canSeeDoc(d) && (m(d.id) || m(d.title))).slice(0, 5).forEach(d => items.push({ g: '결재 문서', t: `<span class="mono">${d.id}</span> ${esc(d.title)}`, s: STEP_NAME[d.step] || d.step, href: `approvals.html?doc=${d.id}` }));
          Object.entries(getModels()).forEach(([id, md]) => { const mo = modelOf(id, md.ver); (mo.E || []).filter(e => !e.ref).forEach(e => { if (m(e.n) || m(e.p)) items.push({ g: '모델', t: esc(e.n) + ` <span class="mono caption">${e.p || ''}</span>`, s: md.name + ' · 엔터티', href: `model.html?area=${id}&focus=${e.id}` }); (e.a || []).forEach(a => { if (m(a.n) || m(a.p)) items.push({ g: '모델', t: `${esc(e.n)}.${esc(a.n)}`, s: md.name + ' · 속성', href: `model.html?area=${id}&focus=${e.id}` }); }); }); });
          items = items.filter((x, i) => x.g !== '모델' || items.filter(y => y.g === '모델').indexOf(x) < 8);
          SCREENS.filter(s => m(s.name) || m(s.ids)).slice(0, 4).forEach(s => items.push({ g: '화면', t: esc(s.name), s: s.ids, href: s.file }));
        }
        sel = Math.min(sel, Math.max(items.length - 1, 0));
        let g0 = ''; list.innerHTML = !v ? '<div class="caption muted gs-empty">검색어를 입력하세요. 최근 연 화면·문서는 여기에 보입니다(실제 제품).</div>' : items.length ? items.map((x, i) => { const h = x.g !== g0 ? `<div class="gs-g">${x.g}</div>` : ''; g0 = x.g; return h + `<a class="gs-it${i === sel ? ' on' : ''}" role="option" aria-selected="${i === sel}" href="${x.href}" data-i="${i}"><span>${x.t}</span><span class="caption muted">${x.s}</span></a>`; }).join('') : `<div class="caption muted gs-empty">‘${esc(v)}’ 결과가 없습니다. 사전에 없는 단어면 모델에서 <b>후보 등록</b>을 하세요.</div>`;
      };
      q.oninput = () => { sel = 0; draw(); };
      q.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, items.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); } else if (e.key === 'Enter' && items[sel]) { location.href = items[sel].href; } else if (e.key === 'Escape') close(); };
      ov.addEventListener('click', e => { if (e.target === ov) close(); });
    }
    ov.classList.add('open'); const q = ov.querySelector('#gs-q'); q.value = ''; q.dispatchEvent(new Event('input')); q.focus();
  }
  window.gsearchOpen = gsearchOpen;
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K') && document.getElementById('gsearch')) { e.preventDefault(); gsearchOpen(); } });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#gsearch')) gsearchOpen(); });

  /* ---- NeoDB brand (11 §3, BI A "연결된 N"): ink square, two nodes joined by a relation line ---- */
  const MARK = (s = 20) => `<svg class="nmark" width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="${s <= 16 ? 5 : 6}" fill="currentColor"/><path d="M10 22V10l12 12V10" fill="none" stroke="var(--on-ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="3" fill="var(--on-ink)"/><circle cx="22" cy="22" r="3" fill="var(--on-ink)"/></svg>`;
  window.MARK = MARK;
  if (!document.querySelector('link[rel="icon"]')) { const l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml'; l.href = 'assets/neodb-mark.svg'; document.head.appendChild(l); }
  /* recently opened entities (model tree) — model.html records one whenever an entity's panel opens */
  const recKey = () => 'dbm-recent-ent-' + ME.id;
  window.noteRecent = (area, id, n) => { const r0 = J(recKey(), []); if (r0[0] && r0[0].area === area && r0[0].id === id) return; const r = r0.filter(x => !(x.area === area && x.id === id)); r.unshift({ area, id, n }); S(recKey(), r.slice(0, 3)); window.dispatchEvent(new Event('dbm-recent')); };
  /* top menus: arrow keys move between items of an open menu */
  document.addEventListener('keydown', e => { const tb = e.key === 'ArrowDown' && e.target.closest && e.target.closest('[data-menu-btn]'); if (tb && tb.getAttribute('aria-expanded') !== 'true') { e.preventDefault(); tb.click(); return; } });
  document.addEventListener('focusout', e => { const w = e.target.closest && e.target.closest('.tmw'); const to = e.relatedTarget; if (!w || !to || w.contains(to)) return; const m = w.querySelector('.menu[data-auto].open'); if (!m) return; m.classList.remove('open'); const b = w.querySelector('[data-menu-btn]'); if (b) b.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('keydown', e => { if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return; const m = e.target.closest && e.target.closest('.menu[data-auto].open'); if (!m) return; const it = [...m.querySelectorAll('.mi')]; if (!it.length) return; e.preventDefault(); let i = it.indexOf(document.activeElement); i = e.key === 'Home' ? 0 : e.key === 'End' ? it.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length; it[i].focus(); });

  /* ---- model tree (12 · DA#-style object explorer, T1 read tree):
     system › business area › (shortcuts · views · objects · used standards) › object › attribute.
     The tree shows the same area · version · logical/physical mode the canvas opened — model.html supplies window.treeData(). ---- */
  const SYSTEMS_OF = () => SYSLIST.map(s => Object.assign({}, s, { href: 'system.html?system=' + s.code, cur: s.code === curSys().code }));
  const treeKey = () => 'dbm-tree3-' + ME.id;
  function drawTree(nav) {
    const page = document.body.dataset.page, file = curFile(), qp = new URLSearchParams(location.search);
    const app = document.getElementById('app');
    const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const fam = ['model.html', 'standardize.html', 'ddl.html', 'outputs.html'].includes(file) && !qp.get('sys');
    const models0 = getModels();
    const famArea = fam ? (models0[qp.get('area')] ? qp.get('area') : defArea()) : null;
    if (famArea) store.set('dbm-last-area', famArea);
    const cur = famArea || (models0[store.get('dbm-last-area', '')] ? store.get('dbm-last-area', '') : defArea());
    const canNew = can('area.create', { system: curSys().name });
    const SYSTEMS = SYSTEMS_OF(); const sys = SYSTEMS.find(s => s.cur);
    const ST = Object.assign({ tog: {}, w: 0, manual: false, tab: 'm' }, J(treeKey(), {}));
    const save = () => S(treeKey(), ST);
    const SYS = sys.code;
    const autoOpen = new Set();   // paths opened only to reveal a canvas selection — not saved as the user's choice
    let selId = null, focusId = null, q = '', flt = { bad: false, ex: false, noref: false, cls: '' }, rowMap = {}, lastFocus = { parents: [], idx: 0 };
    const live = () => (window.treeData ? window.treeData() : null);
    const pageMode = () => { const l = live(); return l ? l.mode : ['ddl.html', 'outputs.html'].includes(file) ? 'P' : 'L'; };
    // what the tree shows for an area: the canvas's own data for the open area, otherwise that area's current version
    const src = area => {
      const l = live(); const m = getModels()[area];
      if (l && l.area === area) return { E: l.E, R: l.R, ver: l.ver, label: l.label, ro: l.ro, snap: l.snap || null };
      const v = areaView(area); const d = v.model;
      return { E: d.E || [], R: d.R || [], ver: 'v' + v.ver, label: v.hidden ? v.label : '', ro: v.hidden };
    };
    const STC = { comb: '조합 가능', unreg: '미등록', ex: '예외', na: '비대상', req: '신청 중' };
    const entBad = e => e.ref ? 0 : (e.p === '—' ? 1 : 0) + e.a.filter(a => !a.edit && ['comb', 'unreg'].includes(a.s)).length;
    const entDot = e => e.ref ? '<span class="tdot" aria-hidden="true"><i data-ic=ext data-s=12></i></span>' : entBad(e) ? '<span class="tdot half" aria-hidden="true"></span>' : e.a.some(a => a.s === 'ex') ? '<span class="tdot ex" aria-hidden="true"></span>' : '<span class="tdot ok" aria-hidden="true"></span>';
    const entState = e => e.ref ? '참조' : entBad(e) ? `미준수 ${entBad(e)}` : e.a.some(a => a.s === 'ex') ? '예외 있음' : '준수';
    const hitFn = s => { const v = q.trim(); if (!v || s == null) return false; s = String(s); return v.length <= 2 ? s.startsWith(v) || s.toUpperCase().startsWith(v.toUpperCase()) : s.toUpperCase().includes(v.toUpperCase()); };
    const mark = s => { const v = q.trim(); s = esc(s); if (!v) return s; const i = s.toUpperCase().indexOf(esc(v).toUpperCase()); return i < 0 ? s : s.slice(0, i) + '<mark>' + s.slice(i, i + v.length) + '</mark>' + s.slice(i + v.length); };
    const passF = e => (!flt.bad || entBad(e) > 0) && (!flt.ex || e.a.some(a => a.s === 'ex')) && (!flt.noref || !e.ref) && (!flt.cls || e.c === flt.cls);
    const fltOn = () => flt.bad || flt.ex || flt.noref || !!flt.cls;
    const stateBadge = area => { const l = live(); if (l && l.area === area && l.label) return `<span class="tbadge">${esc(l.label)}</span>`; const L = modelLock(area); const m = getModels()[area]; return L.state === 'review' ? '<span class="tbadge">검토</span>' : L.state === 'confirmed' ? '<span class="tbadge">확정</span>' : `<span class="tver" title="작업 중 v${m.ver}">v${m.ver}</span>`; };

    // ---- build the node tree (hierarchical), then flatten what is open
    function build() {
      const models = getModels(), P = pageMode() === 'P', qq = q.trim(); let found = 0;
      const out = [];
      Object.entries(models).forEach(([area, m]) => {
        const s = src(area), k = SYS + ':' + area + '@' + s.ver, tog = ST.tog[k] || {};
        const isOp = (nid, def) => nid in tog ? !!tog[nid] : autoOpen.has(k + '|' + nid) ? true : def;
        const N = (nid, kind, o) => Object.assign({ id: area + '|' + nid, nid, area, key: k, kind, kids: null }, o);
        const ents = s.E.filter(passF);
        const areaHit = hitFn(m.name);
        // the model screen's open view: entities not placed in it are grey, its hidden relation lines say so
        const lv0 = live(), onM = file === 'model.html' && lv0 && lv0.area === area && lv0.V;
        const curV = onM ? lv0.V.find(v => v.id === (lv0.view || 'all')) : null, cvV = curV && curV.id !== 'all' ? curV : null;
        // objects
        const entNodes = ents.map(e => {
          const eh = hitFn(e.n) || hitFn(e.p), ah = e.a.map((a, i) => (hitFn(a.n) || hitFn(a.p)) ? i : -1).filter(i => i >= 0);
          if (qq && !areaHit && !eh && !ah.length) return null;
          found += (eh ? 1 : 0) + ah.length;
          const attrs = e.a.map((a, i) => ({ a, i })).filter(x => !qq || areaHit || eh || ah.includes(x.i));
          const kids = attrs.map(({ a, i }) => N('a:' + e.id + ':' + i, P ? 'col' : 'attr', {
            ent: e.id, ai: i, selectable: true, pk: !!a.pk, fk: !!a.fk,
            html: P ? (a.p === '—' ? `<span class="tn1">${mark(a.n)}</span><span class="tmeta ts-miss">물리명 없음</span>` : `<span class="tn1 mono">${mark(a.p)}</span><span class="tmeta">${esc(a.t)}${a.pk ? ' · PK' : ''}${a.fk ? ' · FK' : ''}</span>`) : `<span class="tn1">${mark(a.n)}</span><span class="tmeta">${a.pk ? 'PK' : ''}${a.fk ? (a.pk ? ' · ' : '') + 'FK' : ''}${STC[a.s] ? `${a.pk || a.fk ? ' · ' : ''}<span class="ts-${a.s}">${STC[a.s]}</span>` : ''}</span>`,
            aria: `${P ? a.p : a.n}${a.pk ? ', PK' : ''}${a.fk ? ', FK' : ''}${STC[a.s] ? ', ' + STC[a.s] : ''}`, title: P ? a.n : `${a.p} · ${a.t}` }));
          const ahNote = qq && !eh && ah.length ? `<span class="tmeta">${P ? '컬럼' : '속성'} ${ah.length}</span>` : '';
          return N('e:' + e.id, P ? 'table' : 'ent', {
            ent: e.id, selectable: true, st: e.ref ? 'ref' : entBad(e) ? 'bad' : e.a.some(a => a.s === 'ex') ? 'ex' : 'ok', gray: (P && !e.ref && (e.px == null || e.py == null)) || (!!cvV && !(cvV.ents || []).includes(e.id)), drag: true,
            html: (() => { const stl = refStale(e), refMeta = e.ref ? `<span class="tmeta">${esc(e.refName || '공통')}${e.refVer ? ' v' + e.refVer + ' 확정' : ''}</span>${stl ? `<span class="tbadge" title="원본 v${stl} 확정본이 나왔습니다 — 메뉴의 [갱신]으로 맞춥니다">갱신</span>` : ''}` : '';
              return P ? `<span class="tn1 mono">${mark(e.p === '—' ? e.n + ' (물리명 없음)' : e.p)}</span>${e.ref ? refMeta : ahNote || `<span class="tmeta">${esc(e.n)}</span>`}` : `${entDot(e)}<span class="tn1">${mark(e.n)}</span>${e.ref ? refMeta : (ahNote || (entBad(e) ? `<span class="tct tbad" title="미준수 ${entBad(e)}">${entBad(e)}</span>` : '')) + `<span class="tmeta mono">${mark(e.p === '—' ? '물리명 없음' : e.p)}</span>`}`; })(),
            aria: `${P ? e.p : e.n}${!P && e.p !== '—' ? ' ' + e.p : ''}, ${entState(e)}${e.ref ? ', ' + (e.refName || '공통') + ' 영역에서 참조' + (refStale(e) ? ', 원본 새 확정본 있음' : '') : ''}${cvV && !(cvV.ents || []).includes(e.id) ? ', 이 보기에 없음' : ''}`, title: P ? e.n : (e.p !== '—' ? e.p : '물리명 없음'),
            open: kids.length && !e.ref ? (qq && ah.length ? true : isOp('e:' + e.id, false)) : null, kids: e.ref ? null : kids });
        }).filter(Boolean);
        const kidsOf = [];
        const FHELP = { 'f:views': '같은 영역의 테이블을 목적별로 나눠 그린 ERD 그림', 'f:ents': '데이터를 담는 표(테이블). 펼치면 컬럼(칸)이 보입니다', 'f:tbls': '실제 DB에 만들어질 테이블. 펼치면 컬럼과 타입이 보입니다', 'f:rels': '두 테이블이 어떻게 이어지는지(예: 부서 → 사원 소속된다)', 'f:prels': '관계마다 FK(다른 테이블을 가리키는 키)가 만들어졌는지', 'f:subs': '하나의 테이블을 종류별로 나눈 구조(예: 정규직 · 계약직)', 'f:std': '이 영역이 쓰는 표준 사전의 용어와 데이터 형식(도메인)', 'f:terms': '표준 사전에 등록된 이름과 영문 약어', 'f:doms': '데이터 형식 묶음(예: 금액N18 = 숫자 18자리)', 'f:cons': 'PK(기본키) · FK(참조키) · UK(중복 금지) 규칙', 'f:ix': '검색을 빠르게 하는 색인', 'f:refs': '다른 업무 영역의 테이블을 읽기 전용으로 가져와 관계만 맺은 것' };
        const folder = (nid, label, kids, o = {}) => N(nid, 'folder', Object.assign({ title: o.title || FHELP[nid] || '', html: `<span class="tn1">${label}</span><span class="tct">${o.count != null ? o.count : kids.length}</span>${o.warn ? '<span class="twarn" aria-hidden="true"></span>' : ''}`, aria: `${label} ${o.count != null ? o.count : kids.length}${o.warn ? ', 경고 있음' : ''}`, open: kids.length ? (qq ? true : isOp(nid, o.def || false)) : null, kids }, o));
        // shortcuts (always visible when the area is open — not hidden in a folder)
        if (!qq) {
          const bad = compOf(s).bad;
          const sn = s.snap ? '&snap=' + s.snap : '';
          [['model.html?area=' + area + sn, '모델'], ['standardize.html?area=' + area, '표준 맞추기', bad, '작업본'], ['ddl.html?area=' + area + sn, 'DDL'], ['outputs.html?area=' + area + sn, '산출물']].forEach((l, j) => kidsOf.push(N('l:' + j, 'link', { href: l[0], html: `${l[1]}${l[2] ? ` <b>${l[2]}</b>` : ''}`, aria: l[1] + (l[2] ? ` 미준수 ${l[2]}` : '') + (l[3] && s.snap ? ', 작업본 기준' : '') })));
          const vs = onM ? lv0.V : viewsOf(area), seeing = onM ? (lv0.view || 'all') : null;
          kidsOf.push(folder('f:views', '다이어그램', vs.map(v => { const n = v.id === 'all' ? s.E.length : (v.ents || []).length;
            return N('v:' + v.id, 'view', { view: v.id, selectable: true, html: `<span class="tn1">${esc(v.n)}</span><span class="tct">${n}</span>${v.id === seeing ? '<span class="tmeta">보는 중</span>' : ''}`, aria: `${v.n}, 엔터티 ${n}${v.id === 'all' ? ', 기본 보기' : ''}${v.id === seeing ? ', 보는 중' : ''}` }); }), { def: !!onM && seeing !== 'all' }));
        }
        if (!P) {
          if (entNodes.length || !qq) kidsOf.push(folder('f:ents', '엔터티', groupEnts(entNodes, area, isOp), { def: area === cur, count: qq ? entNodes.filter(n => !s.E.find(e => e.id === n.ent).ref).length : ents.filter(e => !e.ref).length }));
          const refNodes = entNodes.filter(n => s.E.find(e => e.id === n.ent).ref);
          if (refNodes.length) kidsOf.push(folder('f:refs', '다른 영역에서 참조', refNodes, { def: false, title: '다른 업무 영역의 엔터티를 읽기 전용으로 가져와 관계만 맺습니다' }));
          const rels = s.R.filter(r => ents.some(e => e.id === r.f) && ents.some(e => e.id === r.t)).map((r, i) => ({ r, i })).filter(({ r }) => { const a = s.E.find(e => e.id === r.f), b = s.E.find(e => e.id === r.t); return !qq || areaHit || hitFn(a.n) || hitFn(b.n) || hitFn(r.name); });
          if (rels.length || !qq) kidsOf.push(folder('f:rels', '관계', rels.map(({ r, i }) => { const a = s.E.find(e => e.id === r.f), b = s.E.find(e => e.id === r.t); return N('r:' + i, 'rel', { rel: i, ent: r.t, selectable: true, html: `<span class="tn1">${esc(a.n)} → ${esc(b.n)}</span><span class="tmeta">${esc(r.name || '')}${curV && (curV.hide || []).includes(relKey(r)) ? ' · 선 숨김' : ''}</span>`, aria: `${a.n}에서 ${b.n}, ${({ nonid: '비식별', id: '식별', one: '1:1', mn: 'M:N' })[r.k] || ''}`, title: ({ nonid: '1:N 비식별', id: '1:N 식별', one: '1:1', mn: 'M:N' })[r.k] }); })));
          const subs = ents.filter(e => e.sub && (!qq || areaHit || hitFn(e.n)));
          if (subs.length) kidsOf.push(folder('f:subs', '서브타입', subs.map(e => N('s:' + e.id, 'ent', { ent: e.id, selectable: true, html: `<span class="tn1">${esc(e.n)}</span><span class="tmeta">${esc(e.sub.kind)} · ${e.sub.kids.length}</span>`, aria: `${e.n} 서브타입 ${e.sub.kind}`, title: e.sub.kids.join(', ') }))));
        } else {
          if (entNodes.length || !qq) kidsOf.push(folder('f:tbls', '테이블', groupEnts(entNodes, area, isOp), { def: area === cur, count: qq ? entNodes.filter(n => !s.E.find(e => e.id === n.ent).ref).length : ents.filter(e => !e.ref).length }));
          const refT = entNodes.filter(n => s.E.find(e => e.id === n.ent).ref);
          if (refT.length) kidsOf.push(folder('f:refs', '다른 영역에서 참조', refT, { def: false, title: '다른 업무 영역의 테이블 · FK가 가리키는 원본' }));
          const pr = s.R.map((r, i) => ({ r, i, f: fkOf(r, s.E) })).filter(x => x.f.st !== 'none' && ents.some(e => e.id === x.r.t)).filter(({ r }) => { const a = s.E.find(e => e.id === r.f), b = s.E.find(e => e.id === r.t); return !qq || areaHit || hitFn(a.p) || hitFn(b.p); });
          const FST = { ok: '반영', ex: '제외', miss: '누락', mn: '해소 필요' };
          const miss = pr.filter(x => x.f.st === 'miss').length;
          if (pr.length || !qq) kidsOf.push(folder('f:prels', '관계 (FK)', pr.map(({ r, i, f }) => { const a = s.E.find(e => e.id === r.f), b = s.E.find(e => e.id === r.t); return N('pr:' + i, 'prel', { rel: i, ent: r.t, selectable: true, html: `${f.st === 'miss' ? '<span class="twarn" aria-hidden="true"></span>' : ''}<span class="tn1 mono">${esc(a.p === '—' ? a.n : a.p)} → ${esc(b.p === '—' ? b.n : b.p)}</span><span class="tmeta ts-${f.st}">${FST[f.st]}</span>`, aria: `${a.p}에서 ${b.p}, FK ${FST[f.st]}${f.why ? ', ' + f.why : ''}`, title: f.st === 'ok' ? f.name + ' (' + f.cols.join(', ') + ')' : f.why }); }), { warn: miss > 0, def: miss > 0 && area === cur }));
          if (!qq) {
            const cons = []; const ixs = [];
            ents.forEach(e => { const c = consOf(e, s.E, s.R); if (c.pk) cons.push(['PK', c.pk, e]); c.uk.forEach(u => cons.push(['UK', u, e])); c.fk.forEach(f => cons.push(['FK', f, e])); c.ix.forEach(x => ixs.push([x, e])); });
            const cnt = t => cons.filter(c => c[0] === t).length;
            kidsOf.push(folder('f:cons', `제약조건 · PK ${cnt('PK')} · FK ${cnt('FK')} · UK ${cnt('UK')}`, cons.map(([t, c, e], i) => N('c:' + i, 'cons', { ent: e.id, selectable: true, html: `<span class="tkind">${t}</span><span class="tn1 mono">${esc(c.n)}</span>`, aria: `${t} ${c.n}, ${c.c}`, title: c.c })), { count: cons.length, warn: miss > 0 }));
            kidsOf.push(folder('f:ix', '인덱스', ixs.map(([x, e], i) => N('i:' + i, 'ix', { ent: e.id, selectable: true, html: `<span class="tn1 mono">${esc(x.n)}</span><span class="tmeta">${x.auto ? 'FK 인덱스' : esc(x.c)}</span>`, aria: `인덱스 ${x.n}, ${x.c}`, title: x.c }))));
          }
        }
        // standards this area uses (the dictionary stays the source)
        const dict = getDict(); const own = ents.filter(e => !e.ref);
        const tmap = {}; own.forEach(e => e.a.forEach(a => { if (a.s !== 'ok' || a.p === '—' || tmap[a.n]) return; const d0 = dict.find(d => d.k === 'term' && d.name === a.n); tmap[a.n] = { id: d0 ? d0.id : 'a-' + a.n, name: a.n, abbr: a.p, dom: (d0 && d0.dom) || a.dom || '' }; }));
        const terms = Object.values(tmap).filter(d => !qq || hitFn(d.name) || hitFn(d.abbr)).sort((x, y) => x.name.localeCompare(y.name, 'ko'));
        const doms = [...new Set(terms.map(d => d.dom).filter(x => x && x !== '—'))];
        const unreg = own.reduce((n, e) => n + e.a.filter(a => a.s === 'unreg').length, 0);
        if (qq) found += terms.length;
        if (terms.length || !qq) {
          const tk = terms.map(d => N('t:' + d.id, 'term', { term: d.name, ents: own.filter(e => e.a.some(a => a.n === d.name)).map(e => e.id), selectable: true, html: `<span class="tn1">${mark(d.name)}</span><span class="tmeta mono">${esc(d.abbr)}</span>`, aria: `용어 ${d.name}, ${d.abbr}`, title: d.dom }));
          const dk = doms.map(dm => { const used = own.filter(e => e.a.some(a => terms.some(d => d.dom === dm && d.name === a.n))); return N('d:' + dm, 'dom', { dom: dm, ents: used.map(e => e.id), selectable: true, html: `<span class="tn1">${esc(dm)}</span><span class="tmeta">엔터티 ${used.length}</span>`, aria: `도메인 ${dm}, 엔터티 ${used.length}` }); });
          kidsOf.push(N('f:std', 'folder', { html: `<span class="tn1">표준 용어 · 도메인</span><span class="tct">용어 ${terms.length} · 도메인 ${doms.length}${unreg ? ` · 미등록 ${unreg}` : ''}</span>`, aria: `표준 용어와 도메인, 용어 ${terms.length}, 도메인 ${doms.length}${unreg ? ', 미등록 ' + unreg : ''}`, open: qq && terms.length ? true : isOp('f:std', false),
            kids: [folder('f:terms', '용어', tk), folder('f:doms', '도메인', dk)].filter(f => f.kids.length || !qq) }));
        }
        if (qq && !areaHit && !kidsOf.length) return;
        if (qq && areaHit) found++;
        out.push(N('area', 'area', { desc: m.desc || '', title: m.desc ? `${m.name} — ${m.desc} · 엔터티 ${s.E.filter(e => !e.ref).length}` : '', html: `<span class="tn1"><b>${mark(m.name)}</b></span>${stateBadge(area)}`, aria: `${m.name}, ${area === cur && live() && live().label ? live().label : '업무 영역'}${m.desc ? ', ' + m.desc : ''}`, open: qq ? true : isOp('area', area === cur), kids: kidsOf }));
      });
      return { nodes: out, found };
    }
    // entities by kind (기준 정보 · 거래 · 이력 · 코드) once an area has more than 6 — ERP areas read like their business
    const KIND = { M: ['기준 정보', '고객 · 품목 · 사원처럼 오래 두고 쓰는 정보와 그 하위 정보'], A: ['거래', '주문 · 발주 · 전표처럼 업무가 일어날 때마다 쌓이는 정보'], H: ['이력', '변경 · 상태 기록'], K: ['코드 · 분류', '분류 체계 · 직급 같은 기준 코드'] };
    function groupEnts(nodes, area) {
      const s = src(area), own = nodes.filter(n => !s.E.find(e => e.id === n.ent).ref);
      const kinds = ['M', 'K', 'A', 'H'].filter(c => own.some(n => s.E.find(e => e.id === n.ent).c === c));
      if (kinds.length < 2) return own;
      const out = [];
      kinds.forEach(c => { const k = own.filter(n => s.E.find(e => e.id === n.ent).c === c); k[0].grp = { label: KIND[c][0], n: k.length, title: KIND[c][1] }; k.forEach(n => { n.aria += ', ' + KIND[c][0]; }); out.push(...k); });
      return out;
    }
    function flatten(nodes, lvl, parent, acc) {
      nodes.forEach((n, i) => { n.lvl = lvl; n.pos = i + 1; n.size = nodes.length; n.parent = parent; acc.push(n); if (n.kids && n.open) flatten(n.kids, lvl + 1, n.id, acc); });
      return acc;
    }
    // ---- markup
    const tabs = page === 'model' && document.getElementById('side');
    nav.innerHTML = `
      ${tabs ? `<div class="ltabs" role="tablist" aria-label="왼쪽 칸"><button role="tab" id="lt-m" aria-controls="tp-model" data-lt="m">모델</button><button role="tab" id="lt-d" aria-controls="tp-dict" data-lt="d">사전</button></div>` : ''}
      <div class="tpanel" id="tp-model"${tabs ? ' role="tabpanel" aria-labelledby="lt-m"' : ''}>
        <div class="tfull" id="tr-full">
          <div class="tsys">
            <a class="tsys-a${page === 'system' ? ' on' : ''}" href="system.html"${page === 'system' ? ' aria-current="page"' : ''} title="시스템 홈"><b>${sys.name}</b><span>${sys.db} · ${sys.code}</span></a>
            <span class="tmw"><button class="tsw" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-sys" aria-label="시스템 바꾸기"><i data-ic=down data-s=14></i></button><div class="menu" data-auto id="mn-sys">${SYSTEMS.map(s => `<a class="mi${s.cur ? ' on' : ''}" href="${s.href}"${s.cur ? ' aria-current="true"' : ''}><span>${s.name}</span><span class="caption muted" style="margin-left:auto">${s.db}</span></a>`).join('')}</div></span>
          </div>
          <div class="tfrow">
            <label class="tfind"><i data-ic=search data-s=14></i><input id="tr-q" type="search" placeholder="엔터티·속성·테이블·용어 찾기" aria-label="모델 객체 찾기" autocomplete="off"></label>
            <span class="tmw"><button class="tfb" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-tf" aria-label="거르기" title="거르기"><i data-ic=filter data-s=14></i></button><div class="menu" data-auto id="mn-tf">
              <label class="mi"><input type="checkbox" data-tf="bad"> 미준수만</label><label class="mi"><input type="checkbox" data-tf="ex"> 예외 있는 것만</label><label class="mi"><input type="checkbox" data-tf="noref"> 참조 숨기기</label>
              <div class="sep"></div><div class="mi" style="cursor:default">분류<span class="seg" style="margin-left:auto">${['', 'M', 'A', 'H', 'K'].map(c => `<button type="button" data-tc="${c}" class="${c === '' ? 'on' : ''}">${({ '': '전체', M: '기준', A: '거래', H: '이력', K: '코드' })[c]}</button>`).join('')}</span></div></div></span>
          </div>
          <div class="tfbar" id="tr-fbar" hidden></div>
          <div class="sr-only" id="tr-live" aria-live="polite"></div>
          <div class="tro" id="tr-ro" hidden></div>
          <div class="tsec"><span>업무 영역</span><span class="tsec-r"><span class="tmw"><button class="tadd" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-thelp" aria-label="트리 보는 법" title="트리 보는 법"><i data-ic=help data-s=14></i></button><div class="menu thelp" data-auto id="mn-thelp">
            <div class="thelp-h">트리 보는 법 <span class="caption muted">예: 통합ERP · 인사관리</span></div>
            ${[['db', '업무 영역', '시스템 안의 업무 묶음. 버전과 결재(확정)의 단위입니다', '인사관리 · 재무관리 · 회계관리'], ['flow', '다이어그램', '같은 영역의 테이블을 목적별로 나눠 그린 ERD', '급여 · 근태 · 휴가'], ['table', '테이블(엔터티)', '데이터를 담는 표. 오른쪽 회색 글자가 DB 이름입니다', '사원기본 = EMP_M'], ['col', '컬럼(속성)', '테이블의 칸', '사원명 · 입사일자'], ['key', '기본키(PK)', '행 하나를 구별하는 값', '사원번호'], ['link', 'FK · 관계', '다른 테이블을 가리키는 칸, 테이블 사이의 연결', '부서 → 사원 (소속된다)'], ['layers', '서브타입', '한 테이블을 종류별로 나눈 구조', '정규직 · 계약직'], ['term', '표준 용어', '표준 사전에 등록된 이름과 영문 약어', '사원번호 = EMP_NO'], ['tag', '도메인', '데이터 형식 묶음', '금액N18 · 연월일C8'], ['shield', '제약조건', '물리 모드: PK · FK · UK 규칙', 'EMP_M_PK'], ['list', '인덱스', '물리 모드: 검색을 빠르게 하는 색인', 'EMP_M_IX01'], ['ext', '참조', '다른 영역의 테이블을 읽기 전용으로 가져온 것', '회계관리의 은행계좌']].map(([ic, n, d, ex]) => `<div class="thelp-r"><span class="tico"><i data-ic=${ic} data-s=14></i></span><div><b>${n}</b><div class="caption">${d}</div><div class="caption faint">예: ${ex}</div></div></div>`).join('')}
            <div class="thelp-st"><span class="tico ti-ok"><i data-ic=table data-s=14></i></span>표준 준수 <span class="tico ti-bad"><i data-ic=table data-s=14></i></span>미준수 있음(숫자 = 개수) <span class="tico ti-ex"><i data-ic=table data-s=14></i></span>예외 있음</div>
          </div></span>${canNew ? '<a class="tadd" href="system.html#new" aria-label="새 업무 영역" title="새 업무 영역"><i data-ic=plus data-s=14></i></a>' : ''}</span></div>
          <div role="tree" id="tr-tree" class="otree"></div>
          <div class="tsep"></div>
          <a class="tl${file === 'model.html' && qp.get('sys') ? ' on" aria-current="page' : ''}" href="model.html?sys=1"><i data-ic=compare></i>시스템 전체 ERD</a>
          <a class="tl${file === 'import.html' ? ' on" aria-current="page' : ''}" href="import.html"><i data-ic=upload></i>DDL 가져오기</a>
          <div class="tsec"><span>최근 연 엔터티</span></div>
          <div id="tr-rec"></div>
        </div>
      </div>
      ${tabs ? '<div class="tpanel" id="tp-dict" role="tabpanel" aria-labelledby="lt-d" hidden></div>' : ''}
      <div class="tmini" aria-label="접힌 모델 트리">
        <a class="tm-i${page === 'system' ? ' on" aria-current="page' : ''}" href="system.html" title="시스템 홈 · ${sys.name}" aria-label="시스템 홈"><i data-ic=table></i></a>
        ${Object.entries(models0).map(([id, m]) => `<a class="tm-i tm-a${id === famArea ? ' on" aria-current="true' : ''}" href="model.html?area=${id}" title="${esc(m.name)}" aria-label="${esc(m.name)}">${esc(String(m.name).trim()[0])}</a>`).join('')}
        <a class="tm-i${file === 'model.html' && qp.get('sys') ? ' on" aria-current="page' : ''}" href="model.html?sys=1" title="시스템 전체 ERD" aria-label="시스템 전체 ERD"><i data-ic=compare></i></a>
        <a class="tm-i${file === 'import.html' ? ' on" aria-current="page' : ''}" href="import.html" title="DDL 가져오기" aria-label="DDL 가져오기"><i data-ic=upload></i></a>
      </div>
      <button class="tcollapse" id="tr-min" type="button"></button>
      <div class="tresize" id="tr-rs" role="separator"${['model.html', 'standardize.html', 'ddl.html', 'outputs.html', 'import.html'].includes(file) ? '' : ' hidden'} aria-orientation="vertical" aria-label="모델 트리 폭" tabindex="0" title="끌어서 폭 조절 · 두 번 누르면 내용에 맞춤"></div>`;
    const tree = nav.querySelector('#tr-tree'), qIn = nav.querySelector('#tr-q');
    const recHtml = () => { const models = getModels(); const rec = J(recKey(), []).filter(r => models[r.area] && (modelOf(r.area, models[r.area].ver).E || []).some(e => e.id === r.id));
      return rec.length ? rec.map(r => `<a class="tl" href="model.html?area=${r.area}&focus=${r.id}"><i data-ic=history></i><span class="tt">${esc(r.n)}</span><span class="tn">${esc(models[r.area].name)}</span></a>`).join('') : '<div class="tempty">모델에서 엔터티를 열면 여기에 남습니다</div>'; };
    nav.querySelector('#tr-rec').innerHTML = recHtml();
    window.addEventListener('dbm-recent', () => { nav.querySelector('#tr-rec').innerHTML = recHtml(); });

    // ---- render rows
    function render() {
      const had = tree.contains(document.activeElement);
      const { nodes, found } = build();
      const rows = flatten(nodes, 1, null, []);
      rowMap = {}; rows.forEach(r => { rowMap[r.id] = r; });
      if (!focusId || !rowMap[focusId]) { const anc = lastFocus.parents.find(p => rowMap[p]); focusId = anc || (rows[Math.min(lastFocus.idx, rows.length - 1)] || {}).id || (selId && rowMap[selId] ? selId : null); }
      let html = '';
      const FICON = { 'f:views': 'flow', 'f:ents': 'table', 'f:tbls': 'table', 'f:rels': 'link', 'f:prels': 'link', 'f:subs': 'layers', 'f:std': 'term', 'f:terms': 'term', 'f:doms': 'tag', 'f:cons': 'shield', 'f:ix': 'list', 'f:refs': 'ext' };
      const KICON = { area: 'db', view: 'flow', rel: 'link', prel: 'link', cons: 'shield', ix: 'list', term: 'term', dom: 'tag' };
      const iconOf = r => r.kind === 'folder' ? FICON[r.nid] : r.kind === 'ent' || r.kind === 'table' ? 'table' : r.kind === 'attr' || r.kind === 'col' ? (r.pk ? 'key' : r.fk ? 'link' : 'col') : KICON[r.kind];
      const icoCls = r => r.kind === 'ent' || r.kind === 'table' ? ' ti-' + (r.st || 'ok') : r.kind === 'attr' || r.kind === 'col' ? (r.pk ? ' ti-pk' : r.fk ? ' ti-fk' : '') : r.kind === 'area' ? ' ti-db' : '';
      rows.forEach((r, i) => {
        if (r.kind === 'link') {
          const first = !rows[i - 1] || rows[i - 1].kind !== 'link', last = !rows[i + 1] || rows[i + 1].kind !== 'link';
          html += (first ? `<div class="tlinks" role="none" style="--lv:${r.lvl}">` : '') + `<a role="treeitem" class="tlink" href="${r.href}" data-id="${esc(r.id)}" aria-level="${r.lvl}" aria-posinset="${r.pos}" aria-setsize="${r.size}" aria-label="${esc(r.aria)}" tabindex="${focusId === r.id ? 0 : -1}"${file === r.href.split('?')[0] && r.area === famArea ? ' aria-current="page"' : ''}>${r.html}</a>` + (last ? '</div>' : '');
          return;
        }
        if (r.grp) html += `<div class="tgrp" role="none" style="--lv:${r.lvl}" title="${esc(r.grp.title)}">${r.grp.label}<span>${r.grp.n}</span></div>`;
        html += `<div role="treeitem" aria-haspopup="menu"${r.drag ? ' draggable="true"' : ''} class="trow2 k-${r.kind}${r.id === selId ? ' sel' : ''}${r.gray ? ' gray' : ''}" data-id="${esc(r.id)}" aria-level="${r.lvl}" aria-posinset="${r.pos}" aria-setsize="${r.size}"${r.open != null ? ` aria-expanded="${r.open}"` : ''}${r.selectable ? ` aria-selected="${r.id === selId}"` : ''} tabindex="${r.id === focusId ? 0 : -1}" aria-label="${esc(r.aria || '')}"${r.title ? ` title="${esc(r.title)}"` : ''} style="--lv:${r.lvl}"><span class="ttw" data-tw aria-hidden="true">${r.open == null ? '' : `<i data-ic=${r.open ? 'down' : 'right'} data-s=12></i>`}</span>${iconOf(r) ? `<span class="tico${icoCls(r)}" aria-hidden="true"><i data-ic=${iconOf(r)} data-s=14></i></span>` : ''}${r.html.replace(/^<span class="tdot[^"]*" aria-hidden="true">(<i[^>]*><\/i>)?<\/span>/, '')}<span class="tmore" data-tmore aria-hidden="true" title="메뉴 (Shift+F10)"><i data-ic=more data-s=14></i></span></div>`;
        if (r.kind === 'area' && r.open && r.desc && !q.trim()) html += `<div class="tdesc" role="none" style="--lv:${r.lvl + 1}">${esc(r.desc)}</div>`;
      });
      tree.innerHTML = html || '<div class="tempty">맞는 객체가 없습니다</div>';
      const l = live(); const curName = (getModels()[cur] || {}).name || '';
      tree.setAttribute('aria-label', `모델 트리 · ${curName}${l && l.label ? ' ' + l.label : ''} · ${pageMode() === 'P' ? '물리' : '논리'}`);
      const ro = nav.querySelector('#tr-ro'); ro.hidden = !(l && l.ro); if (l && l.ro) ro.textContent = `${l.label} · 조회 전용`;
      nav.querySelector('#tr-live').textContent = q.trim() ? (found ? `${found}건 찾음` : '맞는 객체가 없습니다') : '';
      const fb = nav.querySelector('#tr-fbar'); fb.hidden = !fltOn();
      if (fltOn()) fb.innerHTML = `<span>${[flt.bad && '미준수만', flt.ex && '예외 있는 것만', flt.noref && '참조 숨김', flt.cls && ({ M: '기준 정보', A: '거래', H: '이력', K: '코드 · 분류' })[flt.cls] + '만'].filter(Boolean).join(' · ')}</span><button type="button" class="btn ghost sm" id="tr-fclr">지우기</button>`;
      if (had) { const f = tree.querySelector('[tabindex="0"]'); if (f) f.focus({ preventScroll: true }); else if (q.trim()) qIn.focus(); }
      if (focusId && rowMap[focusId]) { const fr = rowMap[focusId]; const ps = []; let p = fr.parent; while (p) { ps.push(p); p = rowMap[p] && rowMap[p].parent; } lastFocus = { parents: ps, idx: rows.indexOf(fr) }; }
      fit();
    }
    let raf = 0; const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
    function markSel() { tree.querySelectorAll('.trow2').forEach(el => { const on = el.dataset.id === selId; el.classList.toggle('sel', on); if (el.hasAttribute('aria-selected')) el.setAttribute('aria-selected', on); }); }
    const toggle = (id, v) => { const r = rowMap[id]; if (!r || r.open == null) return; const t0 = ST.tog[r.key] = ST.tog[r.key] || {}; t0[r.nid] = v == null ? !r.open : v; save(); focusId = id; render(); };
    const focusRow = el => { if (!el) return; tree.querySelectorAll('[tabindex="0"]').forEach(x => x.tabIndex = -1); el.tabIndex = 0; el.focus(); focusId = el.dataset.id; };
    // selecting tells the page; a page that doesn't handle it (home, system home) opens the model screen
    function select(r, fit) {
      if (r.kind === 'folder' || r.kind === 'area') { toggle(r.id); return; }
      if (r.selectable) { selId = r.id; focusId = r.id; markSel(); }
      const d = { area: r.area, kind: r.kind, id: r.ent || null, ai: r.ai != null ? r.ai : null, rel: r.rel != null ? r.rel : null, view: r.view || null, term: r.term || r.dom || null, ents: r.ents || null, fit: !!fit };
      const ev = new CustomEvent(fit && (r.kind === 'term' || r.kind === 'dom') ? 'dbm-tree-highlight' : 'dbm-tree-select', { cancelable: true, detail: d });
      if (!window.dispatchEvent(ev)) return;
      if (r.kind === 'term' || r.kind === 'dom') { if (fit && r.ents && r.ents[0]) location.href = `model.html?area=${r.area}&focus=${r.ents[0]}`; else location.href = `dictionary.html?q=${encodeURIComponent(r.term || r.dom)}`; return; }
      if (r.kind === 'view') { location.href = `model.html?area=${r.area}&view=${encodeURIComponent(r.view)}`; return; }
      if (d.id) location.href = `model.html?area=${r.area}&focus=${d.id}${d.ai != null ? '&attr=' + d.ai : ''}`;
    }
    tree.addEventListener('click', e => {
      const a = e.target.closest('a.tlink'); if (a) return;   // shortcuts are plain links
      const el = e.target.closest('[role=treeitem]'); if (!el) return; const r = rowMap[el.dataset.id]; if (!r) return;
      const mb = e.target.closest('[data-tmore]'); if (mb) { e.stopPropagation(); if (!ctx.hidden && ctxRow && ctxRow.id === r.id) { closeMenu(false); return; } focusRow(el); const b = mb.getBoundingClientRect(); openMenu(r, b.left, b.bottom + 2, el); return; }
      if (e.target.closest('[data-tw]') && r.open != null) { toggle(r.id); return; }
      const now = Date.now();
      if (r.selectable && lastClick.id === r.id && now - lastClick.t < 450) { lastClick = {}; select(r, true); return; }   // double click = fit (works even if the row was redrawn)
      lastClick = { id: r.id, t: now }; select(r, false);
    });
    let lastClick = {}, kbSel = false, t2Told = false;
    window.treeKeyboardSelect = () => kbSel;
    tree.addEventListener('keydown', e => {
      const el = e.target.closest('[role=treeitem]'); if (!el) return;
      // keys the tree handles stop here — the row may be redrawn, so the page's own shortcuts (Enter = add attribute, Delete) must never see them
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key !== 'Tab' && e.key !== 'Escape') e.stopPropagation();
      const items = [...tree.querySelectorAll('[role=treeitem]')]; const i = items.indexOf(el); const r = rowMap[el.dataset.id];
      const go = j => { e.preventDefault(); focusRow(items[Math.max(0, Math.min(items.length - 1, j))]); };
      if (e.key === 'ArrowDown') return go(i + 1);
      if (e.key === 'ArrowUp') return go(i - 1);
      if (e.key === 'Home') return go(0);
      if (e.key === 'End') return go(items.length - 1);
      if (e.key === 'ArrowRight') { e.preventDefault(); if (r && r.open === false) toggle(r.id, true); else if (r && r.open) go(i + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (r && r.open) toggle(r.id, false); else { const pid = r ? r.parent : rowMap[el.dataset.id] && rowMap[el.dataset.id].parent; const p = pid && tree.querySelector(`[data-id="${CSS.escape(pid)}"]`); if (p) focusRow(p); } return; }
      if (e.key === ' ' && el.matches('a.tlink')) { e.preventDefault(); el.click(); return; }
      if (e.key === 'Enter' || e.key === ' ') { if (el.matches('a.tlink')) return; e.preventDefault(); if (r) { kbSel = true; select(r, false); kbSel = false; } return; }
      if (e.key === '*') { e.preventDefault(); if (!r) return; const sib = Object.values(rowMap).filter(x => x.parent === r.parent && x.open === false); sib.forEach(x => { const t0 = ST.tog[x.key] = ST.tog[x.key] || {}; t0[x.nid] = true; }); save(); render(); return; }
      if ((e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) && !el.matches('a.tlink')) { e.preventDefault(); if (r && r.kind !== 'link') { const b = el.getBoundingClientRect(); openMenu(r, b.left + 24, b.bottom + 2, el); } return; }
      if (e.key === 'F2' || e.key === 'Delete') { e.preventDefault(); if (!r || r.kind === 'link') return; const want = e.key === 'F2' ? ['rename', 'vren'] : ['delete', 'delrel']; const it = menuOf(r).find(x => want.includes(x.id));
        if (!it) { toast(e.key === 'F2' ? '이 항목은 이름을 바꿀 수 없습니다' : '이 항목은 트리에서 지울 수 없습니다', 'info'); return; } runCmd(r, it); return; }
      if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {   // type-ahead
        const ch = e.key.toUpperCase(); const order = items.slice(i + 1).concat(items.slice(0, i + 1));
        const hit = order.find(x => (x.getAttribute('aria-label') || x.textContent).trim().toUpperCase().startsWith(ch)); if (hit) { e.preventDefault(); focusRow(hit); }
      }
    });
    // ---- T2 node menus (12 §4.3): right click · ⋯ · Shift+F10 / menu key · F2 · Delete
    // a command goes to the page first (dbm-tree-cmd); a page that does not take it opens the model screen and runs it there (&cmd=)
    const editWhy = (r, e) => {
      if (e && e.ref) return '다른 영역에서 참조한 객체 — 원본 영역에서만 고칠 수 있습니다';
      // only the model screen's own view decides "read-only here"; DDL · outputs · standardize show a copy, and their commands open the model screen
      const l = live(), onModel = file === 'model.html' && l && l.area === r.area;
      if (onModel && (l.snap || /^snap:/.test(l.ver || ''))) return '제출본은 조회 전용입니다';
      // a screen showing another version (DDL · outputs on a confirmed / submitted copy): its rows are not the working copy's rows
      const wv = 'v' + ((getModels()[r.area] || {}).ver || '');
      if (!onModel && l && l.area === r.area && l.ver && l.ver !== wv) return `이 화면은 ${/^snap:/.test(l.ver) ? '제출본 ' + l.ver.slice(5) : l.ver + ' 확정본'}을 보여 줍니다 — 작업본(${wv}) 모델 화면에서 편집하세요`;
      const L = modelLock(r.area);
      if (L.state === 'review') return '결재 중이라 편집할 수 없습니다 — 회수하거나 결재가 끝난 뒤 편집하세요';
      if (L.state === 'confirmed') return '확정본은 고칠 수 없습니다 — 다음 작업 버전에서 편집하세요';
      if (!can('model.edit', { area: r.area })) return ME.has && ME.has('modeler') ? `담당 시스템에 ${sysOfArea(r.area)} 영역이 없어 조회만 할 수 있습니다` : '모델 편집은 모델러만 할 수 있습니다';
      if (onModel ? l.ro : areaView(r.area).hidden) return `${(onModel ? l.label : areaView(r.area).label) || '결재 중'} · 조회 전용`;
      return null;
    };
    const T3 = '보기 나누기는 다음 단계(T3)에서 동작합니다 — 지금은 전체 보기 하나입니다';
    function menuOf(r) {
      const s = src(r.area), e = r.ent ? s.E.find(x => x.id === r.ent) : null, P = pageMode() === 'P';
      const I = (id, label, o = {}) => Object.assign({ id, label }, o), SEP = { sep: 1 };
      const ed = (id, label, o = {}) => I(id, label, Object.assign({ why: editWhy(r, 'ent' in o ? o.ent : e) }, o));
      const fold = [I('expand', '모두 펼치기'), I('collapse', '모두 접기')];
      // T3: what the model screen has open — its view, and (for another area's entity) the area a reference would go into
      const lv = live(), onM = file === 'model.html' && lv && lv.V && lv.area === r.area, seeing = onM ? (lv.view || 'all') : null;
      const curV = onM ? lv.V.find(v => v.id === seeing) : null;
      const here = file === 'model.html' && lv && lv.V && lv.area !== r.area ? lv.area : null;
      const hereWhy = () => { if (!here) return null; const tm = getModels()[here]; const L = modelLock(here);
        if (L.state !== 'edit' || (lv && lv.ro)) return `${(tm || {}).name || '지금 영역'}${josa((tm || {}).name || '영역', '이/가').slice(-1)} 조회 전용이라 참조를 더할 수 없습니다`;
        if (!can('model.edit', { area: here })) return '지금 영역을 편집할 권한이 없습니다';
        const sm = getModels()[r.area]; if (!sm || !sm.base) return `${(sm || {}).name || '원본'}에는 아직 확정본이 없어 참조할 수 없습니다 — 원본이 확정된 뒤 참조합니다`;
        if (lv.E.some(x => x.ref && x.refArea === r.area && (x.refId || x.id) === r.ent)) return '이미 지금 영역에서 참조하고 있습니다';
        return null; };
      if (r.kind === 'area') return [I('open', '모델 열기'), I('std', '표준 맞추기'), I('ddl', 'DDL 만들기'), I('outputs', '산출물'), SEP, I('hist', '결재함 열기'), ed('vnew', '보기 추가', { ent: null }), I('dup', '영역 복제', { mock: '영역 복제는 목업에서 시연만 합니다 — 복제본은 새 업무 영역 v1 작업 중으로 만들어집니다' }), SEP, ...fold];
      if (r.kind === 'folder') {
        if (r.nid === 'f:ents' || r.nid === 'f:tbls') return [ed('newent', P ? '새 테이블' : '새 엔터티', { ent: null, key: 'E' }), I('grid', '표 보기 · 일괄 편집'), SEP, ...fold];
        if (r.nid === 'f:views') return [ed('vnew', '새 보기', { ent: null }), SEP, ...fold];
        if (r.nid === 'f:std' || r.nid === 'f:terms') return [I('dictopen', '사전 화면 열기'), I('cand', '후보 큐 보기'), SEP, ...fold];
        if (r.nid === 'f:rels') return [ed('newrel', '새 관계', { ent: null, key: 'R' }), SEP, ...fold];
        return fold;
      }
      if (r.kind === 'ent' || r.kind === 'table') {
        if (!e) return [];
        const addRef = here && !e.ref ? [I('addref', `지금 영역(${(getModels()[here] || {}).name || ''})에 참조 추가`, { why: hereWhy() }), SEP] : [];
        const inCur = !curV || curV.id === 'all' || (curV.ents || []).includes(e.id);
        const unplace = ed('unplace', '보기에서 빼기', { why: !onM ? '모델 화면에서 보기를 열고 뺍니다' : seeing === 'all' ? '전체 보기에서는 뺄 수 없습니다 — 엔터티를 지우려면 [삭제]를 쓰세요' : !inCur ? '이 보기에 없습니다' : editWhy(r, e.ref ? null : e) });
        const place = ed('place', '보기에 배치…', { ent: null });
        if (e.ref) { const st = refStale(e);
          return [...addRef, I('select', '선택'), I('fit', '위치 맞춤'), I('src', `원본 열기${e.refName ? ' · ' + e.refName : ''}`), ed('refresh', st ? `갱신 · 원본 v${st} 확정본으로` : '갱신', { ent: null, why: editWhy(r, null) || (st ? null : `원본 v${e.refVer || '?'} 확정본과 같습니다 — 갱신할 것이 없습니다`) }), I('used', '사용처 (관계)'), SEP, place, unplace, ed('delete', '참조 해제', { ent: null, key: 'Delete', danger: 1 })]; }
        return [...addRef, I('select', '선택'), I('fit', '위치 맞춤'), SEP, ed('rename', '이름 바꾸기', { key: 'F2' }), ed('addattr', P ? '컬럼 추가' : '속성 추가', { key: 'Insert' }), I('std', '표준 맞추기'), I('ddl', 'DDL 미리보기'), I('used', '사용처 (관계)'), SEP, place, unplace, ed('delete', P ? '테이블 삭제' : '엔터티 삭제', { key: 'Delete', danger: 1 })];
      }
      if (r.kind === 'attr' || r.kind === 'col') {
        const a = e && e.a[r.ai]; if (!a || a.edit) return [];
        const grp = e.a.filter(x => !!x.pk === !!a.pk), gi = grp.indexOf(a), w = editWhy(r, e);
        return [I('select', '선택'), SEP, ed('rename', '이름 바꾸기', { key: 'F2' }),
          ed('up', '위로', { key: 'Alt+↑', why: w || (gi <= 0 ? `이미 ${a.pk ? '식별자' : '일반 속성'} 중 맨 위입니다` : null) }), ed('down', '아래로', { key: 'Alt+↓', why: w || (gi >= grp.length - 1 ? `이미 ${a.pk ? '식별자' : '일반 속성'} 중 맨 아래입니다` : null) }),
          ed('pk', a.pk ? '식별자(PK)에서 빼기' : '식별자(PK)로 지정', { why: w || (a.fk ? 'FK의 PK 여부는 관계 유형이 정합니다 — 관계에서 식별/비식별로 전환하세요' : null) }),
          I('dict', '사전에서 보기'), ...(['unreg', 'comb'].includes(a.s) ? [I('std', '표준 맞추기')] : []), SEP, ed('delete', P ? '컬럼 삭제' : '속성 삭제', { key: 'Delete', danger: 1 })];
      }
      if (r.kind === 'rel') {
        const x = s.R[r.rel]; if (!x) return [];
        const hid = curV && (curV.hide || []).includes(relKey(x));
        return [I('select', '선택 · 관계 정보'), I('fit', '위치 맞춤'), SEP, ...(x.k === 'mn' ? [ed('mn', 'M:N 해소', { ent: null })] : x.f !== x.t ? [ed('ident', x.k === 'id' ? '비식별로 전환' : '식별로 전환', { ent: null })] : []),
          ed('hideline', hid ? '관계선 다시 보이기' : '관계선만 숨기기', { ent: null, why: onM ? editWhy(r, null) : '모델 화면에서 보기를 열고 정합니다' }), ...(fkOf(x, s.E).st === 'miss' ? [ed('mkfk', 'FK 만들기', { ent: null })] : []), SEP, ed('delrel', '관계 삭제', { ent: null, key: 'Delete', danger: 1 })];
      }
      if (r.kind === 'prel') { const f = fkOf(s.R[r.rel] || {}, s.E); return [I('select', '관계 선택'), I('ddl', 'DDL 미리보기'), ...(f.st === 'miss' ? [ed('mkfk', 'FK 만들기 (게이트 A)', { ent: null })] : []), I('rule', '이름 규칙 다시 적용', { mock: '제약조건 이름을 명명 템플릿대로 다시 만듭니다(목업) — 시스템 설정 › 명명 템플릿' })]; }
      if (r.kind === 'cons' || r.kind === 'ix') return [I('select', '테이블 선택'), I('ddl', 'DDL 미리보기')];
      if (r.kind === 'term') return [I('dict', '사전에서 보기'), I('hl', '사용 엔터티 강조'), I('std', '모델에 최신 표준 다시 적용'), I('dreq', '사전 변경 신청')];
      if (r.kind === 'dom') return [I('dict', '사전에서 보기'), I('hl', '사용 엔터티 강조')];
      if (r.kind === 'view') { const w = editWhy(r, null);
        return [I('vopen', r.view === seeing ? '열기 · 보는 중' : '열기'), SEP, ed('vren', '이름 바꾸기', { ent: null, key: 'F2', why: r.view === 'all' ? '전체 보기는 이름을 바꿀 수 없습니다' : w }), ed('vdup', '복제', { ent: null }), ed('delete', '보기 삭제', { ent: null, key: 'Delete', danger: 1, why: r.view === 'all' ? '전체 보기는 지울 수 없습니다' : w })]; }
      return [];
    }
    function runCmd(r, it) {
      const now = menuOf(r).find(x => x.id === it.id); if (now) it = now;   // checked again at run time: the state may have changed while the menu was open
      if (it.why) { toast(it.why, 'info'); return; }
      if (it.mock) { toast(it.mock, 'info'); return; }
      const c = it.id, s = src(r.area), sn = s.snap ? '&snap=' + s.snap : '', go = h => { location.href = h; };
      const e = r.ent ? s.E.find(x => x.id === r.ent) : null, nm = id => (s.E.find(x => x.id === id) || {}).n || id;
      if (c === 'expand' || c === 'collapse') { const t0 = ST.tog[r.key] = ST.tog[r.key] || {}; const walk = n => { if (n.open != null) t0[n.nid] = c === 'expand'; (n.kids || []).forEach(walk); }; walk(r); save(); focusId = r.id; render(); return; }
      if (c === 'select') { select(r, false); return; }
      if (c === 'fit' || c === 'hl') { select(r, true); return; }
      if (c === 'used') {
        const par = s.R.filter(x => x.t === r.ent && x.f !== r.ent), kid = s.R.filter(x => x.f === r.ent && x.t !== r.ent);
        const msg = `‘${e.n}’ — 부모 ${par.length}: ${par.map(x => nm(x.f)).join(', ') || '없음'} · 자식 ${kid.length}: ${kid.map(x => nm(x.t)).join(', ') || '없음'}`;
        const ev = new CustomEvent('dbm-tree-highlight', { cancelable: true, detail: { area: r.area, term: e.n, ents: [r.ent].concat(par.map(x => x.f), kid.map(x => x.t)), msg } });
        if (window.dispatchEvent(ev)) toast(msg, 'info'); return;
      }
      const term = r.term || r.dom || (e && r.ai != null && e.a[r.ai] ? e.a[r.ai].n : '');
      const NAV = { open: `model.html?area=${r.area}${sn}`, std: `standardize.html?area=${r.area}`, ddl: `ddl.html?area=${r.area}${sn}${r.ent ? '&focus=' + r.ent : ''}`, outputs: `outputs.html?area=${r.area}${sn}`, hist: 'approvals.html', cand: 'candidates.html', dictopen: 'dictionary.html',
        dict: `dictionary.html?q=${encodeURIComponent(term)}`, dreq: `dictionary.html?q=${encodeURIComponent(term)}`, src: e && e.refArea ? `model.html?area=${e.refArea}&focus=${r.ent}` : '' };
      if (c in NAV) { if (c === 'dict' && window.openDictTab && document.getElementById('dict-q')) { openDictTab(term, true); return; } if (NAV[c]) go(NAV[c]); else toast('원본 영역을 찾지 못했습니다', 'danger'); return; }
      // object commands: the page with this area open runs them; otherwise the model screen opens and runs it
      // targets travel as stable keys (attribute names, relation ends) — never as array positions, which differ between versions and after a reorder
      const ea = e && r.ai != null ? e.a[r.ai] : null, rr = r.rel != null ? s.R[r.rel] : null;
      const lv = live();
      const d = { cmd: c, area: r.area, kind: r.kind, id: r.ent || null, ai: r.ai != null ? r.ai : null, rel: r.rel != null ? r.rel : null, view: r.view || null,
        akey: ea ? { n: ea.n, p: ea.p } : null, rkey: rr ? { f: rr.f, t: rr.t, k: rr.k, g: rr.g || '' } : null,
        to: c === 'addref' && lv ? lv.area : null };   // a reference goes INTO the area the model screen has open
      if (!window.dispatchEvent(new CustomEvent('dbm-tree-cmd', { cancelable: true, detail: d }))) return;
      if (c === 'vopen') { go(`model.html?area=${r.area}&view=${encodeURIComponent(r.view)}`); return; }   // opening a view changes nothing — a plain address is fine
      // another screen: a one-time token in this tab only (a link or a bookmark never edits the model), read and removed on arrival
      try { sessionStorage.setItem('dbm-tree-cmd', JSON.stringify(Object.assign({ at: Date.now(), user: ME.id }, d))); } catch (er) {}
      go(`model.html?area=${r.area}${d.id ? '&focus=' + d.id : ''}`);
    }
    const ctx = document.createElement('div'); ctx.className = 'tctx'; ctx.id = 'tr-ctx'; ctx.setAttribute('role', 'menu'); ctx.hidden = true; document.body.appendChild(ctx);
    let ctxRow = null, ctxItems = [], ctxBack = null;
    function openMenu(r, x, y, backEl) {
      let items = menuOf(r).filter((it, i, A) => !(it.sep && (i === 0 || A[i - 1].sep || i === A.length - 1)));
      if (!items.length) return;
      ctxRow = r; ctxItems = items; ctxBack = backEl || null;
      const name = String(r.aria || '').split(',')[0];
      ctx.setAttribute('aria-label', `${name} 메뉴`);
      ctx.innerHTML = `<div class="tctx-h" aria-hidden="true">${esc(name)}</div>` + items.map((it, i) => it.sep ? '<div class="tctx-sep" role="separator"></div>'
        : `<button type="button" role="menuitem" class="tctx-i${it.danger ? ' danger' : ''}" data-i="${i}" tabindex="-1"${it.why ? ` aria-disabled="true" title="${esc(it.why)}"` : it.mock ? ` title="${esc(it.mock)}"` : ''}><span>${esc(it.label)}${it.why ? `<span class="sr-only">, 사용할 수 없음: ${esc(it.why)}</span>` : ''}</span>${it.why ? '<i data-ic=lock data-s=12></i>' : it.mock ? '<span class="tctx-m">목업</span>' : ''}${it.key ? `<kbd>${esc(it.key)}</kbd>` : ''}</button>`).join('');
      ctx.hidden = false; ctx.style.left = '0px'; ctx.style.top = '0px';
      const w = ctx.offsetWidth, h = ctx.offsetHeight;
      ctx.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px'; ctx.style.top = (y + h > innerHeight - 8 ? Math.max(8, y - h - 4) : y) + 'px';
      const first = ctx.querySelector('.tctx-i:not([aria-disabled])') || ctx.querySelector('.tctx-i'); if (first) first.focus();
    }
    function closeMenu(back) { if (ctx.hidden) return; ctx.hidden = true; const el = back && (ctxBack && document.contains(ctxBack) ? ctxBack : tree.querySelector(`[data-id="${CSS.escape(ctxRow ? ctxRow.id : '')}"]`)); if (el) focusRow(el.closest('[role=treeitem]') || el); }
    ctx.addEventListener('click', e => { const b = e.target.closest('.tctx-i'); if (!b) return; if (b.getAttribute('aria-disabled') === 'true') { b.focus(); return; }   // the reason is already in its name and tooltip
      const it = ctxItems[+b.dataset.i], r = ctxRow; closeMenu(true); if (it && r) runCmd(r, it); });
    ctx.addEventListener('keydown', e => {
      e.stopPropagation();
      const its = [...ctx.querySelectorAll('.tctx-i')]; let i = its.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); i = e.key === 'Home' ? 0 : e.key === 'End' ? its.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its[i].focus(); return; }
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'ArrowLeft') { e.preventDefault(); closeMenu(true); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (its[i]) its[i].click(); return; }
      if (e.key.length === 1 && /\S/.test(e.key)) { const ch = e.key; const order = its.slice(i + 1).concat(its.slice(0, i + 1)); const hit = order.find(x => x.textContent.trim().startsWith(ch)); if (hit) hit.focus(); }
    });
    document.addEventListener('mousedown', e => { if (!ctx.hidden && !ctx.contains(e.target) && !e.target.closest('[data-tmore]')) closeMenu(false); }, true);
    const closeKeep = () => closeMenu(ctx.contains(document.activeElement));   // focus inside the menu goes back to its row
    window.addEventListener('resize', closeKeep);
    nav.querySelector('#tr-full').addEventListener('scroll', closeKeep, { passive: true });
    // T3: an entity row can be dragged onto the open canvas — same area = place it in this view, another area = reference it (12 §3.2)
    tree.addEventListener('dragstart', e => {
      const el = e.target.closest && e.target.closest('[role=treeitem][draggable="true"]'); const r = el && rowMap[el.dataset.id];
      if (!r || !r.ent) { e.preventDefault(); return; }
      e.dataTransfer.setData('application/x-dbm-ent', JSON.stringify({ area: r.area, id: r.ent, sys: SYS })); e.dataTransfer.setData('text/plain', (r.aria || '').split(',')[0]); e.dataTransfer.effectAllowed = 'copyLink';
      window.dispatchEvent(new CustomEvent('dbm-tree-drag', { detail: { area: r.area, id: r.ent, on: true } }));
    });
    tree.addEventListener('dragend', () => window.dispatchEvent(new CustomEvent('dbm-tree-drag', { detail: { on: false } })));
    tree.addEventListener('contextmenu', e => {
      const el = e.target.closest('[role=treeitem]'); if (!el || el.matches('a.tlink')) return;   // shortcuts keep the browser's own menu (open in a new tab)
      const r = rowMap[el.dataset.id]; if (!r) return; e.preventDefault(); focusRow(el); openMenu(r, e.clientX, e.clientY, el);
    });
    tree.addEventListener('focusin', e => { const el = e.target.closest('[role=treeitem]'); if (el) { focusId = el.dataset.id; tree.querySelectorAll('[tabindex="0"]').forEach(x => { if (x !== el) x.tabIndex = -1; }); el.tabIndex = 0; } });
    // canvas → tree: mark and reveal the row, never take the keyboard focus (12 §4.2)
    window.addEventListener('dbm-canvas-select', e => {
      const { area, id } = e.detail || {}; if (!area) return;
      if (!id) { selId = null; render(); return; }
      const P = pageMode() === 'P', s = src(area), k = SYS + ':' + area + '@' + s.ver, t0 = ST.tog[k] = ST.tog[k] || {};
      // a tree selection inside this entity (attribute, relation, constraint) stays as it is
      const curR = selId && rowMap[selId]; if (curR && curR.area === area && curR.ent === id && e.detail.ai == null) { markSel(); return; }
      ['area', P ? 'f:tbls' : 'f:ents'].concat(e.detail.ai != null ? ['e:' + id] : []).forEach(n => { if (!(n in t0)) autoOpen.add(k + '|' + n); });
      selId = area + (e.detail.ai != null ? `|a:${id}:${e.detail.ai}` : '|e:' + id); if (!tree.contains(document.activeElement)) focusId = selId;
      render();
      const el = tree.querySelector(`[data-id="${CSS.escape(selId)}"]`); if (el) { const box = nav.querySelector('#tr-full').getBoundingClientRect(), b = el.getBoundingClientRect(); if (b.top < box.top || b.bottom > box.bottom) el.scrollIntoView({ block: 'nearest' }); }
    });
    window.addEventListener('dbm-tree-refresh', later);
    // ---- find · filter
    qIn.addEventListener('input', () => { q = qIn.value; render(); });
    qIn.addEventListener('keydown', e => { if (e.key === 'Escape' && qIn.value) { e.stopPropagation(); qIn.value = ''; q = ''; render(); } else if (e.key === 'ArrowDown') { const f = tree.querySelector('[role=treeitem]'); if (f) { e.preventDefault(); focusRow(f); } } });
    nav.querySelector('#mn-tf').addEventListener('change', e => { const c = e.target.closest('[data-tf]'); if (c) { flt[c.dataset.tf] = c.checked; render(); } });
    nav.querySelector('#mn-tf').addEventListener('click', e => { const b = e.target.closest('[data-tc]'); if (!b) return; e.stopPropagation(); flt.cls = b.dataset.tc; nav.querySelectorAll('[data-tc]').forEach(x => x.classList.toggle('on', x === b)); render(); });
    nav.addEventListener('click', e => { if (e.target.id === 'tr-fclr') { flt = { bad: false, ex: false, noref: false, cls: '' }; nav.querySelectorAll('[data-tf]').forEach(c => c.checked = false); nav.querySelectorAll('[data-tc]').forEach(x => x.classList.toggle('on', x.dataset.tc === '')); render(); qIn.focus(); } });
    // ---- width: follows the content, never squeezes the canvas below 760px (12 §4.6)
    const minned = () => app.classList.contains('treemin');
    const modelish = page === 'model';   // model family screens (model · standardize · DDL · outputs · import)
    const maxW = () => { if (!modelish) return 400; const rp = modelish ? [...document.querySelectorAll('.rpanel.open')].reduce((w, p) => w + p.getBoundingClientRect().width, 0) : 0; return Math.max(240, modelish ? app.clientWidth - rp - 760 : 400); };
    let curW = 0;
    const setW = w => { if (minned()) return; curW = Math.round(Math.min(Math.max(w, 240), maxW())); app.style.setProperty('--nav', curW + 'px'); const rs = nav.querySelector('#tr-rs'); rs.setAttribute('aria-valuenow', curW); rs.setAttribute('aria-valuemin', 240); rs.setAttribute('aria-valuemax', maxW()); };
    const needW = () => { tree.classList.add('measure'); const w = [...tree.querySelectorAll('.trow2, .tlinks')].reduce((m, el) => Math.max(m, el.scrollWidth), 0); tree.classList.remove('measure'); return w + 24; };
    function fit() {
      if (minned()) return;
      if (!modelish) { setW(Math.max(curW, needW(), 240)); return; }   // home · system home: content fit up to 400px (ERP names need it)
      if (modelish && app.clientWidth - [...document.querySelectorAll('.rpanel.open')].reduce((w, p) => w + p.getBoundingClientRect().width, 0) - 760 < 240) { app.classList.add('treemin'); syncMin(); return; }   // not even 240px fits → the tree folds first (not remembered)
      if (ST.manual) { setW(curW || ST.w || 264); return; }
      setW(Math.max(curW, needW(), 240));
    }
    window.addEventListener('resize', () => { if (!minned()) { const c = curW; curW = 0; setW(c || ST.w || 264); fit(); } });
    const rs = nav.querySelector('#tr-rs');
    rs.addEventListener('pointerdown', e => { if (minned()) return; e.preventDefault(); rs.setPointerCapture(e.pointerId); const x0 = e.clientX, w0 = curW; const mv = ev => setW(w0 + ev.clientX - x0); const up = () => { rs.removeEventListener('pointermove', mv); rs.removeEventListener('pointerup', up); ST.manual = true; ST.w = curW; save(); window.dispatchEvent(new Event('resize')); }; rs.addEventListener('pointermove', mv); rs.addEventListener('pointerup', up); });
    rs.addEventListener('dblclick', () => { ST.manual = false; ST.w = 0; save(); curW = 0; setW(needW()); toast(`트리 폭을 내용에 맞췄습니다 · ${curW}px`, 'info'); window.dispatchEvent(new Event('resize')); });
    rs.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); setW(curW + (e.key === 'ArrowRight' ? 16 : -16)); ST.manual = true; ST.w = curW; save(); window.dispatchEvent(new Event('resize')); });
    // ---- collapse to the 56px icon column
    const btn = nav.querySelector('#tr-min');
    const syncMin = () => { const m = minned(); btn.innerHTML = `<i data-ic=${m ? 'right' : 'left'}></i><span>접기</span>`; btn.setAttribute('aria-label', m ? '모델 트리 펼치기' : '모델 트리 접기'); btn.setAttribute('aria-expanded', String(!m)); btn.setAttribute('aria-controls', 'tr-full'); btn.title = m ? '펼치기' : '접기'; if (m) app.style.removeProperty('--nav'); else { curW = 0; fit(); } };
    btn.addEventListener('click', () => { app.classList.toggle('treemin'); store.set('dbm-tree-min', minned() ? '1' : '0'); syncMin(); window.dispatchEvent(new Event('resize')); });
    // ---- [모델 | 사전] — the model screen's dictionary panel moves into this one column (12 §4.6)
    if (tabs) {
      const side = document.getElementById('side'); const dp = nav.querySelector('#tp-dict');
      dp.appendChild(side); side.classList.remove('closed'); document.body.classList.add('dict-in-tree');
      const setTab = (v, focus, expand) => { ST.tab = v; save(); nav.querySelectorAll('[data-lt]').forEach(b => { const on = b.dataset.lt === v; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; }); nav.querySelector('#tp-model').hidden = v !== 'm'; dp.hidden = v !== 'd'; if (minned() && (focus || expand)) { app.classList.remove('treemin'); store.set('dbm-tree-min', '0'); syncMin(); } if (focus) (v === 'd' ? document.getElementById('dict-q') : qIn).focus(); };
      nav.querySelector('.ltabs').addEventListener('click', e => { const b = e.target.closest('[data-lt]'); if (b) setTab(b.dataset.lt, true); });
      nav.querySelector('.ltabs').addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const v = ST.tab === 'm' ? 'd' : 'm'; setTab(v, false); nav.querySelector(`[data-lt="${v}"]`).focus(); } });
      document.addEventListener('keydown', e => { if (e.altKey && (e.key === '1' || e.key === '2')) { e.preventDefault(); setTab(e.key === '1' ? 'm' : 'd', true); } });
      document.addEventListener('click', e => { const t = e.target.closest('[data-toggle="side"]'); if (!t) return; e.stopPropagation(); e.preventDefault(); setTab('d', true); }, true);
      window.openDictTab = (q0, focus) => { setTab('d', !!focus, true); const i = document.getElementById('dict-q'); if (i && q0 != null) { i.value = q0; i.dispatchEvent(new Event('input')); } };
      setTab(ST.tab === 'd' ? 'd' : 'm', false);
    }
    syncMin();
    render();
  }


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
    // signed-out pages show no product shell (CL3: logout page still showed the logged-in shell)
    if (document.body.dataset.page === 'login' || (document.body.dataset.page === 'error' && ['logout', 'expired'].includes(qs.get('code')))) {
      app.classList.add('bare');
      const t = document.createElement('div'); t.className = 'toasts'; t.id = 'toasts'; t.setAttribute('role', 'status'); app.appendChild(t);
      return;
    }
    const top = document.createElement('header');
    top.className = 'topbar';
    const nUnread = unread();
    const page = document.body.dataset.page;
    // v17 (11 §2.1): top menu = global moves; the active tab follows the screen family
    const TAB = { system: 'model', model: 'model', dictionary: 'dict', excel: 'dict', candidates: 'dict', 'dict-grid': 'dict', 'domain-groups': 'dict', 'std-common': 'dict', approvals: 'appr', settings: 'admin', audit: 'admin' }[page] || '';
    const here = f => curFile() === f ? ' on" aria-current="page' : '';
    const cur = (on, f) => on ? (curFile() === f ? ' aria-current="page"' : ' aria-current="true"') : '';
    const qn0 = queueCount(), late = myQueue(getDocs()).some(d => docLate(d)), cq = candOpenCount();
    const canAdmin = ME.has('admin'), canAudit = ME.has('da') || ME.has('admin');
    top.innerHTML = `
      <a class="brand" href="home.html" aria-label="NeoDB 홈"${page === 'home' ? ' aria-current="page"' : ''}>${MARK(20)}<span class="wm">NeoDB</span></a>
      <span class="org">한국데이터진흥원</span>
      <nav class="tmenu" aria-label="주 메뉴">
        <a class="tm${TAB === 'model' ? ' on' : ''}" href="system.html"${cur(TAB === 'model', 'system.html')}>모델</a>
        <span class="tmw"><button class="tm${TAB === 'dict' ? ' on' : ''}" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-dict"${TAB === 'dict' ? ' aria-current="true"' : ''}>사전<i data-ic=down data-s=12></i></button><div class="menu" data-auto id="mn-dict">
          <a class="mi${here('dictionary.html')}" href="dictionary.html">통합 검색</a>
          <a class="mi${here('dict-grid.html')}" href="dict-grid.html">화면 일괄 작성</a>
          <a class="mi${here('domain-groups.html')}" href="domain-groups.html">도메인 그룹 · 분류</a>
          <a class="mi${here('std-common.html')}" href="std-common.html">공통표준 · 행정표준코드</a>
          <a class="mi${here('excel-import.html')}" href="excel-import.html">엑셀 가져오기</a>
          <a class="mi${here('uploads.html')}" href="uploads.html">업로드 이력</a>
          <a class="mi${here('candidates.html')}" href="candidates.html">후보 큐${cq ? `<span class="mcount">${cq}</span>` : ''}</a>
          <div class="sep"></div>
          <a class="mi${here('dict-history.html')}" href="dict-history.html">변경 내역</a></div></span>
        <a class="tm${TAB === 'appr' ? ' on' : ''}" href="approvals.html" id="tm-appr"${cur(TAB === 'appr', 'approvals.html')} aria-label="결재함${qn0 ? ` 내 차례 ${qn0}건` : ''}${late ? ', 기한 넘김 있음' : ''}">결재함${qn0 ? `<span class="tcount">${qn0}</span>` : ''}${late ? '<span class="tlate" title="기한을 넘긴 결재가 있습니다"></span>' : ''}</a>
        ${canAdmin ? `<span class="tmw"><button class="tm${TAB === 'admin' ? ' on' : ''}" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-admin"${TAB === 'admin' ? ' aria-current="true"' : ''}>관리<i data-ic=down data-s=12></i></button><div class="menu" data-auto id="mn-admin">
          <a class="mi${here('settings.html')}" href="settings.html">설정</a>
          <a class="mi${here('audit.html')}" href="audit.html">감사 로그</a></div></span>` : canAudit ? `<a class="tm${TAB === 'admin' ? ' on' : ''}" href="audit.html"${cur(TAB === 'admin', 'audit.html')}>감사 로그</a>` : ''}
      </nav>
      <div class="spacer"></div>
      <button class="gsearch" id="gsearch" type="button" aria-haspopup="dialog" aria-label="전체 검색 (Ctrl+K)">${ICON.search}<span>검색</span><kbd>Ctrl K</kbd></button>
      ${can('dict.request') ? (() => { const bn = getBasket().items.length; return `<a class="iconbtn" id="btn-basket" href="dictionary.html?basket=1" aria-label="사전 바구니 ${bn}건 — 열어서 품의 올리기" title="사전 바구니 ${bn}건">${ICON.basket}${bn ? `<span class="dot">${bn}</span>` : ''}</a>`; })() : ''}
      <button class="iconbtn" id="btn-bell" aria-label="알림 ${nUnread}건" aria-haspopup="true" aria-expanded="false">${ICON.bell}${nUnread ? `<span class="dot">${nUnread}</span>` : ''}</button>
      <button class="avatar btnlike" id="btn-user" aria-label="사용자 메뉴 · ${ME.name}" aria-haspopup="true" aria-expanded="false">${ME.name[0]}${store.get('dbm-seen-ver', '') !== PRODUCT.version ? '<span class="newdot" title="새 기능"></span>' : ''}</button>
      <div class="pop-menu npanel" id="pn-notif" role="dialog" aria-label="알림"></div>
      <div class="pop-menu umenu" id="pn-user" role="menu" aria-label="사용자 메뉴"></div>`;
    // v17 (11 §2.2): the left side is the model tree only — shown on home and model-family screens,
    // hidden on top-menu screens (사전 · 결재함 · 관리 · 마이페이지), which then use the full width (decision #2)
    const nav = document.createElement('nav');
    nav.className = 'mtree'; nav.setAttribute('aria-label', '모델 트리');
    const showTree = ['home', 'system', 'model'].includes(page);
    if (!showTree) app.classList.add('notree');
    const tmin = store.get('dbm-tree-min', '');
    if (tmin === '1' || (tmin === '' && curFile() === 'model.html' && (document.documentElement.classList.contains('frame-1600') || Math.min(window.innerWidth, app.clientWidth || window.innerWidth) < 1920))) app.classList.add('treemin');
    app.insertBefore(nav, content);
    app.insertBefore(top, nav);
    document.querySelectorAll('.crumbs a[href="system.html"]').forEach(a => { if (a.textContent.trim() === '요구사항관리') a.textContent = curSys().name; });
    // the dictionary screens share one tab row under the header (01 v2 §5, D4) — they have no breadcrumb
    // three groups (review: find · write / bring in / flow · history) + the reference data at the end; upload history lives inside the excel group
    { const DT = [['dictionary.html', '통합 검색'], ['dict-grid.html', '화면 일괄 작성'], 0, ['excel-import.html', '엑셀 가져오기', ['uploads.html']], 0, ['candidates.html', '후보 큐'], ['dict-history.html', '변경 내역'], 0, ['domain-groups.html', '도메인 그룹 · 분류'], ['std-common.html', '공통표준 · 행정표준코드']];
      const here = t => t && (t[0] === curFile() || (t[2] || []).includes(curFile()));
      const ph = DT.some(here) && document.querySelector('#content .page-header');
      if (ph && !document.querySelector('.dtabs')) ph.insertAdjacentHTML('afterend', `<nav class="tabs dtabs" aria-label="사전 화면">${DT.map(t => !t ? '<span class="dsep" aria-hidden="true"></span>' : `<a href="${t[0]}"${here(t) ? ' class="on" aria-current="page"' : ''}>${t[1]}</a>`).join('')}</nav>`); }
    drawTree(nav);
    const toasts = document.createElement('div');
    toasts.className = 'toasts'; toasts.id = 'toasts';
    toasts.setAttribute('role', 'status'); toasts.setAttribute('aria-live', 'polite');
    app.appendChild(toasts);
    const ov = document.createElement('div');
    ov.innerHTML = `
      <div class="overlay" id="mo-about" role="dialog" aria-modal="true" aria-labelledby="about-t"><div class="modal" style="width:520px">
        <div class="m-head"><div class="flex">${MARK(28)}<h3 id="about-t">제품 정보</h3><span class="grow"></span><button class="iconbtn" data-close="mo-about" aria-label="닫기" style="width:28px;height:28px">${ICON.x}</button></div></div>
        <div class="m-body">
          <dl class="kv"><dt>제품</dt><dd><b>${PRODUCT.name}</b> — 웹 데이터 모델러 · 데이터 표준 사전</dd><dt>버전</dt><dd class="mono">${PRODUCT.version}</dd><dt>빌드</dt><dd class="mono">${PRODUCT.build} · ${PRODUCT.released}</dd><dt>배포 환경</dt><dd>${PRODUCT.env} <span class="badge b-success">최신 버전</span></dd><dt>사전 기준</dt><dd>${PRODUCT.dict}</dd><dt>기관</dt><dd>한국데이터진흥원</dd></dl>
          <div class="section-t">릴리스 노트 · ${PRODUCT.version}</div>
          <ul class="caption" style="margin:0;padding-left:18px;line-height:22px"><li>산출물 화면: 테이블 정의서·준수검사·개인정보 컬럼 목록</li><li>모델: 표 보기(일괄편집·찾기/바꾸기), 모델 검토, 제약·인덱스, 서브타입·배타 관계</li><li>실시간 공동 편집, 내 편집만 되돌리기</li><li>알려진 제한: DBMS 비교(운영 DB 접속)는 다음 버전</li></ul>
          <div class="section-t">오픈소스 라이선스</div>
          <div class="caption" style="line-height:20px">React Flow (MIT) · Yjs (MIT) · elkjs (EPL-2.0) · Pretendard (OFL-1.1) · Geist Mono (OFL-1.1) <a href="#" data-toast="라이선스 전문을 엽니다(목업)" data-toast-type="info">전문 보기</a></div>
          <div class="section-t">지원</div>
          <div class="caption">데이터정책팀 · 내선 1234 · neodb@kda.go.kr</div>
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

    // mock-only tools: one dashed chip at the right of the top bar (11 §2.3, d8) — a floating button covered page actions wherever it sat
    const mk = document.createElement('div'); mk.className = 'mockfab';
    mk.innerHTML = `<button class="mf-btn" id="mk-fab" type="button" aria-haspopup="dialog" aria-expanded="false" title="목업 검토용 도구 · 실제 제품에는 없음">목업${(() => { const n = (J('dbm-notes', {})[curFile()] || []).filter(x => !x.done).length; return n ? ` <span class="scr-n">${n}</span>` : ''; })()}</button>
      <div class="mock-tools" id="mk-pop" role="dialog" aria-label="목업 도구">
        <div class="mt-h">목업 도구 <span class="caption muted">실제 제품에는 없음</span></div>
        <label class="mt-row"><span>역할</span><select id="mk-role" aria-label="역할 보기 전환">${Object.values(USERS).filter(u => u.status !== 'stopped').map(u => `<option value="${u.id}" ${u.id === ME.id ? 'selected' : ''}>${txt(u.name)} · ${(u.roles || []).map(r => ROLE_NAME[r]).join('·') || '조회만'}</option>`).join('')}</select></label>
        <div class="mt-row"><span>화면 크기</span><span class="seg" id="seg-frame" title="맞춤 = 창 폭 전체(최소 1600px) · 1920/1600 = 고정 미리보기"><button data-v="fit">맞춤</button><button data-v="1920">1920</button><button data-v="1600">1600</button></span></div>
        <div class="mt-row"><span>테마</span><span class="seg" id="seg-theme"><button data-v="light">라이트</button><button data-v="dark">다크</button></span></div>
        <div class="mt-row mt-acts"><button class="btn sm" id="mk-scr" aria-expanded="false" title="화면 정보 · 상태별 바로가기 · 설계 문서 · 검토 메모">화면 정보</button><a class="btn sm" href="index.html" title="전체 화면·교차 시나리오">목업 지도</a><button class="btn sm" id="mk-audit" title="디자인 가이드 v2 기준 퍼블리싱 점검 — 19개 화면 × 1920 · 1600 (17 · P4)">퍼블리싱 점검</button><button class="btn sm ghost" id="mk-reset" title="결재 진행 상태·알림 읽음을 처음으로 · 검토 메모는 유지">데이터 초기화</button></div>
      </div>`;
    top.insertBefore(mk, top.querySelector('#gsearch'));
    const fab = mk.querySelector('#mk-fab'), mpop = mk.querySelector('#mk-pop');
    const mkOpen = on => { mpop.classList.toggle('open', on); fab.setAttribute('aria-expanded', on); };
    fab.addEventListener('click', e => { e.stopPropagation(); const on = !mpop.classList.contains('open'); mkOpen(on); if (on) mpop.querySelector('select').focus(); });
    mpop.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => mkOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && mpop.classList.contains('open')) { mkOpen(false); fab.focus(); } });
    // frame/theme/role tools — keep other query params (CL2-07)
    const sf = mk.querySelector('#seg-frame'), st = mk.querySelector('#seg-theme');
    sf.querySelector(`[data-v="${frame}"]`).classList.add('on');
    const tsel = st.querySelector(`[data-v="${themePref === 'dark' ? 'dark' : 'light'}"]`); if (tsel) tsel.classList.add('on');
    sf.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-frame', v); const p = new URLSearchParams(location.search); p.set('w', v); location.search = p.toString(); });
    st.addEventListener('click', e => { const v = e.target.dataset.v; if (!v) return; store.set('dbm-theme', v); applyTheme(v); st.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); });
    mk.querySelector('#mk-role').addEventListener('change', e => { store.set('dbm-role', e.target.value); store.set('dbm-sess-at', String(Date.now())); const p = new URLSearchParams(location.search); p.delete('as'); location.search = p.toString(); location.reload(); });
    mk.querySelector('#mk-scr').addEventListener('click', e => { e.stopPropagation(); mkOpen(false); toggleScreenPanel(); });
    const sp = document.createElement('aside'); sp.className = 'scr-panel'; sp.id = 'scr-panel'; sp.setAttribute('aria-label', '화면 정보'); sp.addEventListener('click', e => e.stopPropagation()); app.appendChild(sp);
    if (store.get('dbm-scr-open', '0') === '1') toggleScreenPanel(true);
    // publishing audit (17 · P4): measures every screen against guide v2 and shows one table — mock tool, not part of the product
    mk.querySelector('#mk-audit').addEventListener('click', async e => {
      e.stopPropagation(); mkOpen(false);
      const ov = document.createElement('div'); ov.className = 'overlay open'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', '퍼블리싱 점검');
      ov.innerHTML = `<div class="modal" style="width:960px;max-width:calc(100vw - 48px)"><div class="m-head"><h3 class="sm">퍼블리싱 점검 · 디자인 가이드 v2</h3></div><div class="m-body" id="aud-b"><span class="savest"><span class="sdot run"></span>19개 화면을 1920 · 1600으로 여는 중… (약 1분)</span></div><div class="m-foot"><button class="btn" id="aud-x">닫기</button></div></div>`;
      document.getElementById('app').appendChild(ov); const close = () => ov.remove(); ov.querySelector('#aud-x').onclick = close; ov.addEventListener('keydown', k => { if (k.key === 'Escape') close(); }); ov.querySelector('#aud-x').focus();
      await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'assets/audit.js?t=' + Date.now(); s.onload = ok; s.onerror = no; document.head.appendChild(s); });   // the newest script every run
      const res = await NeoAudit.measure([1920, 1600]); if (!document.contains(ov)) return;
      const cond = NeoAudit.conditions();
      const rows = Object.entries(res).map(([k, r]) => { const bad = r.small || r.bold700 || r.noName || r.noLabel || r.glyph || r.overflow || (r.primary > 1 && !/styleguide/.test(k)) ||   /* the styleguide shows every button kind on purpose */ !/^(28|32|40|44)( · (28|32|40|44))*$/.test(r.btnH || '28');
        return `<tr><td class="mono">${k}</td><td>${r.err ? tag('err', '오류') : bad ? tag('warn', '확인') : tag('ok', '통과')}</td><td class="num">${r.small}</td><td class="num">${r.bold700}</td><td class="mono">${r.btnH}</td><td class="num">${r.noName + r.noLabel}</td><td class="num">${r.glyph}</td><td class="num">${r.primary}</td><td class="num">${r.inlineSrc != null ? r.inlineSrc : r.inline}</td><td>${r.overflow ? '넘침' : ''}</td></tr>`; }).join('');
      ov.querySelector('#aud-b').innerHTML = `<div class="caption muted u-mb-8">조건: ${cond} · 대상 ${NeoAudit.PAGES.length}개 화면(목업 지도 · ERD 별칭 제외)<br>기준: 12px 미만 0 · 굵기 700 0 · 버튼 높이 28/32/40(트리 44) · 이름 없는 버튼 · 입력 0 · 문자 아이콘 0 · 주 버튼 ≤1 · 가로 넘침 없음. 인라인 스타일 수는 참고.</div>
        <div style="max-height:60vh;overflow:auto"><table class="tbl box"><thead><tr><th>폭 · 화면</th><th>결과</th><th class="r">12px 미만</th><th class="r">700</th><th>버튼 높이</th><th class="r">이름 없음</th><th class="r">문자 아이콘</th><th class="r">주 버튼</th><th class="r">인라인(원문)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    });
    mk.querySelector('#mk-reset').addEventListener('click', () => { const keep = ['dbm-frame', 'dbm-frame-v2', 'dbm-theme', 'dbm-role', 'dbm-single-keys', 'dbm-notes', 'dbm-scr-open']; try { Object.keys(localStorage).filter(k => k.startsWith('dbm-') && !keep.includes(k)).forEach(k => store.del(k)); } catch (e) {} Object.keys(USERS).forEach(u => store.del('dbm-read-' + u)); flash('목업 데이터를 초기화했습니다', 'info'); location.reload(); });

    // notifications
    const pn = top.querySelector('#pn-notif'), pu = top.querySelector('#pn-user');
    let nf = 'all';
    const drawNotif = () => {
      const list = myNotifs().filter(n => nf === 'all' || n.k === nf || (nf === 'appr' && n.k === 'res'));
      pn.innerHTML = `<div class="nh"><b>알림</b><span class="badge">${unread()} 안 읽음</span><span class="grow"></span><button class="btn ghost sm" id="n-allread">모두 읽음</button></div>
        <div class="nf">${[['all', '전체'], ['appr', '결재'], ['cand', '후보'], ['job', '작업'], ['cc', '참조'], ['sys', '공지']].map(([k, l]) => `<button class="chip ${nf === k ? 'on' : ''}" data-nf="${k}" style="height:24px;font-size:12px">${l}</button>`).join('')}</div>
        <div class="nlist">${list.length ? list.map(n => `<a class="ni ${readSet.has(n.id) ? '' : 'unread'}" href="${n.href}" data-nid="${n.id}"><span class="ud" aria-hidden="true"></span><span><div class="t">${n.t}</div><div class="m">${n.m} · ${n.at}</div></span></a>`).join('') : '<div class="caption muted" style="padding:24px;text-align:center">이 종류의 알림이 없습니다</div>'}</div>
        <div class="nfoot"><span class="caption muted">30일 보관 · 메일 알림은 결재선 담당자만</span><a href="mypage.html#notify">알림 설정</a></div>`;
    };
    const closePops = () => { [pn, pu].forEach(p => p.classList.remove('open')); top.querySelectorAll('#btn-bell, #btn-user').forEach(b => b.setAttribute('aria-expanded', 'false')); };   // top menus keep their own state
    window.refreshTop = () => { const a = top.querySelector('#tm-appr'); if (!a) return; const n = queueCount(), lt = myQueue(getDocs()).some(d => docLate(d)); a.innerHTML = '결재함' + (n ? `<span class="tcount">${n}</span>` : '') + (lt ? '<span class="tlate" title="기한을 넘긴 결재가 있습니다"></span>' : ''); a.setAttribute('aria-label', '결재함' + (n ? ` 내 차례 ${n}건` : '') + (lt ? ', 기한 넘김 있음' : '')); };
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
        <a class="mi" role="menuitem" href="mypage.html#mine">내 신청 <span class="caption muted" style="margin-left:auto">${(() => { const m = getDocs().filter(d => d.req === ME.id); const l = m.filter(d => docGroup(d) === 'live').length, x = m.filter(d => docGroup(d) === 'fix').length; return `진행 중 ${l}` + (x ? ` · 보완 필요 ${x}` : ''); })()}</span></a>
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
  }
  function openAbout() {
    const p = getPub(); const kv = document.querySelector('#mo-about .kv'); if (kv) kv.innerHTML = kv.innerHTML.replace(/기관 사전 제정 \d+차/, `기관 사전 제정 ${p.cha}차`);
    document.getElementById('mo-about').classList.add('open'); store.set('dbm-seen-ver', PRODUCT.version); const d = document.querySelector('#btn-user .newdot'); if (d) d.remove(); }
  function openKeys() { document.getElementById('mo-keys').classList.add('open'); }
  window.openAbout = openAbout; window.openKeys = openKeys;

  /* ---- toast (aria-live, error stays until closed, optional action) ---- */
  window.toast = function (msg, type, action) {
    const box = document.getElementById('toasts'); if (!box) return;
    // v8: a state-coloured line icon, no filled circle (success icon only in green; info neutral)
    const colors = { success: 'var(--success)', info: 'var(--fg-3)', danger: 'var(--danger)', violet: 'var(--fg-3)' };
    const marks = { success: 'check', info: 'info', danger: 'err', violet: 'info' };
    const t = document.createElement('div');
    t.className = 'toast'; if (type === 'danger') t.setAttribute('role', 'alert'); else t.setAttribute('role', 'status');
    const acts = action ? [].concat(action).filter(Boolean) : [];   // one action, or a list (e.g. 실행 취소 + 이 컬럼도 지우기)
    t.innerHTML = `<span style="color:${colors[type || 'success']};display:flex;margin-top:2px">${icon(marks[type || 'success'])}</span><div class="tx">${msg}</div>${acts.map((a, i) => `<button class="act" data-ai="${i}">${a.label}</button>`).join('')}${type === 'danger' || acts.length ? `<button class="tclose" aria-label="닫기">${icon('x')}</button>` : ''}`;
    box.appendChild(t);
    t.querySelectorAll('.act').forEach(b => { b.onclick = () => { t.remove(); acts[+b.dataset.ai].fn(); }; });
    const c = t.querySelector('.tclose'); if (c) c.onclick = () => t.remove();
    if (type !== 'danger') setTimeout(() => t.remove(), action ? 8000 : 4000);
  };
  window.flash = (msg, type) => { try { sessionStorage.setItem('dbm-flash', JSON.stringify([msg, type])); } catch (e) {} };

  /* ---- one submit-condition function (S3):
     <button data-needs="id1 id2"> stays disabled while any field is empty (whitespace = empty);
     a page-level block reason in data-block also keeps it disabled — reasons never override blocks ---- */
  function updateNeeds() {
    document.querySelectorAll('[data-needs]').forEach(b => {
      const ids = b.dataset.needs.split(/\s+/).filter(Boolean);
      const fields = ids.map(id => document.getElementById(id)).filter(Boolean);
      const empty = fields.filter(t => !t.value.trim());
      const block = b.dataset.block || '';
      b.disabled = empty.length > 0 || !!block;
      b.setAttribute('aria-disabled', b.disabled ? 'true' : 'false');
      fields.forEach(t => t.setAttribute('aria-invalid', empty.includes(t) ? 'true' : 'false'));
      // one message per BUTTON (not per field set) — when the needed fields change, the old message can't linger (CX9-15)
      const bid = b.id || ids.join('_');
      let m = b.parentElement.querySelector(`.needs-msg[data-btn="${bid}"]`);
      const msg = block || (empty.length ? (b.dataset.needsMsg || '사유를 입력해야 합니다') : '');
      if (msg && !m) { m = document.createElement('span'); m.className = 'needs-msg'; m.dataset.btn = bid; m.setAttribute('role', 'status'); b.parentElement.insertBefore(m, b.parentElement.firstChild); }
      if (m) { if (msg) m.textContent = msg; else m.remove(); }
    });
    // fields no longer required by any button lose their invalid mark
    document.querySelectorAll('[aria-invalid="true"]').forEach(f => { if (![...document.querySelectorAll('[data-needs]')].some(b => b.dataset.needs.split(/\s+/).includes(f.id))) f.setAttribute('aria-invalid', 'false'); });
  }
  window.setBlock = (btn, reason) => { if (!btn) return; btn.dataset.block = reason || ''; if (!btn.dataset.needs) btn.dataset.needs = ''; updateNeeds(); };
  // another tab changed shared state → say so instead of silently acting on stale data (S4)
  // (actions themselves re-check at execution time; this notice only tells the user early)
  let staleShown = false;
  window.addEventListener('storage', e => {
    if (staleShown || !e.key) return;
    const role = e.key === 'dbm-role' && e.newValue !== ME.id && !qs.get('as');
    if (role || ['dbm-docs', 'dbm-model', 'dbm-dict', 'dbm-batches', 'dbm-pub', 'dbm-cands'].includes(e.key) || e.key.startsWith('dbm-mdata-')) {
      staleShown = true;
      toast(role ? '다른 탭에서 사용자가 바뀌었습니다 — 이 화면의 처리 버튼은 새로고침할 때까지 막힙니다' : '다른 탭에서 상태가 바뀌었습니다 — 최신 상태로 다시 불러오세요', role ? 'danger' : 'info', { label: '새로고침', fn: () => location.reload() });
    }
  });
  window.updateNeeds = updateNeeds;

  function wire() {
    document.addEventListener('click', e => {
      const op = e.target.closest('[data-open]');
      if (op && !op.disabled) {
        e.preventDefault();
        op.dataset.open.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) { el.classList.add('open'); if (el.classList.contains('overlay')) { el._opener = op; const f = el.querySelector('textarea, input, select, button'); if (f) setTimeout(() => f.focus(), 0); } } });
        if (op.dataset.closeOthers) op.dataset.closeOthers.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) el.classList.remove('open'); });
      }
      const cl = e.target.closest('[data-close]');
      if (cl && !cl.disabled) { e.preventDefault(); cl.dataset.close.split(',').forEach(id => { const el = document.getElementById(id.trim()); if (el) { el.classList.remove('open'); if (el._opener && el._opener.isConnected) el._opener.focus(); } }); }
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
      const ov = document.querySelector('.overlay.open');
      if (e.key === 'Escape' && ov) { ov.classList.remove('open'); if (ov._opener && ov._opener.isConnected) ov._opener.focus(); return; }
      // focus trap inside an open dialog
      if (e.key === 'Tab' && ov) {
        const f = [...ov.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
        if (f.length) { const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { f[0].focus(); e.preventDefault(); } }
      }
      // keyboard activation for non-button widgets (chips, clickable rows, cards)
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.chip:not(button), .kindcard, .ocard, tr.click, .cand, .dict-item')) { e.preventDefault(); e.target.click(); }
      if (e.key === '?' && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]'))) { e.preventDefault(); openKeys(); }
    });
    // make those widgets focusable and announce pressed state
    const a11y = () => document.querySelectorAll('.chip:not(button):not([tabindex]), .kindcard:not([tabindex]), .ocard:not([tabindex]), tr.click:not([tabindex])').forEach(el => { el.tabIndex = 0; if (!el.matches('tr')) el.setAttribute('role', 'button'); });
    const pressed = () => document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false'));
    new MutationObserver(() => { a11y(); pressed(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    a11y(); pressed();
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
    // list skeleton (10 #7): a short loading layer over list tables on first entry — purely visual, data is already there
    if (new URLSearchParams(location.search).get('skel') === '1') document.querySelectorAll('.scroll > table.tbl').forEach(tb => { const sc = tb.parentElement; if (!tb.tBodies[0] || !tb.tBodies[0].rows.length) return;
      const ov = document.createElement('div'); ov.className = 'skel-ov'; ov.setAttribute('aria-hidden', 'true');
      const cols = Math.min(6, (tb.tHead && tb.tHead.rows[0] ? tb.tHead.rows[0].cells.length : 4));
      ov.innerHTML = Array.from({ length: 6 }, (_, r) => `<div class="skel-r">${Array.from({ length: cols }, (_, c) => `<span class="skel" style="width:${[40, 70, 55, 85, 60, 45][(r + c) % 6]}%"></span>`).join('')}</div>`).join('');
      sc.style.position = sc.style.position || 'relative'; sc.appendChild(ov); setTimeout(() => { ov.classList.add('out'); setTimeout(() => ov.remove(), 200); }, 320); });
    try { const f = JSON.parse(sessionStorage.getItem('dbm-flash') || 'null'); if (f) { sessionStorage.removeItem('dbm-flash'); setTimeout(() => toast(f[0], f[1]), 100); } } catch (e) {}
  });
})();
