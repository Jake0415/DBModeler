import 'reflect-metadata';
import cookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Public } from './auth/guards';
import { HealthController } from './health.controller';

// 상태 확인은 로그인 없이
Public()(HealthController);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: true, bodyLimit: 2 * 1024 * 1024 }), { logger: ['error', 'warn', 'log'] });
  await app.register(cookie);
  app.setGlobalPrefix('api/v1', { exclude: ['healthz', 'readyz'] });
  app.enableShutdownHooks();
  const port = Number(process.env.API_PORT ?? 4310);
  await app.listen(port, '0.0.0.0');
  console.log(`NeoDB API — http://localhost:${port}/api/v1 (healthz · readyz)`);
}
bootstrap();
