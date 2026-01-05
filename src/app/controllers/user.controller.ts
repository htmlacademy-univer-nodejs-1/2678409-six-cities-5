import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IUserService } from '../../services/user.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import { ConflictException, NotFoundException } from '../../core/exception-filter.js';

/**
 * Контроллер для работы с пользователями
 */
@injectable()
export class UserController extends Controller {
  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService
  ) {
    super('/users');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    return [
      {
        path: `${this.controllerRoute}`,
        method: 'post',
        handler: this.register.bind(this),
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'get',
        handler: this.show.bind(this),
      },
      {
        path: `${this.controllerRoute}/check-auth`,
        method: 'get',
        handler: this.checkAuth.bind(this),
      },
    ];
  }

  /**
   * Регистрация нового пользователя
   */
  private async register(req: Request, res: Response): Promise<void> {
    // Хешируем пароль (TODO: при доработке добавить bcrypt)
    const passwordHash = req.body.password; // TODO: hash password

    // Проверим, экзистирует ли пользователь с таким email
    const existingUser = await this.userService.findByEmail(req.body.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Создаем нового пользователя
    const userData = {
      name: req.body.name,
      email: req.body.email,
      avatar: req.body.avatar,
      passwordHash,
      type: req.body.type,
    };

    const user = await this.userService.create(userData);

    // Конвертируем в DTO и отправляем
    const response = plainToInstance(
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

    this.created(res, response);
  }

  /**
   * Получить информацию о пользователе
   */
  private async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Конвертируем в DTO и отправляем
    const response = plainToInstance(
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

    this.ok(res, response);
  }

  /**
   * Проверка автентификации (TODO: обновить на нормальную)
   */
  private async checkAuth(_req: Request, res: Response): Promise<void> {
    this.ok(res, { status: 'authenticated' });
  }
}
