/**
 * NeoDB 도메인 공통 타입 — 역할 · 소속 · 결재 단계 · 문구 기준어.
 * 화면(목업 docs/ux/mockups)과 서버가 같은 이름을 쓴다. 기준어는 디자인 가이드 §11.
 */

export const ROLES = ['modeler', 'da', 'owner', 'admin', 'auditor'] as const;
export type Role = (typeof ROLES)[number];

/** 화면에 보이는 역할 이름 (ROLE_NAME — 목업 app.js와 같음) */
export const ROLE_NAME: Record<Role, string> = {
  modeler: '모델러',
  da: 'DA',
  owner: '기관 담당자',
  admin: 'Admin',
  auditor: '감리',
};

/** 새로 주거나 담당을 넓히면 기관 담당자 확인이 필요한 역할 (29 R-03) */
export const HIGH_ROLES: readonly Role[] = ['da', 'owner', 'admin', 'auditor'];

/** 소속 — 내부 · 외주 · 감리 (29 R-09) */
export type AccountKind = 'in' | 'out' | 'aud';
export const ACCT_KIND: Record<AccountKind, string> = { in: '내부', out: '외주', aud: '감리' };

/** 조회 범위 — 기관 전체 · 담당 시스템만 (29 R-11) */
export type ViewScope = 'org' | 'sys';

export type UserStatus = 'active' | 'stopped' | 'locked';

/** 담당 시스템 값 — 시스템 코드 또는 '전체' */
export const ALL_SYSTEMS = '전체';

export interface Delegation {
  to: string;
  from: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

/** 권한 판정에 쓰는 사용자 모양 — DB 행에서 만든다 */
export interface Actor {
  id: string;
  name: string;
  roles: Role[];
  /** 시스템 코드 목록 또는 ['전체'] */
  systems: string[];
  status: UserStatus;
  kind?: AccountKind;
  until?: string; // YYYY-MM-DD 사용 기한
  viewScope?: ViewScope; // 예외만 저장 (없으면 소속 기본)
  pwTemp?: boolean;
  deleg?: Delegation;
}

/** 결재 단계 */
export type Step = 'da' | 'final' | 'done' | 'rejected' | 'withdrawn';
export type DocType = 'dict' | 'model';

export interface DocHistoryEntry {
  step?: Step;
  act: string;
  whoId?: string;
  /** 대리로 처리했을 때 원 담당자 */
  forId?: string;
  self?: boolean;
}

/** 결재 문서 — 판정에 필요한 필드만 */
export interface ApprovalDoc {
  id: string;
  type: DocType;
  step: Step;
  req: string;
  cc?: string[];
  /** 신청 당시 결재선 스냅샷 */
  line?: Array<'da' | 'final'>;
  /** 모델 문서: 업무 영역 · 신청 당시 시스템 코드 */
  area?: string;
  sysAt?: { code: string };
  hist?: DocHistoryEntry[];
}

/** 기관 결재 정책 — 목업 getOrg() */
export interface OrgPolicy {
  /** 사전 신청 최종 승인 사용 */
  finalDict: boolean;
  /** 시스템(또는 영역)별 모델 확정 최종 승인 — false만 저장(없으면 사용) */
  finalModel: Record<string, boolean>;
  /** 자기 승인 — false면 비허용, 그 외 허용 + 최종 승인 자동 부착 (29 R-02) */
  selfAppr?: boolean;
}
