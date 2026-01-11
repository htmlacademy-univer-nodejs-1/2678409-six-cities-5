import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IUserService } from '../../services/user.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import { ConflictException, BadRequestException } from '../../core/exception-filter.js';
import { UploadFileMiddleware } from '../middleware/upload-file.middleware.js';
import { DocumentExistsMiddlewareFactory } from '../middleware/document-exists.factory.js';
import { AuthenticateMiddleware } from '../middleware/authenticate.middleware.js';
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
    @inject(TYPES.AuthenticateMiddleware) private readonly authenticateMiddleware: AuthenticateMiddleware,
  ) {
    super('/users');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    // Создаем middleware для проверки существования пользователя
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
        // Добавляем middleware проверки существования
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.show.bind(this)
        ),
      },
      {
        path: `${this.controllerRoute}/:id/avatar`,
        method: 'post',
        // Добавляем middleware проверки существования, авторизации и загрузки файла
        // Порядок: сначала проверяем пользователя, потом авторизацию, потом загружаем файл
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.wrapMiddleware(
              this.uploadFileMiddleware.execute(),
              this.uploadAvatar.bind(this)
            )
          )
        ),
      },
      {
        path: `${this.controllerRoute}/check-auth`,
        method: 'get',
        handler: this.checkAuth.bind(this),
      },
    ];
  }

  /**
   * Вспомогательный метод для оборачивания middleware в обработчик маршрута
   */
  private wrapMiddleware(
    middleware: (req: Request, res: Response, next: (err?: any) => void) => Promise<void> | void,
    handler: (req: Request, res: Response) => Promise<void>
  ): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response) =>
      new Promise<void>((resolve, reject) => {
        middleware(req, res, (err?: any) => {
          if (err) {
            reject(err);
            return;
          }
          handler(req, res).then(resolve).catch(reject);
        });
      });
  }

  /**
   * Регистрация нового пользователя
   */
  private async register(req: Request, res: Response): Promise<void> {
    try {
      // Валидация входных данных
      if (!req.body.name || !req.body.email || !req.body.password || !req.body.type) {
        throw new BadRequestException('Не все обязательные поля заполнены');
      }

      // Преобразуем 'common' в 'normal' для совместимости
      let userType: 'pro' | 'normal';
      const requestedType = req.body.type;
      if (requestedType === 'common') {
        userType = 'normal';
      } else if (requestedType === 'pro' || requestedType === 'normal') {
        userType = requestedType;
      } else {
        throw new BadRequestException('Тип пользователя должен быть "pro" или "normal"');
      }

      // Хешируем пароль (TODO: при доработке добавить bcrypt)
      const passwordHash = req.body.password; // TODO: hash password

      // Проверим, существует ли пользователь с таким email
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
        type: userType,
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
    } catch (error: any) {
      // Если это уже HttpException, пробрасываем дальше
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      // Обработка ошибок MongoDB (например, duplicate key)
      if (error.code === 11000 || error.name === 'MongoServerError') {
        throw new ConflictException('User with this email already exists');
      }
      // Обработка ошибок валидации MongoDB
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map((e: any) => e.message);
        throw new BadRequestException(messages.join(', ') || 'Validation error');
      }
      // Для остальных ошибок пробрасываем как есть (они будут обработаны error handler)
      throw error;
    }
  }

  /**
   * Получить информацию о пользователе
   * Middleware уже проверила существование
   */
  private async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Документ гарантированно существует (проверила middleware)
    const user = await this.userService.findById(id);
    if (!user) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
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
   * Загрузить аватар пользователя
   * POST /users/:id/avatar
   *
   * Middleware (вызываются в этом порядке):
   * 1. DocumentExistsMiddleware - проверяет существование пользователя
   * 2. UploadFileMiddleware - загружает файл
   * 3. uploadAvatar - основной обработчик
   */
  private async uploadAvatar(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Проверяем, что файл был загружен
    if (!req.file) {
      throw new BadRequestException('Файл не передан для загрузки');
    }

    // Сохраняем путь к файлу для статики
    // express.static раздает файлы по пути /uploads/filename
    const filename = req.file.filename;
    const avatarPath = `/uploads/${filename}`;

    // Пользователь существует - это проверила middleware
    const updatedUser = await this.userService.updateAvatar(id, avatarPath);
    if (!updatedUser) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
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
