/* DBModeler mockup shell & interactions (static, no backend) — v4 */
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
  window.saveDocs = d => S('dbm-docs', d);
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
    const doc = Object.assign({ id: nextDocId(docs), req: ME.id, step: 'da', date: now(), cc: [], hist: [], n: 1 }, o);
    docs.unshift(doc); saveDocs(docs);
    // items with an existing id become "pending" in the dictionary (MD-10: one open request per item)
    if (doc.items) { const dict = getDict(); doc.items.forEach(it => { const d = it.id && dict.find(x => x.id === it.id); if (d) d.pending = doc.id; }); saveDict(dict); }
    pushNotif({ to: Object.values(USERS).filter(u => u.roles.includes('da') && u.id !== ME.id).map(u => u.id), k: 'appr', t: `${doc.id} ${doc.type === 'model' ? '모델 확정' : '사전 신청'} — DA 승인 차례`, m: `${ME.name} · ${doc.title}`, href: `approvals.html?doc=${doc.id}` });
    return { doc, dup: false };
  };
  window.addHist = (doc, e) => { doc.hist = (doc.hist || []).concat([Object.assign({ at: now(), who: ME.name }, e)]); };

  /* ---- model versions & locks: computed from documents, never from the URL ---- */
  const MODEL0 = { rq: { ver: 5, base: 4, name: '요구사항 · 프로젝트' }, risk: { ver: 2, base: 1, name: '리스크' } };
  window.getModel = area => (J('dbm-model', clone(MODEL0)))[area] || MODEL0.rq;
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
      if (op === '추가') {
        if (k === 'word' && !(it.abbr || '').trim()) res.problems.push('영문약어명이 비어 있음');
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
        else { d = { id: (k === 'word' ? 'W-' : k === 'domain' ? 'D-' : k === 'code' ? 'C-' : 'T-') + String(500 + dict.length).padStart(4, '0'), k, kn: KIND_NAME[k] || '용어', src: '기관', st: '사용', name: it.name, abbr: it.abbr || '—', dom: it.dom || '—', eng: it.eng || '', desc: it.desc || '', ver: 1, cha: null, dt: today(), use: 0, syn: [], forbid: [], old: [], hist: [] }; dict.push(d); }
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
  window.liveRoleChanged = () => !qs.get('as') && store.get('dbm-role', 'kim') !== ME.id;
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
  window.reqEnded = m => { if (!m) return []; const docs = getDocs(); const out = []; m.E.forEach(e => e.a.forEach(a => { if (a.s !== 'req' || !a.reqDoc) return; const d = docs.find(x => x.id === a.reqDoc); if (d && ['rejected', 'withdrawn'].includes(d.step)) out.push(`${e.n}.${a.n}(${d.id} ${STEP_NAME[d.step]})`); })); return out; };
  window.modelBad = m => m ? m.E.reduce((n, e) => n + (e.ref ? 0 : (e.p === '—' ? 1 : 0) + e.a.filter(a => !a.edit && (a.s === 'comb' || a.s === 'unreg')).length), 0) : null;
  /* baselines: every editable download is recorded (range, item ids, versions) — round-trip judgement uses this, not the file alone */
  window.recordBaseline = (scope, ids) => { const all = J('dbm-baselines', []); const t = new Date(); const id = `BL-${today().replace(/-/g, '')}-${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`; all.unshift({ id, at: now(), by: ME.id, scope, n: ids.length, ids }); S('dbm-baselines', all.slice(0, 20)); return id; };
  window.latestBaseline = () => (J('dbm-baselines', [])).find(b => b.by === ME.id) || { id: 'BL-20261116-0905', at: '11/16 09:05', by: 'kim', scope: '용어 · 필터: 요구사항', n: 13 };
  /* per-version model data (S5): edits persist per area+version; a confirmation stores its own snapshot */
  window.getModelData = (area, ver) => J(`dbm-mdata-${area}-v${ver}`, null);
  window.setModelData = (area, ver, data) => S(`dbm-mdata-${area}-v${ver}`, data);

  /* ---- notifications: addressed to people, created by events ---- */
  window.pushNotif = n => { const all = J('dbm-notifs', []); all.unshift(Object.assign({ id: 'd' + Date.now() + Math.random().toString(36).slice(2, 5), at: now() }, n)); S('dbm-notifs', all.slice(0, 50)); };

  /* ---- notifications ---- */
  const NOTIFS0 = [
    { id: 'n1', k: 'appr', t: 'REQ-2026-0011 모델 확정(리스크 v2) — DA 승인 차례', m: '박설계 · 요구사항관리 › 리스크', href: 'approvals.html?doc=REQ-2026-0011', at: '11/16 18:02', to: ['kim', 'lee'] },
    { id: 'n2', k: 'job', t: '엑셀 검증 완료 — 요구사항_용어_1차.xlsx', m: '신규 112 · 변경 4 · 후보 확정 4 · 오류 4 → REQ-2026-0016', href: 'uploads.html?b=UP-2026-0007', at: '11/16 09:15', to: ['kim'] },
    { id: 'n3', k: 'cand', t: "후보 '수령자'가 단어 신청으로 전환됐습니다", m: 'REQ-2026-0012 · 내가 등록한 후보 2건', href: 'approvals.html?doc=REQ-2026-0012', at: '11/17 11:05', to: ['kim', 'park'] },
    { id: 'n4', k: 'cc', t: '참조: REQ-2026-0009 단어 3건 등록', m: '박설계 신청 · DA 승인 대기', href: 'approvals.html?box=cc&doc=REQ-2026-0009', at: '11/16 09:12', to: ['kim'] },
    { id: 'n5', k: 'appr', t: "REQ-2026-0010 도메인 '코드C2' — 최종 승인 차례", m: '이데이터 신청 · DA 승인 완료', href: 'approvals.html?doc=REQ-2026-0010', at: '11/16 17:40', to: ['hyun'] },
    { id: 'n6', k: 'sys', t: `DBModeler ${PRODUCT.version} 새 기능`, m: '산출물 화면 · 표 보기 · 모델 검토 — 릴리스 노트', href: '#about', at: '11/17 09:00', to: ['kim', 'park', 'lee', 'hyun'] }
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
    { file: 'model.html', ids: 'SC-31 · PN-32 · PN-33 · PN-31G · PN-39 · PN-35 · PN-38 · PN-37', name: '모델(ERD 캔버스 · 사전 패널 · 엔터티 패널 · 표 보기 · 모델 검토 · 게이트 A · 확정 신청 · DBMS 비교)', menu: '시스템', docs: [['03 ERD 편집기', D.erd], ['02 §5.1~5.4·5.7', D.flows], ['22 §6 SWS 비교 결정', D.sws], ['23 §6-2·5·6 캔버스 숫자', D.perf]], states: [['요구사항·프로젝트(편집)', 'model.html'], ['리스크(검토 중)', 'model.html?area=risk'], ['v4 확정본 사본', 'model.html?area=rq&snap=REQ-2026-0003'], ['예시: 미준수 해결 후(조회 전용)', 'model.html?state=resolved']] },
    { file: 'standardize.html', ids: 'SC-34', name: '표준 맞추기', menu: '시스템', docs: [['02 §5.3', D.flows], ['30 MD-42·50~55', D.meta]], states: [['요구사항·프로젝트', 'standardize.html'], ['예외만', 'standardize.html?f=ex'], ['DDL 가져오기 직후', 'standardize.html?from=import'], ['리스크(대상 없음)', 'standardize.html?area=risk']] },
    { file: 'import.html', ids: 'SC-36', name: '가져오기(엑셀·DDL → 모델)', menu: '시스템', docs: [['02 §5.6', D.flows]], states: [['기본', 'import.html']] },
    { file: 'ddl.html', ids: 'SC-37', name: 'DDL 출력 · 게이트 B', menu: '시스템', docs: [['02 §5.5', D.flows]], states: [['기본', 'ddl.html']] },
    { file: 'outputs.html', ids: 'SC-38', name: '산출물', menu: '시스템', docs: [['05 §8 DA# 비교', D.da]], states: [['테이블 정의서', 'outputs.html?k=tbl']] },
    { file: 'settings.html', ids: 'SC-40 · SC-41 · SC-42 · SC-43', name: '설정(기관 · 시스템 · 사용자·역할 · 검수 기준)', menu: '관리', docs: [['02 §6 설정 흐름', D.flows], ['30 §4 검수 기준', D.meta]], states: [['기관(이데이터 Admin)', 'settings.html?as=lee'], ['시스템', 'settings.html?as=lee#sys'], ['검수 기준', 'settings.html?as=lee#rules'], ['Admin 아님 → 403', 'settings.html?as=kim']] },
    { file: 'audit.html', ids: 'SC-58', name: '감사 로그', menu: '관리', docs: [['06 §3', D.plan]], states: [['DA로 보기', 'audit.html?as=lee']] },
    { file: 'mypage.html', ids: 'SC-51 · PN-50', name: '마이페이지 · 사용자 메뉴', menu: '사용자', docs: [['06 §3', D.plan]], states: [['프로필', 'mypage.html'], ['내 신청', 'mypage.html#mine'], ['알림 설정', 'mypage.html#notify']] },
    { file: 'error.html', ids: 'SC-57', name: '오류·안내', menu: '공통', docs: [['06 §3', D.plan]], states: [['403', 'error.html?code=403&need=Admin&what=설정'], ['404', 'error.html?code=404'], ['500', 'error.html?code=500'], ['점검', 'error.html?code=maint'], ['로그아웃', 'error.html?code=logout'], ['세션 만료', 'error.html?code=expired&from=model.html']] }
  ];
  /* decisions made after the v7.1 freeze that the screens do not show yet (22 §6 · 23 §6 · 03 §13.1 · 06 남은 범위) */
  const TODO = {
    'home.html': [['전역 검색 Ctrl+K(사전·모델·결재) — 셸 공통, 아직 표시만', '06 남은 범위'], ['로그인 화면 SC-56 없음', '06 남은 범위']],
    'dictionary.html': [['2글자 이하 검색은 앞부분 일치, 부분 일치 총건수는 1,000건까지만 세고 "1,000건 이상 — 더 입력하세요" 표시', '23 §6-1'], ['사전 목록 가상화(행 40개만 그림)', '23 §6-3'], ['목록 필터 보강: 길이 범위·도메인 연결 여부·원본 폐기', '22 §6-10'], ['영구 삭제 절차(V0 보관 → 대상 이름 입력 확인·사유·삭제 로그, 참조 시 차단) 화면 없음', '30 v1.2 ⑦'], ['상세 패널 재검토 사유를 진단 코드 목록으로', '30 v1.2 ⑥']],
    'dict-history.html': [['영구 삭제 수행 로그 보기(DA·Admin)', '30 v1.2 ⑦']],
    'excel-import.html': [['업로드 상한 20MB·10만 행 안내와 초과 시 차단', '23 §6-4'], ['검증 토큰: 검수 기준(정책 버전)·사전이 바뀌면 "다시 검증" 안내', '30 v1.2 ⑤'], ['오류 행 파일의 \'오류 및 수정 가이드\' 시트 안내', '07 §4'], ['결과 표 가상화', '23 §6-3']],
    'uploads.html': [['검증 토큰 만료(정책·사전 변경) 표시', '30 v1.2 ⑤']],
    'approvals.html': [['결재 문서에 신청·승인 시점의 정책 버전과 경고 표시', '30 v1.2 ⑤'], ['모델 확정: 서버가 고정한 시점·내용 해시 표시', '03 §13.1-2']],
    'system.html': [['시스템 전체 ERD 진입 — 영역 묶음 보기가 기본', '23 §6-2']],
    'model.html': [['카드 안 편집은 속성 추가·이름 바꾸기만, 나머지는 오른쪽 패널', '03 §0'], ['관계선을 FK 속성 행에 붙이기(컬럼 단위)', '22 §6-5'], ['부모 PK를 자식에 끌어다 놓아 키 전달', '22 §6-5'], ['복합 FK 묶음 관리(식별 전환 시 묶음 전체 PK, 삭제 시 유지/삭제 선택)', '22 §6-5'], ['자동 배치 진행 표시·취소(Worker)', '23 §6-5'], ['상세도 전환 0.35배 요약 · 0.2배 영역 묶음, 확대가 멈춘 뒤 전환', '23 §6-6'], ['업무 영역 300 엔터티 초과 경고', '23 §6-2'], ['조회자 화면 읽기 전용(서버 차단과 같이)', '23 §5 · 03 §13.1-1'], ['ERD 편집 완결(남은 범위)', '06 남은 범위']],
    'standardize.html': [['재검토 사유를 진단 코드 목록으로(용어·단어·도메인 연결, 기준 서명 변경 등)', '30 v1.2 ⑥']],
    'import.html': [['엑셀 테이블 정의서 → ERD 초안(가져올 때 중복만, 표준 검사는 표준 맞추기)', '20 · W2 후보']],
    'outputs.html': [['공식 산출물 ERD는 서버 캡처로(화면과 동일), 사용자 내보내기는 그대로', '03 ERD-Q2 보강']],
    'settings.html': [['검수 기준에 정책 버전 번호·변경 이력', '30 v1.2 ⑤'], ['T11 가져오기·출력 결과물 / T12 운영·관리 테마', '06 남은 범위']],
    'audit.html': [['영구 삭제 로그를 감사 로그에 포함', '30 v1.2 ⑦']]
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
    const add = () => { const v = p.querySelector('#scr-text').value.trim(); if (!v) return; const n = getNotes(); (n[f] = n[f] || []).push({ text: v, at: now(), by: ME.name, done: false }); saveNotes(n); screenPanel(); toast('메모를 추가했습니다', 'info'); };
    p.querySelector('#scr-add').onclick = add;
    p.querySelector('#scr-text').onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); add(); } };
    p.querySelectorAll('[data-nd]').forEach(c => c.onchange = () => { const n = getNotes(); n[f][+c.dataset.nd].done = c.checked; saveNotes(n); screenPanel(); });
    p.querySelectorAll('[data-nx]').forEach(b => b.onclick = () => { const n = getNotes(); n[f].splice(+b.dataset.nx, 1); saveNotes(n); screenPanel(); });
    p.querySelector('#scr-export').onclick = () => { const md = notesMarkdown(); (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(() => toast('전체 화면의 메모를 마크다운 표로 복사했습니다', 'success'), () => { window.prompt('복사해서 쓰세요', md); }); };
  }
  function toggleScreenPanel(on) {
    const p = document.getElementById('scr-panel'); if (!p) return;
    const open = on == null ? !p.classList.contains('open') : on;
    p.classList.toggle('open', open); store.set('dbm-scr-open', open ? '1' : '0');
    const b = document.getElementById('mk-scr'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) screenPanel();
  }
  window.toggleScreenPanel = toggleScreenPanel;

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
    if (document.body.dataset.page === 'error' && ['logout', 'expired'].includes(qs.get('code'))) {
      app.classList.add('bare');
      const t = document.createElement('div'); t.className = 'toasts'; t.id = 'toasts'; t.setAttribute('role', 'status'); app.appendChild(t);
      return;
    }
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
        <button class="reset" id="mk-reset" title="목업 데이터 초기화(결재 진행 상태·알림 읽음) — 검토 메모는 유지">↺</button>
        <button class="reset scr-btn" id="mk-scr" title="화면 정보 · 상태별 바로가기 · 설계 문서 · 검토 메모" aria-expanded="false">화면${(() => { const n = (J('dbm-notes', {})[curFile()] || []).filter(x => !x.done).length; return n ? ` <span class="scr-n">${n}</span>` : ''; })()}</button>
        <a class="reset" href="index.html" title="목업 지도(전체 화면·교차 시나리오)">지도</a>
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
        ${navLink('model.html?area=risk', '리스크', '', 'sub2')}
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
    top.querySelector('#mk-scr').addEventListener('click', e => { e.stopPropagation(); toggleScreenPanel(); });
    const sp = document.createElement('aside'); sp.className = 'scr-panel'; sp.id = 'scr-panel'; sp.setAttribute('aria-label', '화면 정보'); sp.addEventListener('click', e => e.stopPropagation()); app.appendChild(sp);
    if (store.get('dbm-scr-open', '0') === '1') toggleScreenPanel(true);
    top.querySelector('#mk-reset').addEventListener('click', () => { const keep = ['dbm-frame', 'dbm-theme', 'dbm-role', 'dbm-single-keys', 'dbm-notes', 'dbm-scr-open']; try { Object.keys(localStorage).filter(k => k.startsWith('dbm-') && !keep.includes(k)).forEach(k => store.del(k)); } catch (e) {} Object.keys(USERS).forEach(u => store.del('dbm-read-' + u)); flash('목업 데이터를 초기화했습니다', 'info'); location.reload(); });

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
  function openAbout() {
    const p = getPub(); const kv = document.querySelector('#mo-about .kv'); if (kv) kv.innerHTML = kv.innerHTML.replace(/기관 사전 제정 \d+차/, `기관 사전 제정 ${p.cha}차`);
    document.getElementById('mo-about').classList.add('open'); store.set('dbm-seen-ver', PRODUCT.version); const d = document.querySelector('#btn-user .newdot'); if (d) d.remove(); }
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
    try { const f = JSON.parse(sessionStorage.getItem('dbm-flash') || 'null'); if (f) { sessionStorage.removeItem('dbm-flash'); setTimeout(() => toast(f[0], f[1]), 100); } } catch (e) {}
  });
})();
