import { Router, Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface.js';

/**
 * Тип для обработчика маршрута
 */
export type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Интерфейс для определения маршрута
 */
export interface IRoute {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  handler: RouteHandler;
  middleware?: IMiddleware[];
}

/**
 * Интерфейс для контроллера
 */
export interface IController {
  router: Router;
  getRoutes(): IRoute[];
}
