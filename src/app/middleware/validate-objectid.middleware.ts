import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { IMiddleware } from '../../core/middleware.interface.js';

/**
 * Middleware для проверки корректности ObjectID
 * Проверяет, является ли аргумент id валидным MongoDB ObjectID
 */
@injectable()
export class ValidateObjectIdMiddleware implements IMiddleware {
  /**
   * Проверить, что ID в параметрах запроса является валидным ObjectID
   * Если ID невалиден, возвращаем 400 Bad Request
   */
  public execute(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const { id } = req.params;

    // Проверяем, что ID существует
    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing id parameter',
      });
      return;
    }

    // Проверяем, является ли ID валидным MongoDB ObjectID
    if (!Types.ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Invalid id format',
      });
      return;
    }

    // Передаем управление дальше
    next();
  }
}
