/* NeoDB mockup shell & interactions (static, no backend) — v4 */
(function () {
  window.__errs = []; window.addEventListener('error', e => window.__errs.push(e.message));   // mockup self-check (review scripts read this)
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
    kim: { id: 'kim', name: '김모델', org: '데이터정책팀', mail: 'kim@kda.go.kr', roles: ['modeler', 'da'], systems: ['요구사항관리', '인사시스템'] },
    park: { id: 'park', name: '박설계', org: '정보화사업팀', mail: 'park@kda.go.kr', roles: ['modeler'], systems: ['요구사항관리'] },
    lee: { id: 'lee', name: '이데이터', org: '데이터정책팀', mail: 'lee@kda.go.kr', roles: ['da', 'admin'], systems: ['전체'] },
    hyun: { id: 'hyun', name: '이현업', org: '기획조정실', mail: 'hyun@kda.go.kr', roles: ['owner'], systems: ['전체'] },
    choi: { id: 'choi', name: '최담당', org: '재무회계팀', mail: 'choi@kda.go.kr', roles: ['owner', 'modeler'], systems: ['회계시스템'] }
  };
  const ROLE_NAME = { modeler: '모델러', da: 'DA', owner: '기관 담당자', admin: 'Admin' };
  window.USERS = USERS; window.ROLE_NAME = ROLE_NAME;
  // roles changed in settings (SC-42) apply to everyone — the mock "server" copy of user roles
  try { const ov = JSON.parse(store.get('dbm-user-roles', 'null')); if (ov) Object.entries(ov).forEach(([id, r]) => { if (USERS[id]) USERS[id].roles = r; }); } catch (e) {}
  // ?as=role from a scenario/shortcut link becomes the selected demo user (kept while moving between screens — CL12-01)
  if (qs.get('as') && USERS[qs.get('as')] && store.get('dbm-role', 'kim') !== qs.get('as')) store.set('dbm-role', qs.get('as'));
  const meId = store.get('dbm-role', 'kim');
  const ME = Object.assign({}, USERS[meId] || USERS.kim, { has(r) { return this.roles.includes(r); } });
  window.ME = ME;
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
  window.myQueue = (docs) => docs.filter(d => (d.step === 'da' && ME.has('da')) || (d.step === 'final' && ME.has('owner')));
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
    const doc = Object.assign({ id: nextDocId(docs), req: ME.id, step: 'da', date: now(), cc: [], hist: [], n: 1, line: lineFor(o.type, o.area), policyVer: getPolicy().ver, submittedAt: today() + ' ' + now().split(' ')[1] }, o);
    docs.unshift(doc); saveDocs(docs);
    // items with an existing id become "pending" in the dictionary (MD-10: one open request per item)
    if (doc.items) { const dict = getDict(); doc.items.forEach(it => { const d = it.id && dict.find(x => x.id === it.id); if (d) d.pending = doc.id; }); saveDict(dict); }
    pushNotif({ to: Object.values(USERS).filter(u => u.roles.includes('da') && u.id !== ME.id).map(u => u.id), k: 'appr', t: `${doc.id} ${doc.type === 'model' ? '모델 확정' : '사전 신청'} — DA 승인 차례`, m: `${ME.name} · ${doc.title}`, href: `approvals.html?doc=${doc.id}` });
    return { doc, dup: false };
  };
  window.addHist = (doc, e) => { doc.hist = (doc.hist || []).concat([Object.assign({ at: now(), who: ME.name }, e)]); };

  /* ---- model versions & locks: computed from documents, never from the URL ---- */
  const MODEL0 = { rq: { ver: 5, base: 4, name: '요구사항 · 프로젝트' }, risk: { ver: 2, base: 1, name: '리스크' } };
  window.getModels = () => J('dbm-model', clone(MODEL0));
  window.getModel = area => getModels()[area] || MODEL0.rq;
  /* new business area (system home [+ 업무 영역], DDL import): id, name, v1 working version, optional imported structure */
  window.addArea = (name, structure, meta) => {
    const all = getModels(); let n = 1; while (all['a' + n]) n++; const id = 'a' + n;
    all[id] = Object.assign({ ver: 1, base: 0, name }, meta || {}); S('dbm-model', all);
    if (structure) { S('dbm-area-seed-' + id, structure); setModelData(id, 1, Object.assign({}, structure, { rev: 0 })); }
    return id;
  };
  window.setModel = (area, m) => { const all = J('dbm-model', clone(MODEL0)); all[area] = m; S('dbm-model', all); };
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
    { id: 'rqrm', n: '요구사항내역', p: 'RQRM_D', c: 'A', x: 60, y: 340, px: 60, py: 380, a: [
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
    { f: 'dlv', t: 'hist', k: 'id', name: '기록된다' },
    { f: 'rqrm', t: 'risk', k: 'mn', name: '관련된다' }
  ], M: [{ id: 'm1', mode: 'L', x: 820, y: 330, text: '산출물이력 순번 체계는 DA 확인 후 확정 (11/18 회의)', by: '박설계' }] },
    risk: { E: [{ id: 'risk', n: '리스크기본', p: 'RISK_M', c: 'M', x: 60, y: 60, px: 60, py: 60, a: [{ n: '리스크ID', p: 'RISK_ID', t: 'VARCHAR2(10)', pk: 1, nn: 1, s: 'ok' }, { n: '리스크명', p: 'RISK_NM', t: 'VARCHAR2(100)', s: 'ok' }, { n: '리스크등급코드', p: 'RISK_GRD_CD', t: 'CHAR(1)', s: 'ok' }] },
      { id: 'rsp', n: '리스크대응내역', p: 'RISK_RSPNS_D', c: 'A', x: 420, y: 60, px: 460, py: 60, a: [{ n: '리스크ID', p: 'RISK_ID', t: 'VARCHAR2(10)', pk: 1, fk: 1, nn: 1, s: 'ok' }, { n: '대응순번', p: 'RSPNS_SN', t: 'NUMBER(5)', pk: 1, nn: 1, s: 'ok' }, { n: '대응내용', p: 'RSPNS_CN', t: 'VARCHAR2(1000)', s: 'ok' }] }], R: [{ f: 'risk', t: 'rsp', k: 'id', name: '대응한다' }], M: [] }
  };
  window.modelSeed = area => clone(MODEL_SEED[area] || (J('dbm-area-seed-' + area, null)) || { E: [], R: [], M: [] });
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
    { id: 'C-0005', k: 'code', kn: '코드', src: '기관', st: '사용', name: '산출물유형', abbr: 'DLVRBL_TYPE', dom: '코드C2', dg: '코드', eng: '문서·코드·모델·기타', ver: 1, cha: 12, dt: '2026-11-17', use: 1, syn: [], forbid: [], old: [], hist: [] },
    { id: 'W-0210', k: 'word', kn: '단어', src: '공통', st: '사용', name: '수신자', abbr: 'RCVR', dom: '—', eng: 'receiver', ver: 1, cha: 3, dt: '2025-11-30', use: 3, syn: ['수취인'], forbid: ['수령인'], old: [], hist: [] },
    // V0 (삭제 보관) samples: one still referenced (permanent delete blocked), one free to purge
    { id: 'W-0097', k: 'word', kn: '단어', src: '기관', st: '삭제 보관', name: '산출근거문서', abbr: 'CALC_BSDC', dom: '—', eng: '산출근거로 통합', ver: 3, cha: 12, dt: '2026-11-05', use: 0, syn: [], forbid: [], old: [], delDoc: 'REQ-2026-0001', hist: [{ v: 'V0', at: '2026-11-05 10:00', act: '삭제 보관', doc: 'REQ-2026-0001', by: '이데이터', why: '산출근거로 통합', diff: [] }] },
    { id: 'W-0096', k: 'word', kn: '단어', src: '기관', st: '삭제 보관', name: '결과물품', abbr: 'RSLT_GDS', dom: '—', eng: '결과물로 통합', ver: 2, cha: 12, dt: '2026-11-05', use: 1, syn: [], forbid: [], old: [], delDoc: 'REQ-2026-0001', hist: [{ v: 'V0', at: '2026-11-05 10:00', act: '삭제 보관', doc: 'REQ-2026-0001', by: '이데이터', why: '결과물로 통합', diff: [] }] },
    { id: 'W-0211', k: 'word', kn: '단어', src: '공통', st: '사용', name: '검사', abbr: 'INSP', dom: '—', eng: 'inspection', ver: 1, cha: 3, dt: '2025-11-30', use: 6, syn: [], forbid: [], old: [], hist: [] }
  ];
  window.getDict = () => J('dbm-dict', clone(DICT0));
  window.saveDict = d => S('dbm-dict', d);
  const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  /* ---- v7: dictionary apply is exact (S2) ----
     item operation is explicit: 추가 (new) · 변경 (existing id) · 미사용 (existing id).
     A change applies the changed FIELDS (not just the version); a missing target is a failure, never a new item. */
  const KIND_NAME = { word: '단어', term: '용어', domain: '도메인', code: '코드' };
  const FIELD = { 단어명: 'name', 용어명: 'name', 이름: 'name', 영문약어명: 'abbr', 약어: 'abbr', 도메인: 'dom', 설명: 'desc', 영문명: 'eng', '허용 값': 'allow', 사용상태: 'st' };
  window.FIELD_KEY = FIELD;
  const opOf = it => it.act === '미사용' ? '미사용' : (it.id && it.act !== '추가') ? '변경' : '추가';
  const kindOf = it => it.k && it.k !== 'chg' ? it.k : null;
  /* items currently in an open (DA/final) document — used for duplicate checks before a doc exists in the dictionary */
  window.openItems = (exceptDoc) => getDocs().filter(d => d.type === 'dict' && ['da', 'final'].includes(d.step) && d.id !== exceptDoc).flatMap(d => (d.items || []).map(it => ({ doc: d.id, it })));
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
      if (op === '추가' && k === 'term') {
        if (it.dom && !knownDomains().has(it.dom)) res.problems.push(`도메인 '${it.dom}'이 사전에 없음`);
        if ((it.abbr || '').length > 30) res.problems.push(`영문약어명 ${it.abbr.length}자 — 30자 초과(대상 DBMS 기준)`);
        if (it.dom !== '엔터티' && it.dom !== '엔터티 용어') { const dc = decompose(name); const pend = dc.pending.filter(p => !(doc.items || []).some(o => o.k === 'word' && o.name === p.w)); if (pend.length) res.problems.push(`구성 단어 미승인: ${pend.map(p => p.w + (p.doc ? `(${p.doc} 진행 중)` : '')).join(', ')}`); }
      }
      if (op === '추가') {
        if (k === 'word' && !(it.abbr || '').trim()) res.problems.push('영문약어명이 비어 있음');
        { const lim = (window.getPolicy ? getPolicy().wordAbbr : 0) || 6; if (k === 'word' && (it.abbr || '').length > lim) res.problems.push(`단어 영문약어명 ${lim}자 초과(검수 기준)`); }
        const same = dict.find(x => x.name === name && (!k || x.k === k) && x.ver > 0);
        if (same) res.problems.push(`같은 이름의 ${same.kn}이 이미 있음(${same.id} · ${same.src}) — 변경 신청으로`);
        const o = open.find(x => x.it.name === name && (!x.it.k || !k || x.it.k === k) && opOf(x.it) === '추가');
        if (o) res.problems.push(`${o.doc}에서 같은 이름을 신청 중`);
      } else {
        const d = dict.find(x => x.id === it.id);
        if (!d) res.problems.push(`대상 항목 ${it.id}가 사전에 없음`);
        else {
          if (d.src === '공통') res.problems.push('공통 표준은 기관에서 바꿀 수 없음');
          if (d.pending && d.pending !== doc.id && getDocs().some(x => x.id === d.pending && ['da', 'final'].includes(x.step))) res.problems.push(`${d.pending}에서 같은 항목을 신청 중`);
          if (op === '변경' && !Object.keys(it.chg || {}).length && !Object.keys(it.set || {}).length) res.problems.push('바뀌는 칸이 없음');
          if (op === '미사용' && d.st === '미사용') res.problems.push('이미 미사용');
        }
      }
      out.push(res);
    });
    return out;
  };
  window.applyDictDoc = doc => {
    const dict = getDict(), ch = getChanges(), at = today() + ' ' + now().split(' ')[1];
    const items = doc.items || [], applied = [], failed = [];
    items.forEach(it => {
      const op = opOf(it), k = kindOf(it) || 'term';
      let d = it.id ? dict.find(x => x.id === it.id) : null;
      let diff = [], act = op;
      if (op === '미사용') {
        if (!d) { failed.push([it.name, `대상 ${it.id} 없음`]); return; }
        diff = [['사용상태', d.st, '미사용']]; d.st = '미사용'; d.ver += 1;
      } else if (op === '변경') {
        if (!d) { failed.push([it.name, `대상 ${it.id} 없음`]); return; }
        Object.entries(it.chg || {}).forEach(([label, v]) => { const key = FIELD[label] || label; diff.push([label, d[key] == null ? '' : d[key], v[1]]); d[key] = v[1]; });
        Object.entries(it.set || {}).forEach(([key, v]) => { if (diff.some(x => (FIELD[x[0]] || x[0]) === key)) return; diff.push([key, d[key] == null ? '' : d[key], v]); d[key] = v; });
        if (FIELD[Object.keys(it.chg || {})[0]] === 'name' && diff[0]) d.old = (d.old || []).concat([diff[0][1]]);
        d.ver += 1;
      } else {
        // a placeholder created by the document itself (e.g. 엔터티 용어 '신청 중', ver 0) becomes V1; anything else with the same name is a conflict
        const ph = dict.find(x => x.name === it.name && x.k === k && x.ver === 0 && (!x.pending || x.pending === doc.id));
        const clash = dict.find(x => x.name === it.name && x.k === k && x.ver > 0);
        if (clash) { failed.push([it.name, `같은 이름 ${clash.id} 이미 있음`]); return; }
        if (ph) { d = ph; d.ver = 1; d.st = '사용'; }
        else { d = { id: (() => { const pre = k === 'word' ? 'W-' : k === 'domain' ? 'D-' : k === 'code' ? 'C-' : 'T-'; const seq = Math.max(+store.get('dbm-idseq', '500'), ...dict.map(x => +String(x.id).slice(2) || 0)) + 1; store.set('dbm-idseq', String(seq)); return pre + String(seq).padStart(4, '0'); })(), k, kn: KIND_NAME[k] || '용어', src: '기관', st: '사용', name: it.name, abbr: it.abbr || '—', dom: it.dom || '—', eng: it.eng || '', desc: it.desc || '', ver: 1, cha: null, dt: today(), use: 0, syn: [], forbid: [], old: [], hist: [] }; dict.push(d); }
      }
      d.dt = today(); if (d.pending === doc.id) delete d.pending;
      d.hist = d.hist || []; d.hist.unshift({ v: 'V' + d.ver, at, act, doc: doc.id, by: ME.name, why: it.why || doc.reason, diff });
      ch.unshift({ at, item: d.name, kind: d.kn, act, ver: 'V' + d.ver, doc: doc.id, by: ME.name, diff: diff.map(x => `${x[0]}: ${x[1] === '' ? '(빈 값)' : x[1]} → ${x[2]}`).join(' · ') + (doc.batch ? `${diff.length ? ' · ' : ''}업로드 ${doc.batch}` : ''), fields: diff, itemId: d.id, firstVer: op === '추가' });
      applied.push(d.id);
    });
    saveDict(dict); saveChanges(ch);
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
  window.pushAudit = e => { const all = J('dbm-audit', []); all.unshift(Object.assign({ id: 'au' + Date.now() + Math.random().toString(36).slice(2, 5), at: today() + ' ' + now().split(' ')[1], who: ME.name, whoId: ME.id }, e)); S('dbm-audit', all.slice(0, 300)); };
  window.getAudit = () => J('dbm-audit', []);

  /* ---- validation policy (검수 기준) with a version number — documents and upload validations remember the version they were checked with ---- */
  window.getPolicy = () => J('dbm-policy', { ver: 3, at: '2026-11-10 09:00', by: '이데이터', hist: [{ ver: 3, at: '2026-11-10 09:00', by: '이데이터', what: '용어 영문약어명 상한 30자(Oracle 기준)' }, { ver: 2, at: '2026-10-20 14:00', by: '이데이터', what: '단어 영문약어명 6자 이내' }] });
  window.savePolicy = p => S('dbm-policy', p);
  window.dictRev = () => getChanges().length;   // a cheap "dictionary changed" marker for validation tokens

  /* ---- word decomposition for analysis (term names → standard words). Common words are seeded here for the mockup ---- */
  const COMMON_WORDS = { 요구사항: 'DEMND_MATER', 프로젝트: 'PRJ', 제출: 'SBMT', 일자: 'YMD', 명: 'NM', ID: 'ID', 코드: 'CD', 결과: 'RSLT', 내용: 'CN', 이력: 'HIST', 순번: 'SN', 상태: 'STTS', 우선순위: 'PRIOR', 부서: 'DEPT', 요청: 'REQ', 고객: 'CUST', 금액: 'AMT', 수주: 'WINCON', 기본: 'M', 승인: 'APRV', 완료: 'CMPTN', 리스크: 'RISK', 등급: 'GRD', 대응: 'RSPNS', 발주처: 'ORDR_OFC', 종료: 'END', 유형: 'TYPE', 구분: 'SE', 번호: 'NO', 여부: 'YN', 일시: 'DT', 등록: 'REG', 수정: 'MDFCN', 자: 'R', 물품: 'GOODS', 사원: 'EMP', 팀원: 'TMBR', 투입: 'INPT', 시작: 'BEGIN', 역할: 'ROLE', 구성: 'CMPS', 내역: 'D', 날짜: 'DATE' };
  window.decompose = name => {
    const dict = getDict(); const open = openItems();
    const words = {};
    Object.entries(COMMON_WORDS).forEach(([w, ab]) => { words[w] = { w, abbr: ab, src: '공통', ok: true }; });
    dict.filter(x => x.k === 'word').forEach(x => { words[x.name] = { w: x.name, abbr: x.abbr, src: x.src, ok: x.ver > 0 && x.st === '사용', id: x.id }; });
    open.filter(o => o.it.k === 'word' && (o.it.act || '추가') === '추가').forEach(o => { if (!words[o.it.name]) words[o.it.name] = { w: o.it.name, abbr: o.it.abbr, src: '신청 중', ok: false, doc: o.doc }; else if (!words[o.it.name].ok) words[o.it.name].doc = o.doc; });
    const keys = Object.keys(words).sort((a, b) => b.length - a.length);
    const parts = []; let i = 0, unknown = '';
    while (i < name.length) { const k = keys.find(w => name.startsWith(w, i)); if (k) { if (unknown) { parts.push({ w: unknown, unknown: true }); unknown = ''; } parts.push(words[k]); i += k.length; } else { unknown += name[i]; i++; } }
    if (unknown) parts.push({ w: unknown, unknown: true });
    const unk = parts.filter(p => p.unknown), pend = parts.filter(p => !p.unknown && !p.ok);
    return { parts, unknown: unk, pending: pend, abbr: parts.map(p => p.abbr || '?').join('_'), ok: !unk.length && !pend.length, sus: parts.some(p => !p.unknown && p.w.length === 1 && !['명', '자'].includes(p.w)) };
  };
  window.knownDomains = () => new Set(getDict().filter(x => x.k === 'domain').map(x => x.name).concat(['연월일C8', '명V100', 'ID V10', '코드C1', '코드C2', '여부C1', '내용V1000', '금액N15', '일련번호N10', '일시T', '엔터티 용어', '엔터티']));

  /* ---- candidate queue lives in the state layer: model / standardize register, candidate queue / home / nav read (CX13-03) ---- */
  const CANDS0 = [
    { id: 'c1', t: '단어', name: '수령자', abbr: 'RCPNT', sim: ['수신자', 'RCVR', '공통'], doc: 'REQ-2026-0012', loc: [{ area: 'rq', e: 'dlv', ent: '산출물기본', attr: '산출물수령자명', by: 'kim' }, { area: 'rq', e: 'hist', ent: '산출물이력', attr: '수령자ID', by: 'kim' }, { area: 'hr', ent: '교재배부', attr: '수령자명', by: 'park', sys: '인사시스템' }, { area: 'hr', ent: '교재배부', attr: '수령일자', by: 'park', sys: '인사시스템' }] },
    { id: 'c2', t: '단어', name: '검수', abbr: 'INSPCT', sim: ['검사', 'INSP', '공통'], loc: [{ area: 'rq', e: 'dlv', ent: '산출물기본', attr: '산출물검수결과코드', by: 'park' }, { area: 'rq', e: 'hist', ent: '산출물이력', attr: '검수일자', by: 'park' }] },
    { id: 'c3', t: '용어', name: '요구사항변경사유내용', abbr: 'DEMND_MATER_CHG_RSN_CN', sim: null, loc: [{ area: 'rq', e: 'rqrm', ent: '요구사항내역', attr: '변경사유', by: 'kim' }] }
  ];
  /* linked term request state — model, standardize and approvals read the same rule (CX14-02/03) */
  window.linkState = docId => { const d = docId && getDocs().find(x => x.id === docId); if (!d) return { s: 'none', d: null }; return { s: d.step === 'done' ? 'done' : ['rejected', 'withdrawn'].includes(d.step) ? 'ended' : 'live', d }; };
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
  window.canSeeDoc = d => !!d && (ME.has('da') || ME.has('owner') || d.req === ME.id || (d.cc || []).includes(ME.id));
  window.canSeeBatch = b => !!b && (b.by === ME.id || ME.has('da'));
  /* model diff between two stored structures (by entity id / attribute logical name) */
  window.modelDiff = (a, b) => {
    const out = []; if (!a || !b) return null;
    const ea = new Map(a.E.map(e => [e.id, e])), eb = new Map(b.E.map(e => [e.id, e]));
    b.E.forEach(e => { if (!ea.has(e.id)) out.push(['추가', `${e.n} ${e.p}`, '—', `엔터티 · 속성 ${e.a.length}`]); });
    a.E.forEach(e => { if (!eb.has(e.id)) out.push(['삭제', `${e.n} ${e.p}`, `엔터티 · 속성 ${e.a.length}`, '—']); });
    b.E.forEach(e => { const o = ea.get(e.id); if (!o) return;
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
  window.pushNotif = n => { if (n.to && n.k !== 'sys') { n = Object.assign({}, n, { to: n.to.filter(u => { const p = getNotifyPref(u)[n.k]; return !p || p.app !== false; }) }); if (!n.to.length) return; } const all = J('dbm-notifs', []); all.unshift(Object.assign({ id: 'd' + Date.now() + Math.random().toString(36).slice(2, 5), at: now() }, n)); S('dbm-notifs', all.slice(0, 50)); };

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
    right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>',
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
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>'
  };
  window.icon = (n, s = 16) => `<svg class="ic${s === 12 ? ' s12' : ''}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${s === 12 ? 2 : 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LU[n] || ''}</svg>`;
  /* <i data-ic=name> placeholders (usable in any HTML or JS string) become SVG icons — also for content rendered later */
  const fillIc = root => { if (!root || !root.querySelectorAll) return; root.querySelectorAll('i[data-ic]:not([data-done])').forEach(e => { e.innerHTML = icon(e.dataset.ic, e.dataset.s ? +e.dataset.s : 16); e.setAttribute('data-done', '1'); e.setAttribute('aria-hidden', 'true'); }); };
  document.addEventListener('DOMContentLoaded', () => { fillIc(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) fillIc(n.matches && n.matches('i[data-ic]') ? n.parentElement : n); }))).observe(document.body, { childList: true, subtree: true }); });
  /* ⋯ menus: a [data-menu-btn] opens the .menu[data-auto] next to it; outside click / Esc closes */
  document.addEventListener('click', e => { const b = e.target.closest('[data-menu-btn]'); document.querySelectorAll('.menu[data-auto].open').forEach(m => { if (!b || m !== b.nextElementSibling) { m.classList.remove('open'); const ob = m.previousElementSibling; if (ob) ob.setAttribute('aria-expanded', 'false'); } });
    if (b) { const m = b.nextElementSibling; if (m && m.matches('.menu[data-auto]')) { const on = !m.classList.contains('open'); m.classList.toggle('open', on); b.setAttribute('aria-expanded', on); if (on) { const f = m.querySelector('.mi'); f && f.focus(); } } } });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; const m = document.querySelector('.menu[data-auto].open'); if (m) { m.classList.remove('open'); const b = m.previousElementSibling; if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); } } });
  /* buttons that start work show a short "in progress" state ([data-busy]) — the action itself runs as before */
  document.addEventListener('click', e => { const b = e.target.closest('[data-busy]'); if (!b || b.disabled || b.classList.contains('loading')) return; b.classList.add('loading'); b.setAttribute('aria-busy', 'true'); setTimeout(() => { b.disabled = true; }, 0); setTimeout(() => { b.classList.remove('loading'); b.removeAttribute('aria-busy'); b.disabled = false; }, +b.dataset.busy || 600); }, true);
  /* status tag: ok · run · mine · warn · err · ex · end — one per row */
  const TAG_IC = { ex: 'flag' };   // Geist: no check / X icons inside status badges — colour + words
  window.tag = (kind, label) => `<span class="tag ${kind}">${TAG_IC[kind] ? icon(TAG_IC[kind], 12) : ''}${label}</span>`;
  /* the mock's reference day and the age of a document in its current step (home · approvals use the same count) */
  window.MOCK_TODAY = new Date(2026, 10, 19);
  const toDay = s => { if (!s) return null; let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return new Date(+m[1], m[2] - 1, +m[3]); m = /(\d{1,2})\/(\d{1,2})/.exec(s); return m ? new Date(2026, m[1] - 1, +m[2]) : null; };
  window.toDay = toDay;
  /* days in the current step: DA waits from submission, final waits from the DA approval — failed re-checks do not restart the clock */
  window.docAge = d => { let from = d.date; if (d.step === 'final') { const a = (d.hist || []).filter(x => x.step === 'da' && /승인/.test(x.act || '') && !/실패|취소/.test(x.act || '')).pop(); if (a) from = a.at; }
    const t = toDay(from) || MOCK_TODAY; return Math.max(0, Math.round((MOCK_TODAY - t) / 864e5)); };
  window.docLate = d => ['da', 'final'].includes(d.step) && docAge(d) >= ((getOrg && getOrg().sla) || 3);
  /* document state as a tag: in progress = outline (accent when it is my turn), late = error, rejected = error, done = ok, withdrawn = faint */
  window.docTag = d => { const mineTurn = (d.step === 'da' && ME.has('da')) || (d.step === 'final' && ME.has('owner'));
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

  /* ---- model tree (11 §2.2): system · find · business areas (current one open) · system tools · recent entities · collapse ---- */
  const SYSTEMS = [{ name: '요구사항관리', db: 'Oracle 19c', code: 'RQMS', href: 'system.html', cur: true }, { name: '인사시스템', db: 'Tibero 7', href: 'error.html?code=404&what=인사시스템', none: true }, { name: '회계시스템', db: 'PostgreSQL 15', href: 'error.html?code=404&what=회계시스템', none: true }];
  function drawTree(nav) {
    const page = document.body.dataset.page, file = curFile(), qp = new URLSearchParams(location.search), models = getModels();
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fam = ['model.html', 'standardize.html', 'ddl.html', 'outputs.html'].includes(file) && !qp.get('sys');
    const famArea = fam ? (models[qp.get('area')] ? qp.get('area') : 'rq') : null;
    if (famArea) store.set('dbm-last-area', famArea);
    const cur = famArea || (models[store.get('dbm-last-area', '')] ? store.get('dbm-last-area', '') : 'rq');
    const openSt = J('dbm-tree-open2', {});
    const isOpen = id => id in openSt ? !!openSt[id] : id === cur;
    const href = id => 'model.html' + (id === 'rq' ? '' : '?area=' + id);
    const state = id => { const L = modelLock(id); return L.state === 'review' ? '<span class="tbadge">검토</span>' : L.state === 'confirmed' ? '<span class="tbadge">확정</span>' : `<span class="tver" title="작업 중 v${models[id].ver}">v${models[id].ver}</span>`; };
    const subs = id => {
      const bad = compOf(modelOf(id, models[id].ver)).bad;
      const on = f => famArea === id && file === f ? ' on" aria-current="page' : '';
      return `<a class="tl sub${on('model.html')}" href="${href(id)}">모델</a>
        <a class="tl sub${on('standardize.html')}" href="standardize.html?area=${id}">표준 맞추기${bad ? `<span class="tn" title="미준수 ${bad}">${bad}</span>` : ''}</a>
        <a class="tl sub${on('ddl.html')}" href="ddl.html?area=${id}">DDL</a>
        <a class="tl sub${on('outputs.html')}" href="outputs.html?area=${id}">산출물</a>`;
    };
    const areasHtml = q => {
      q = (q || '').trim().toUpperCase();
      let found = 0;
      const html = Object.entries(models).map(([id, m]) => {
        let ents = [], nameHit = false;
        if (q) {
          ents = (modelOf(id, m.ver).E || []).filter(e => !e.ref && (String(e.n).toUpperCase().includes(q) || String(e.p || '').toUpperCase().includes(q)));
          nameHit = String(m.name).toUpperCase().includes(q);
          if (!nameHit && !ents.length) return '';
          found += ents.length + (nameHit ? 1 : 0);
        }
        const open = !!q || isOpen(id);
        const more = ents.length > 12 ? `<div class="tempty">외 ${ents.length - 12}개 · 모델에서 찾기</div>` : '';
        return `<div class="tarea${id === cur ? ' cur' : ''}">
          <div class="trow"><button class="tx" type="button" data-tx="${id}" aria-expanded="${open}" aria-controls="ts-${id}" aria-label="${esc(m.name)} 하위 메뉴"${q ? ' disabled' : ''}><i data-ic=${open ? 'down' : 'right'} data-s=12></i></button><a class="tname" href="${href(id)}" title="${esc(m.name)}">${esc(m.name)}</a>${state(id)}</div>
          ${open ? `<div class="tsubs" id="ts-${id}">${(!q || nameHit) ? subs(id) : ''}${ents.slice(0, 12).map(e => `<a class="tl sub" href="model.html?area=${id}&focus=${e.id}">${esc(e.n)}${e.p && e.p !== '—' ? `<span class="tn mono">${esc(e.p)}</span>` : ''}</a>`).join('')}${more}</div>` : ''}
        </div>`;
      }).join('');
      const live = nav.querySelector('#tr-live'); if (live) live.textContent = q ? (found ? `${found}건 찾음` : '맞는 영역·엔터티가 없습니다') : '';
      return html || '<div class="tempty">맞는 영역·엔터티가 없습니다</div>';
    };
    const recHtml = () => { const rec = J(recKey(), []).filter(r => models[r.area] && (modelOf(r.area, models[r.area].ver).E || []).some(e => e.id === r.id));
      return rec.length ? rec.map(r => `<a class="tl" href="model.html?area=${r.area}&focus=${r.id}"><i data-ic=history></i><span class="tt">${esc(r.n)}</span><span class="tn">${esc(models[r.area].name)}</span></a>`).join('') : '<div class="tempty">모델에서 엔터티를 열면 여기에 남습니다</div>'; };
    const min = () => document.getElementById('app').classList.contains('treemin');
    const canNew = ME.has('modeler') || ME.has('admin');
    const sys = SYSTEMS[0];
    nav.innerHTML = `
      <div class="tfull" id="tr-full">
        <div class="tsys">
          <a class="tsys-a${page === 'system' ? ' on' : ''}" href="system.html"${page === 'system' ? ' aria-current="page"' : ''} title="시스템 홈"><b>${sys.name}</b><span>${sys.db} · ${sys.code}</span></a>
          <span class="tmw"><button class="tsw" type="button" data-menu-btn aria-expanded="false" aria-controls="mn-sys" aria-label="시스템 바꾸기"><i data-ic=down data-s=14></i></button><div class="menu" data-auto id="mn-sys">${SYSTEMS.map(s => `<a class="mi${s.cur ? ' on' : ''}" href="${s.href}"${s.cur ? ' aria-current="true"' : ''}><span>${s.name}</span><span class="caption muted" style="margin-left:auto">${s.none ? '목업 화면 없음' : s.db}</span></a>`).join('')}</div></span>
        </div>
        <label class="tfind"><i data-ic=search data-s=14></i><input id="tr-q" type="search" placeholder="영역·엔터티 찾기" aria-label="업무 영역·엔터티 찾기" autocomplete="off"></label><div class="sr-only" id="tr-live" aria-live="polite"></div>
        <div class="tsec"><span>업무 영역</span>${canNew ? '<a class="tadd" href="system.html#new" aria-label="새 업무 영역" title="새 업무 영역"><i data-ic=plus data-s=14></i></a>' : ''}</div>
        <div class="tareas" id="tr-areas">${areasHtml('')}</div>
        <div class="tsep"></div>
        <a class="tl${file === 'model.html' && qp.get('sys') ? ' on" aria-current="page' : ''}" href="model.html?sys=1"><i data-ic=compare></i>시스템 전체 ERD</a>
        <a class="tl${file === 'import.html' ? ' on" aria-current="page' : ''}" href="import.html"><i data-ic=upload></i>DDL 가져오기</a>
        <div class="tsec"><span>최근 연 엔터티</span></div>
        <div id="tr-rec">${recHtml()}</div>
      </div>
      <div class="tmini" aria-label="접힌 모델 트리">
        <a class="tm-i${page === 'system' ? ' on" aria-current="page' : ''}" href="system.html" title="시스템 홈 · ${sys.name}" aria-label="시스템 홈"><i data-ic=table></i></a>
        ${Object.entries(models).map(([id, m]) => `<a class="tm-i tm-a${id === famArea ? ' on" aria-current="true' : ''}" href="${href(id)}" title="${esc(m.name)}" aria-label="${esc(m.name)}">${esc(String(m.name).trim()[0])}</a>`).join('')}
        <a class="tm-i${file === 'model.html' && qp.get('sys') ? ' on" aria-current="page' : ''}" href="model.html?sys=1" title="시스템 전체 ERD" aria-label="시스템 전체 ERD"><i data-ic=compare></i></a>
        <a class="tm-i${file === 'import.html' ? ' on" aria-current="page' : ''}" href="import.html" title="DDL 가져오기" aria-label="DDL 가져오기"><i data-ic=upload></i></a>
      </div>
      <button class="tcollapse" id="tr-min" type="button"></button>`;
    const btn = nav.querySelector('#tr-min');
    const syncMin = () => { const m = min(); btn.innerHTML = `<i data-ic=${m ? 'right' : 'left'}></i><span>접기</span>`; btn.setAttribute('aria-label', m ? '모델 트리 펼치기' : '모델 트리 접기'); btn.setAttribute('aria-expanded', String(!m)); btn.setAttribute('aria-controls', 'tr-full'); btn.title = m ? '펼치기' : '접기'; };
    syncMin();
    btn.addEventListener('click', () => { const app = document.getElementById('app'); app.classList.toggle('treemin'); store.set('dbm-tree-min', min() ? '1' : '0'); syncMin(); window.dispatchEvent(new Event('resize')); });
    const areas = nav.querySelector('#tr-areas'), q = nav.querySelector('#tr-q');
    q.addEventListener('input', () => { areas.innerHTML = areasHtml(q.value); });
    q.addEventListener('keydown', e => { if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; areas.innerHTML = areasHtml(''); } });
    areas.addEventListener('click', e => {
      const t = e.target.closest('[data-tx]'); if (!t) return;
      const id = t.dataset.tx; openSt[id] = !isOpen(id); S('dbm-tree-open2', openSt);
      areas.innerHTML = areasHtml(q.value); const nb = areas.querySelector(`[data-tx="${id}"]`); if (nb) nb.focus();
    });
    window.addEventListener('dbm-recent', () => { const r = nav.querySelector('#tr-rec'); if (r) r.innerHTML = recHtml(); });
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
    const TAB = { system: 'model', model: 'model', dictionary: 'dict', excel: 'dict', candidates: 'dict', approvals: 'appr', settings: 'admin', audit: 'admin' }[page] || '';
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
    if (tmin === '1' || (tmin === '' && curFile() === 'model.html' && window.innerWidth < 1920)) app.classList.add('treemin');
    app.insertBefore(nav, content);
    app.insertBefore(top, nav);
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
        <label class="mt-row"><span>역할</span><select id="mk-role" aria-label="역할 보기 전환">${Object.values(USERS).map(u => `<option value="${u.id}" ${u.id === ME.id ? 'selected' : ''}>${u.name} · ${u.roles.map(r => ROLE_NAME[r]).join('·')}</option>`).join('')}</select></label>
        <div class="mt-row"><span>화면 크기</span><span class="seg" id="seg-frame" title="맞춤 = 창 폭 전체(최소 1600px) · 1920/1600 = 고정 미리보기"><button data-v="fit">맞춤</button><button data-v="1920">1920</button><button data-v="1600">1600</button></span></div>
        <div class="mt-row"><span>테마</span><span class="seg" id="seg-theme"><button data-v="light">라이트</button><button data-v="dark">다크</button></span></div>
        <div class="mt-row mt-acts"><button class="btn sm" id="mk-scr" aria-expanded="false" title="화면 정보 · 상태별 바로가기 · 설계 문서 · 검토 메모">화면 정보</button><a class="btn sm" href="index.html" title="전체 화면·교차 시나리오">목업 지도</a><button class="btn sm ghost" id="mk-reset" title="결재 진행 상태·알림 읽음을 처음으로 · 검토 메모는 유지">데이터 초기화</button></div>
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
    mk.querySelector('#mk-role').addEventListener('change', e => { store.set('dbm-role', e.target.value); const p = new URLSearchParams(location.search); p.delete('as'); location.search = p.toString(); location.reload(); });
    mk.querySelector('#mk-scr').addEventListener('click', e => { e.stopPropagation(); mkOpen(false); toggleScreenPanel(); });
    const sp = document.createElement('aside'); sp.className = 'scr-panel'; sp.id = 'scr-panel'; sp.setAttribute('aria-label', '화면 정보'); sp.addEventListener('click', e => e.stopPropagation()); app.appendChild(sp);
    if (store.get('dbm-scr-open', '0') === '1') toggleScreenPanel(true);
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
    t.innerHTML = `<span style="color:${colors[type || 'success']};display:flex;margin-top:2px">${icon(marks[type || 'success'])}</span><div class="tx">${msg}</div>${action ? `<button class="act">${action.label}</button>` : ''}${type === 'danger' || action ? `<button class="tclose" aria-label="닫기">${icon('x')}</button>` : ''}`;
    box.appendChild(t);
    if (action) t.querySelector('.act').onclick = () => { t.remove(); action.fn(); };
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
