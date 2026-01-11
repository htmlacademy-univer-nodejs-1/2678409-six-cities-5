import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { IMiddleware } from '../../core/middleware.interface.js';
import { TYPES } from '../../core/types.js';
import { IAuthService } from '../../services/auth.service.interface.js';
import { IUserService } from '../../services/user.service.interface.js';
import { UnauthorizedException } from '../../core/exception-filter.js';
import { Logger } from 'pino';

/**
 * Middleware для проверки авторизации пользователя
 * Проверяет JWT токен и добавляет пользователя в req.user
 */
@injectable()
export class AuthenticateMiddleware implements IMiddleware {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: IAuthService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {}

  /**
   * Проверить авторизацию пользователя
   * Извлекает токен из заголовка Authorization и проверяет его
   */
  public async execute(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    const token = authHeader.substring(7); // Убираем "Bearer "

    // Проверяем токен
    const payload = await this.authService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Недействительный токен');
    }

    // Получаем пользователя из базы данных
    const user = await this.userService.findById(payload.id);
    if (!user) {
      this.logger.warn({ userId: payload.id }, 'Пользователь не найден');
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Добавляем пользователя в запрос
    req.user = user;

    this.logger.debug({ userId: user._id.toString() }, 'Пользователь авторизован');
    next();
  }
}
