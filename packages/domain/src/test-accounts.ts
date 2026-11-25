import type { AccountKind, Role, UserStatus } from './index';

/**
 * 개발 · 시험 전용 계정 정의 (docs/impl/00-orchestration-plan.md §9.1) — 계정 하나에 역할 하나가 원칙.
 * - 시드(packages/db `db:seed:test`)와 권한 검사 표(packages/rules `buildPermMatrix`)가 같은 목록을 쓴다.
 * - 운영 데이터가 아니다. 운영 설치에서는 이 계정을 만들지 않는다(시드가 개발 DB에서만 실행).
 * - 시스템 코드는 목업과 같다: ERP = 통합ERP, RQMS = 요구사항관리.
 */
export interface TestAccount {
  id: string;
  name: string;
  roles: Role[];
  systems: string[];
  kind?: AccountKind;
  /** 오늘 기준 사용 기한(일). 음수 = 이미 지남 */
  untilDays?: number;
  project?: string;
  status?: UserStatus;
  pwTemp?: boolean;
  note: string;
}

export const TEST_ACCOUNTS: readonly TestAccount[] = [
  { id: 'tadm', name: '시험 Admin', roles: ['admin'], systems: ['전체'], note: '설정 · 사용자, 표준 내용은 못 바꿈' },
  { id: 'tda', name: '시험 DA', roles: ['da'], systems: ['ERP'], note: '1단계 승인 · 후보 큐 · 공표 (담당 통합ERP)' },
  { id: 'tda2', name: '시험 DA2', roles: ['da'], systems: ['RQMS'], note: '담당 밖(통합ERP) 모델 결재 불가' },
  { id: 'tmod', name: '시험 모델러(외주)', roles: ['modeler'], systems: ['ERP'], kind: 'out', untilDays: 60, project: 'PJ-01', note: '편집 · 확정 신청, 범위 밖 403' },
  { id: 'tmodin', name: '시험 모델러(내부)', roles: ['modeler'], systems: ['ERP'], note: '내부 조회 범위(기관 전체)' },
  { id: 'town', name: '시험 기관 담당자', roles: ['owner'], systems: ['ERP'], note: '최종 승인 · 관리 변경 확인' },
  { id: 'town2', name: '시험 기관 담당자2', roles: ['owner'], systems: ['ERP'], note: '두 사람 확인 · 위임 대리인' },
  { id: 'taud', name: '시험 감리', roles: ['auditor'], systems: ['ERP'], kind: 'aud', untilDays: 60, project: 'PJ-02', note: '읽기 전용 · 끝난 결재 · 감사 로그' },
  { id: 'tview', name: '시험 조회만', roles: [], systems: [], note: '편집 도구 숨김 · 내려받기 차단' },
  { id: 'texp', name: '시험 기한 만료', roles: ['modeler'], systems: ['ERP'], kind: 'out', untilDays: -1, project: 'PJ-01', note: '기한이 지나 권한 없음' },
  { id: 'tdatmp', name: '시험 DA(임시 비밀번호)', roles: ['da'], systems: ['ERP'], pwTemp: true, note: '비밀번호를 바꾸기 전 결재 잠김' },
  { id: 'tstop', name: '시험 사용 중지', roles: ['modeler'], systems: ['ERP'], status: 'stopped', note: '사용 중지 — 권한 없음' },
  { id: 'tmulti', name: '시험 겸임(모델러+DA)', roles: ['modeler', 'da'], systems: ['ERP'], note: '자기 승인 규칙' },
];
