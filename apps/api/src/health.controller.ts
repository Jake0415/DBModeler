import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { Pool } from 'pg';
import { POOL } from './common/db.provider';

@Controller()
export class HealthController {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  /** 프로세스가 살아 있는가 */
  @Get('healthz')
  health() { return { ok: true }; }

  /** 요청을 받을 수 있는가 — DB 연결까지 확인 */
  @Get('readyz')
  async ready() {
    try { await this.pool.query('select 1'); return { ok: true, db: 'up' }; }
    catch { throw new ServiceUnavailableException({ code: 'db_down', message: 'DB에 연결하지 못했습니다' }); }
  }
}
