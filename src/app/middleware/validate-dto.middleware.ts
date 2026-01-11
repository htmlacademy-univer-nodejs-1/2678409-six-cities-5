import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
import { IMiddleware } from '../../core/middleware.interface.js';

/**
 * Middleware для валидации DTO
 * Проверяет данные запроса при помощи class-validator
 */
@injectable()
export class ValidateDtoMiddleware implements IMiddleware {
  constructor(private readonly dtoClass: any) {}

  /**
   * Проверить данные тела запроса в соответствии с DTO
   * Если валидация не пройдена, возвращаем 400 Bad Request
   */
  public async execute(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // Преобразуем данные тела в инстанцию DTO
    const dtoInstance = plainToInstance(this.dtoClass, req.body, {
      excludeExtraneousValues: true,
    });

    // Проверяем данные
    const errors = await validate(dtoInstance);

    // Если есть ошибки, отсылаем 400
    if (errors.length > 0) {
      const messages = errors.map((error) => ({
        field: error.property,
        messages: Object.values(error.constraints || {}),
      }));

      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Validation failed',
        details: messages,
      });
      return;
    }

    // Передаем управление дальше
    next();
  }
}

/**
 * Фактория для создания миддлвера валидации
 * Метод, который обычно используется для создания миддлвера
 */
export const validateDto = (dtoClass: any): ValidateDtoMiddleware => {
  return new ValidateDtoMiddleware(dtoClass);
};
