import { Request, Response, NextFunction } from 'express';

/**
 * Интерфейс для Middleware
 * Middleware используются для предварительной обработки запросов
 */
export interface IMiddleware {
  /**
   * Метод для выполнения middleware логики
   */
  execute(
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Promise<void>;
}
