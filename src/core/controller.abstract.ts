import { Router, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IController, IRoute } from './route.interface.js';

/**
 * Абстрактный базовый класс для всех контроллеров
 * Предоставляет стандартные методы для отправки ответов
 */
export abstract class Controller implements IController {
  public router: Router;

  constructor(protected readonly controllerRoute: string = '') {
    this.router = Router();
  }

  /**
   * Получить список маршрутов контроллера
   */
  abstract getRoutes(): IRoute[];

  /**
   * Отправить успешный ответ (200 OK)
   */
  protected ok(res: Response, data?: unknown): void {
    res.status(StatusCodes.OK).json(
      data !== undefined ? data : { status: 'OK' }
    );
  }

  /**
   * Отправить ответ о создании ресурса (201 Created)
   */
  protected created(res: Response, data?: unknown): void {
    res.status(StatusCodes.CREATED).json(
      data !== undefined ? data : { status: 'Created' }
    );
  }

  /**
   * Отправить ответ без содержимого (204 No Content)
   */
  protected noContent(res: Response): void {
    res.status(StatusCodes.NO_CONTENT).send();
  }

  /**
   * Отправить ответ о неверным запросе (400 Bad Request)
   */
  protected badRequest(res: Response, message?: string): void {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: message || 'Bad Request',
    });
  }

  /**
   * Отправить ответ о неавторизованном доступе (401 Unauthorized)
   */
  protected unauthorized(res: Response, message?: string): void {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: message || 'Unauthorized',
    });
  }

  /**
   * Отправить ответ о запрете доступа (403 Forbidden)
   */
  protected forbidden(res: Response, message?: string): void {
    res.status(StatusCodes.FORBIDDEN).json({
      error: message || 'Forbidden',
    });
  }

  /**
   * Отправить ответ о ненайденном ресурсе (404 Not Found)
   */
  protected notFound(res: Response, message?: string): void {
    res.status(StatusCodes.NOT_FOUND).json({
      error: message || 'Not Found',
    });
  }

  /**
   * Отправить ответ о конфликте (409 Conflict)
   */
  protected conflict(res: Response, message?: string): void {
    res.status(StatusCodes.CONFLICT).json({
      error: message || 'Conflict',
    });
  }

  /**
   * Отправить ответ о внутренней ошибке сервера (500 Internal Server Error)
   */
  protected internalServerError(res: Response, message?: string): void {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: message || 'Internal Server Error',
    });
  }
}
