import type { Role } from '@neodb/domain';

/**
 * 권한표 — 역할 × 할 수 있는 일 × 범위 (docs/ux/15-rbac.md §2 · 29).
 * 이 표 하나를 화면 · API 가드 · 공동 편집 인증이 함께 쓴다.
 *
 * scope
 * - org  : 기관 전체
 * - sys  : 담당 시스템 (adminAll이면 Admin은 전체)
 * - view : 계정의 조회 범위 (내부 = 기관 전체, 외주 · 감리 = 담당 시스템)
 */
export type PermScope = 'org' | 'sys' | 'view';

export interface Perm {
  id: PermId;
  g: string;
  n: string;
  roles: Array<Role | '*'>;
  scope: PermScope;
  adminAll?: boolean;
  note?: string;
}

export const PERM_IDS = [
  'model.view', 'model.edit', 'area.create', 'area.info', 'area.manage', 'model.submit', 'out.export',
  'dict.view', 'dict.request', 'cand.decide', 'dict.publish', 'dict.purge', 'dict.group', 'dict.common', 'excel.viewall',
  'type.std', 'type.add', 'type.map', 'type.request',
  'appr.da', 'appr.final', 'appr.viewall', 'admin.confirm',
  'audit.view', 'settings', 'rules.edit', 'users',
] as const;
export type PermId = (typeof PERM_IDS)[number];

export const PERMS: readonly Perm[] = [
  { id: 'model.view', g: '모델', n: '모델 · DDL · 산출물 보기', roles: ['*'], scope: 'view', note: '계정의 조회 범위대로 — 내부는 기관 전체, 외주 · 감리는 담당 시스템만' },
  { id: 'model.edit', g: '모델', n: '모델 편집 · 표준 맞추기 · DDL 가져오기', roles: ['modeler'], scope: 'sys' },
  { id: 'area.create', g: '모델', n: '업무 영역 만들기', roles: ['modeler', 'da', 'admin'], scope: 'sys', adminAll: true },
  { id: 'area.info', g: '모델', n: '업무 영역 이름 · 설명 · 담당 바꾸기', roles: ['modeler', 'admin'], scope: 'sys', adminAll: true },
  { id: 'area.manage', g: '모델', n: '업무 영역 옮기기 · 복제 · 사용 중지 · 삭제', roles: ['admin'], scope: 'org' },
  { id: 'model.submit', g: '모델', n: '모델 확정 신청', roles: ['modeler'], scope: 'sys' },
  { id: 'out.export', g: '모델', n: 'DDL · ERD · 산출물 내려받기', roles: ['modeler', 'da', 'owner', 'auditor'], scope: 'view', note: '모델러만이면 담당 시스템 · 개인정보 컬럼 목록은 사유' },
  { id: 'dict.view', g: '표준 사전', n: '표준 사전 · 변경 내역 보기', roles: ['*'], scope: 'org' },
  { id: 'dict.request', g: '표준 사전', n: '사전 신청 · 엑셀 가져오기 · 후보 등록', roles: ['modeler', 'da'], scope: 'org' },
  { id: 'cand.decide', g: '표준 사전', n: '후보 큐 판단', roles: ['da'], scope: 'org' },
  { id: 'dict.publish', g: '표준 사전', n: '사전 공표', roles: ['da'], scope: 'org' },
  { id: 'dict.purge', g: '표준 사전', n: '삭제 보관 항목 영구 삭제', roles: ['da'], scope: 'org' },
  { id: 'dict.group', g: '표준 사전', n: '도메인 그룹 직접 관리', roles: ['da'], scope: 'org' },
  { id: 'dict.common', g: '표준 사전', n: '공통표준 새 판 올리기(신청)', roles: ['da', 'admin'], scope: 'org' },
  { id: 'excel.viewall', g: '표준 사전', n: '다른 사람의 엑셀 업로드 묶음 보기', roles: ['da'], scope: 'org' },
  { id: 'type.std', g: '표준 사전', n: '표준 논리 타입 추가 · 수정 · 사용 중지', roles: ['da'], scope: 'org' },
  { id: 'type.add', g: '표준 사전', n: '추가 · DBMS 전용 타입과 축약명 등록', roles: ['da'], scope: 'org' },
  { id: 'type.map', g: '표준 사전', n: '시스템별 데이터 타입 매핑 수정', roles: ['da'], scope: 'sys' },
  { id: 'type.request', g: '표준 사전', n: '타입 추가 요청', roles: ['modeler'], scope: 'sys' },
  { id: 'appr.da', g: '결재', n: '1단계(DA) 승인 · 반려', roles: ['da'], scope: 'sys', note: '사전 신청은 기관 전체, 모델 확정은 담당 시스템만' },
  { id: 'appr.final', g: '결재', n: '최종 승인 · 반려', roles: ['owner'], scope: 'sys', note: '신청자와 1단계 승인자는 최종 승인할 수 없다' },
  { id: 'appr.viewall', g: '결재', n: '끝난 결재 문서 보기', roles: ['da', 'owner', 'auditor'], scope: 'view' },
  { id: 'admin.confirm', g: '결재', n: '관리 변경 확인 — 느슨해지는 결재 정책 · 높은 역할 부여', roles: ['owner'], scope: 'org' },
  { id: 'audit.view', g: '관리', n: '감사 로그 보기', roles: ['da', 'admin', 'owner', 'auditor'], scope: 'org' },
  { id: 'settings', g: '관리', n: '기관 · 시스템 · 사업 설정', roles: ['admin'], scope: 'org' },
  { id: 'rules.edit', g: '관리', n: '검수 기준 고치기', roles: ['da', 'admin'], scope: 'org' },
  { id: 'users', g: '관리', n: '사용자 · 역할 · 인증 관리', roles: ['admin'], scope: 'org' },
];

/** 임시 비밀번호를 바꾸기 전에는 열리지 않는 권한 (29 R-05) */
export const APPROVAL_PERMS: readonly PermId[] = ['appr.da', 'appr.final', 'admin.confirm', 'cand.decide', 'dict.publish'];

export const permOf = (id: PermId): Perm => {
  const p = PERMS.find((x) => x.id === id);
  if (!p) throw new Error(`unknown permission: ${id}`);
  return p;
};
