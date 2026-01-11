import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IUserService } from '../../services/user.service.interface.js';
import { IAuthService } from '../../services/auth.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import { LoginDto } from '../dto/auth/login.dto.js';
import { UnauthorizedException, BadRequestException } from '../../core/exception-filter.js';
import { AuthenticateMiddleware } from '../middleware/authenticate.middleware.js';
import { validateDto } from '../middleware/validate-dto.middleware.js';
import { Logger } from 'pino';

/**
 * Контроллер для авторизации
 */
@injectable()
export class AuthController extends Controller {
  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.AuthService) private readonly authService: IAuthService,
    @inject(TYPES.AuthenticateMiddleware) private readonly authenticateMiddleware: AuthenticateMiddleware,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {
    super('/auth');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    return [
      {
        path: `${this.controllerRoute}/register`,
        method: 'post',
        handler: this.register.bind(this),
      },
      {
        path: `${this.controllerRoute}/login`,
        method: 'post',
        handler: this.login.bind(this),
        middleware: [validateDto(LoginDto)],
      },
      {
        path: `${this.controllerRoute}/logout`,
        method: 'post',
        handler: this.logout.bind(this),
        middleware: [this.authenticateMiddleware],
      },
      {
        path: `${this.controllerRoute}/status`,
        method: 'get',
        handler: this.status.bind(this),
        middleware: [this.authenticateMiddleware],
      },
    ];
  }

  /**
   * Регистрация нового пользователя
   * Перенаправляет на UserController.register
   * В спецификации указан /auth/register, но логика в UserController
   */
  private async register(_req: Request, _res: Response): Promise<void> {
    // Регистрация обрабатывается в UserController через POST /users
    // Этот маршрут оставлен для совместимости со спецификацией
    throw new BadRequestException('Используйте POST /users для регистрации');
  }

  /**
   * Вход в систему
   * Проверяет email и password, возвращает JWT токен
   */
  private async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Находим пользователя по email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем пароль (пока простое сравнение, TODO: добавить bcrypt)
    if (user.passwordHash !== password) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Создаем JWT токен
    const token = await this.authService.createToken(user);

    // Формируем ответ
    const userResponse = plainToInstance(
      UserResponseDto,
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        type: user.type,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    this.ok(res, {
      token,
      user: userResponse,
    });
  }

  /**
   * Выход из системы
   * Для JWT просто возвращаем успешный ответ (токен клиент удаляет сам)
   */
  private async logout(_req: Request, res: Response): Promise<void> {
    // Для JWT выход происходит на клиенте (удаление токена)
    // Здесь просто возвращаем успешный ответ
    this.noContent(res);
  }

  /**
   * Проверка статуса авторизации
   * Возвращает информацию о текущем пользователе
   */
  private async status(req: Request, res: Response): Promise<void> {
    // Пользователь уже добавлен в req.user middleware
    if (!req.user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const userResponse = plainToInstance(
      UserResponseDto,
      {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || null,
        type: req.user.type,
        createdAt: req.user.createdAt.toISOString(),
        updatedAt: req.user.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    this.ok(res, userResponse);
  }
}
