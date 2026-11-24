import { Injectable } from '@nestjs/common';
import { schema } from '@neodb/db';
import { InjectDb, type Db } from './db.provider';

export interface AuditEntry {
  actorId?: string | null;
  actorName?: string | null;
  forId?: string | null;
  act: string;
  target?: string;
  why?: string;
  sysCode?: string | null;
  kind?: 'admin' | 'work';
  result?: 'ok' | 'denied' | 'failed';
  ip?: string | null;
}

/** 감사는 업무 변경과 같은 트랜잭션에 쓴다 — tx를 넘기면 그 안에서 (백엔드 구성안 §13.5) */
@Injectable()
export class AuditService {
  constructor(@InjectDb() private readonly db: Db) {}
  async write(e: AuditEntry, tx: Pick<Db, 'insert'> = this.db) {
    await tx.insert(schema.auditEvents).values({ ...e, target: e.target ?? '', why: e.why ?? '', kind: e.kind ?? 'work', result: e.result ?? 'ok' });
  }
}
