import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 오류 응답 하나의 모양 — { code, message, field? }.
 * message는 디자인 가이드 §11.2 형식: “{동작}하지 않았습니다. {원인}. {다음 행동}”
 */
export class AppError extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, field?: string) {
    super({ code, message, ...(field ? { field } : {}) }, status);
  }
}

export const denied = (message: string) => new AppError(HttpStatus.FORBIDDEN, 'forbidden', message);
export const unauth = (message = '로그인이 필요합니다') => new AppError(HttpStatus.UNAUTHORIZED, 'unauthenticated', message);
export const bad = (code: string, message: string, field?: string) => new AppError(HttpStatus.BAD_REQUEST, code, message, field);
