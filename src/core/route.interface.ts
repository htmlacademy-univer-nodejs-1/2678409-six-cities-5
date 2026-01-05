import { Router, Request, Response, NextFunction } from 'express';

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
}

/**
 * Интерфейс для контроллера
 */
export interface IController {
  router: Router;
  getRoutes(): IRoute[];
}
