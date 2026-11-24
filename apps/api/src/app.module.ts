import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuditController, AuthController } from './auth/auth.controller';
import { AppGuard } from './auth/guards';
import { SessionService } from './auth/session.service';
import { AuditService } from './common/audit.service';
import { DbModule } from './common/db.provider';
import { HealthController } from './health.controller';

@Module({
  imports: [DbModule],
  controllers: [HealthController, AuthController, AuditController],
  providers: [SessionService, AuditService, { provide: APP_GUARD, useClass: AppGuard }],
})
export class AppModule {}
