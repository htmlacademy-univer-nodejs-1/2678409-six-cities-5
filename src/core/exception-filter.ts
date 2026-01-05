import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { injectable, inject } from 'inversify';
import { Logger } from 'pino';
import { TYPES } from './types.js';

/**
 * Кустомная ошибка для HTTP реквестов
 */
export class HttpException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}

/**
 * Ответ о неявного найденного ресурсе
 */
export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(StatusCodes.NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

/**
 * Ответ о конфликте
 */
export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict') {
    super(StatusCodes.CONFLICT, message);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

/**
 * Ответ о неавторизованном доступе
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(StatusCodes.UNAUTHORIZED, message);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

/**
 * Ответ о запрете доступа
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(StatusCodes.FORBIDDEN, message);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

/**
 * Фильтр исключений для Express
 * Перехватывает все ошибки о тоношит их логирование
 */
@injectable()
export class ExceptionFilter {
  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {}

  /**
   * Мыпримения фильтра к экспресс приложению
   */
  public catch(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    // Проверим, является ли ошибка HTTP исключением
    if (err instanceof HttpException) {
      // Логируем HTTP ошибку
      this.logger.debug(
        {
          statusCode: err.statusCode,
          message: err.message,
          details: err.details,
        },
        'HTTP ошибка'
      );

      // Отправляем HTTP ответ с корректным статус-кодом
      res.status(err.statusCode).json({
        error: err.message,
        details: err.details,
      });
      return;
    }

    // Логируем внутреннюю ошибку сервера
    this.logger.error(
      {
        error: err,
        stack: err.stack,
      },
      'Внутренняя ошибка сервера'
    );

    // Отправляем респонс с кодом 500
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
    });
  }
}
