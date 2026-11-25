/* 31 검수 기준 2차 — policy judgement cases (30-metadata-design ⑤ 공통 테스트 케이스의 목업판).
   Each case: a policy change from the defaults → a value → the expected levels. runPolicyCases() runs them against the live ruleProblems / policyConflicts / compOf.
   The implementation's server and front end must give the same answers for the same table. */
(function () {
  const P = patch => { const p = policyFrom({ schemaVersion: 2 }); patch && patch(p); return p; };
  const lv = (k, f, v, pol) => { const ps = ruleProblems(k, f, v, pol); return ps.some(x => x.lvl === 'block') ? 'block' : ps.some(x => x.lvl === 'warn') ? 'warn' : 'ok'; };
  window.POLICY_CASES = [
    // old stored values (v1 shape) are moved into v2
    { n: '옛 값: 저장값 없음 → 단어 약어 6자', run: () => policyFrom(null).fields.word.abbr.max, want: 6 },
    { n: '옛 값: wordAbbr 8 → 단어 약어 8자', run: () => policyFrom({ ver: 4, wordAbbr: 8 }).fields.word.abbr.max, want: 8 },
    { n: 'v2의 명시적 null(길이 제한 없음)은 그대로', run: () => policyFrom({ schemaVersion: 2, fields: { word: { abbr: { max: null } } } }).fields.word.abbr.max, want: null },
    // letters · symbols: null / [] / 'all'
    { n: '기본: 단어 약어 소문자 막힘', run: () => lv('word', 'abbr', 'custNo', P()), want: 'block' },
    { n: '글자 종류 제한 없음(null): 한자도 통과', run: () => lv('word', 'name', '漢字', P(p => { p.fields.word.name.chars = null; })), want: 'ok' },
    { n: '글자 종류 [](허용 없음): 무엇이든 막힘', run: () => lv('word', 'name', '고객', P(p => { p.fields.word.name.chars = []; })), want: 'block' },
    { n: "기호 'all': 하이픈 통과, 공백은 여전히 막힘", run: () => [lv('term', 'abbr', 'CUST-NO', P(p => { p.fields.term.abbr.special = 'all'; })), lv('term', 'abbr', 'CUST NO', P(p => { p.fields.term.abbr.special = 'all'; }))].join(','), want: 'ok,block' },
    { n: '기호 고른 것만 [_ -]: / 는 막힘', run: () => lv('term', 'abbr', 'CUST/NO', P(p => { p.fields.term.abbr.special = ['_', '-']; })), want: 'block' },
    { n: '추가 조건: 기호 연속 · 숫자 시작 · 예약어', run: () => ['RISK__GRD', '1ST_DT', 'TABLE'].map(v => lv('term', 'abbr', v, P())).join(','), want: 'block,block,block' },
    { n: '어기면 경고만: 막지 않고 경고', run: () => lv('word', 'abbr', 'TOOLONGWORD', P(p => { p.fields.word.abbr.lvl = 'warn'; })), want: 'warn' },
    { n: '검사 안 함: 아무 말도 하지 않음', run: () => lv('word', 'abbr', 'toolong-word', P(p => { p.fields.word.abbr.lvl = 'off'; })), want: 'ok' },
    // conflicts (UX-01)
    { n: '어긋남: 기본값은 없음', run: () => policyConflicts(P()).filter(c => c.lvl === 'block').length, want: 0 },
    { n: "어긋남: 구분자 '-'인데 용어 약어가 '-'를 막음 → 막기", run: () => policyConflicts(P(p => { p.naming.sep = '-'; })).some(c => c.lvl === 'block' && c.k === 'term'), want: true },
    { n: "어긋남: 구분자 '-' · 용어 약어 허용 → 물리명은 경고만", run: () => policyConflicts(P(p => { p.naming.sep = '-'; p.fields.term.abbr.special = ['_', '-']; })).map(c => c.lvl).join(','), want: 'warn,warn' },
    { n: '어긋남: 단어 약어 소문자 허용 · 용어 약어 막음 → 막기', run: () => policyConflicts(P(p => { p.fields.word.abbr.chars = ['upper', 'lower', 'digit']; })).some(c => c.lvl === 'block'), want: true },
    { n: '어긋남: 꺼진 규칙은 따지지 않음', run: () => policyConflicts(P(p => { p.fields.word.abbr.chars = ['upper', 'lower', 'digit']; p.fields.term.abbr.lvl = 'off'; })).some(c => c.lvl === 'block'), want: false },
    // Q2 — compliance counts items; an off rule is only left out of the judgement
    { n: 'Q2: 컬럼명 10자 · 막기 → 긴 컬럼은 미준수', run: () => { const m = { E: [{ n: '고객기본', p: 'CUST_M', a: [{ n: '고객번호', p: 'CUST_NO', s: 'ok' }, { n: '고객등급코드', p: 'CUST_GRADE_CODE', s: 'ok' }] }] }; const keep = getPolicy(); try { savePolicy(P(p => { p.model.attr.phys.max = 10; })); const c = compOf(m); return `${c.tot}/${c.bad}/${c.rate}`; } finally { savePolicy(JSON.parse(JSON.stringify(keep))); } }, want: '3/1/66' },
    { n: 'Q2: 같은 규칙 검사 안 함 → 분모 그대로 · 통과 · 검사 안 함 1개', run: () => { const m = { E: [{ n: '고객기본', p: 'CUST_M', a: [{ n: '고객번호', p: 'CUST_NO', s: 'ok' }, { n: '고객등급코드', p: 'CUST_GRADE_CODE', s: 'ok' }] }] }; const keep = getPolicy(); try { savePolicy(P(p => { p.model.attr.phys.max = 10; p.model.attr.phys.lvl = 'off'; })); const c = compOf(m); return `${c.tot}/${c.bad}/${c.rate}/${c.off}`; } finally { savePolicy(JSON.parse(JSON.stringify(keep))); } }, want: '3/0/100/1' },
    // separators · DB upper-case
    { n: "구분자 '' : 조합은 이어 붙임", run: () => joinAbbr(['CUST', 'NO'], P(p => { p.naming.sep = ''; })), want: 'CUSTNO' },
    { n: '소문자 허용 필드는 대문자로 바꾸지 않음', run: () => { const keep = getPolicy(); try { savePolicy(P(p => { p.fields.word.abbr.chars = ['upper', 'lower', 'digit']; })); return abbrCase('custNo', 'word'); } finally { savePolicy(JSON.parse(JSON.stringify(keep))); } }, want: 'custNo' },
    { n: '공통표준 항목은 기관 기준 예외', run: () => policyExempt({ src: '공통' }) && !policyExempt({ src: '기관' }), want: true }
  ];
  window.runPolicyCases = () => POLICY_CASES.map(c => { let got; try { got = c.run(); } catch (e) { got = '오류: ' + e.message; } return { n: c.n, want: c.want, got, ok: JSON.stringify(got) === JSON.stringify(c.want) }; });
})();
