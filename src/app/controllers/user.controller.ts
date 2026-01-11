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
import { UploadFileMiddleware } from '../middleware/upload-file.middleware.js';
import { DocumentExistsMiddlewareFactory } from '../middleware/document-exists.factory.js';
import { Logger } from 'pino';

/**
 * Контроллер для работы с пользователями
 */
@injectable()
export class UserController extends Controller {
  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.UploadFileMiddleware) private readonly uploadFileMiddleware: UploadFileMiddleware,
  ) {
    super('/users');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    const documentExistsMiddleware = DocumentExistsMiddlewareFactory.create(
      this.userService,
      'id',
      this.logger
    );

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
        path: `${this.controllerRoute}/:id/avatar`,
        method: 'post',
        handler: this.uploadAvatar.bind(this),
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
   * Загружать аватар пользователя
   * POST /users/:id/avatar
   */
  private async uploadAvatar(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Проверяем, что файл был загружен
    if (!req.file) {
      this.badRequest(res, 'Файл не редан для отгружки');
      return;
    }

    // Обновляем аватар пользователя
    const uploadDir = req.file.destination;
    const filename = req.file.filename;
    const avatarPath = `${uploadDir}/${filename}`;

    // TODO: Тут можно добавить проверку существования пользователя
    // несмотря на то, что ее иходит как квази-миддлвера
    // Специальные графики не возэникли, так как открыты апи
    const updatedUser = await this.userService.updateAvatar(id, avatarPath);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const response = plainToInstance(
      UserResponseDto,
      {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || null,
        type: updatedUser.type,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
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
