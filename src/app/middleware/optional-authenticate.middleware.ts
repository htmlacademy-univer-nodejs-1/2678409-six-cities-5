import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { IMiddleware } from '../../core/middleware.interface.js';
import { TYPES } from '../../core/types.js';
import { IAuthService } from '../../services/auth.service.interface.js';
import { IUserService } from '../../services/user.service.interface.js';
import { Logger } from 'pino';

/**
 * Middleware для опциональной проверки авторизации пользователя
 * Если токен присутствует и валиден, добавляет пользователя в req.user
 * Если токен отсутствует или невалиден, просто пропускает запрос без ошибки
 */
@injectable()
export class OptionalAuthenticateMiddleware implements IMiddleware {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: IAuthService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {}

  /**
   * Попытаться определить авторизованного пользователя
   * Не выбрасывает ошибку, если токен отсутствует или невалиден
   */
  public async execute(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Извлекаем токен из заголовка Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Нет токена - просто продолжаем без авторизации
        next();
        return;
      }

      const token = authHeader.substring(7); // Убираем "Bearer "

      // Проверяем токен
      const payload = await this.authService.verifyToken(token);
      if (!payload) {
        // Невалидный токен - просто продолжаем без авторизации
        this.logger.debug('Невалидный токен при опциональной аутентификации');
        next();
        return;
      }

      // Получаем пользователя из базы данных
      const user = await this.userService.findById(payload.id);
      if (!user) {
        // Пользователь не найден - просто продолжаем без авторизации
        this.logger.debug({ userId: payload.id }, 'Пользователь не найден при опциональной аутентификации');
        next();
        return;
      }

      // Добавляем пользователя в запрос
      req.user = user;
      this.logger.debug({ userId: user._id.toString() }, 'Пользователь опционально авторизован');
      return next();
    } catch (error) {
      // Любая ошибка - просто продолжаем без авторизации
      this.logger.debug({ error }, 'Ошибка при опциональной аутентификации');
      return next();
    }
  }
}
