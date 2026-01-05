import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { injectable, inject } from 'inversify';
import { Logger } from 'pino';
import { Config } from '../config/config.js';
import { Database } from '../core/database.js';
import { TYPES } from '../core/types.js';
import { IController } from '../core/route.interface.js';
import { ExceptionFilter, HttpException } from '../core/exception-filter.js';
import { UserController } from './controllers/user.controller.js';
import { OfferController } from './controllers/offer.controller.js';
import { FavoritesController } from './controllers/favorites.controller.js';

/**
 * Основное приложение
 * Там здесь формируется Миддлвер, роуты и тогда стртается сервер
 */
@injectable()
export class Application {
  private expressApp: Express;

  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Config) private readonly config: Config,
    @inject(TYPES.Database) private readonly database: Database,
    @inject(TYPES.UserController) private readonly userController: UserController,
    @inject(TYPES.OfferController) private readonly offerController: OfferController,
    @inject(TYPES.FavoritesController) private readonly favoritesController: FavoritesController,
    @inject(TYPES.ExceptionFilter) private readonly exceptionFilter: ExceptionFilter,
  ) {
    // Инициализируем Express приложение
    this.expressApp = express();
  }

  /**
   * Нициализация сконфигурированного приложения
   */
  public async init(): Promise<void> {
    this.logger.info('Приложение инициализируется');

    // Подключаем миддлвер
    this.registerMiddlewares();

    // Подключаем контроллеры
    this.registerRoutes();

    // Подключаем обработчик ошибок
    this.registerExceptionFilter();

    // Подключаемся к БД
    await this.database.connect();

    // Запускаем сервер
    await this.start();
  }

  /**
   * Регистрация миддлвер
   */
  private registerMiddlewares(): void {
    // Парсируем JSON тело запроса
    this.expressApp.use(express.json());

    // Парсируем URL-энкодированные данные
    this.expressApp.use(express.urlencoded({ extended: true }));

    this.logger.info('Миддлвер зарегистрированы');
  }

  /**
   * Регистрация контроллеров и маршрутов
   */
  private registerRoutes(): void {
    // Получаем контроллеры
    const controllers: IController[] = [
      this.userController,
      this.offerController,
      this.favoritesController,
    ];

    // Регистрируем каждый контроллер
    for (const controller of controllers) {
      const routes = controller.getRoutes();

      // Регистрируем каждый маршрут
      for (const route of routes) {
        const handler = asyncHandler(route.handler);

        switch (route.method) {
          case 'get':
            this.expressApp.get(route.path, handler);
            break;
          case 'post':
            this.expressApp.post(route.path, handler);
            break;
          case 'put':
            this.expressApp.put(route.path, handler);
            break;
          case 'delete':
            this.expressApp.delete(route.path, handler);
            break;
          case 'patch':
            this.expressApp.patch(route.path, handler);
            break;
          default:
            break;
        }
      }
    }

    this.logger.info('Маршруты регистрированы');
  }

  /**
   * Регистрация фильтра ошибок
   */
  private registerExceptionFilter(): void {
    // Обычные middleware для обработки ошибок
    this.expressApp.use(
      (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        // Проверим, является ли это HttpException
        if (err instanceof HttpException) {
          this.exceptionFilter.catch(err, _req, res, _next);
          return;
        }

        // Не HttpException - логируем и отправляем 500
        this.logger.error(
          {
            error: err,
            stack: err.stack,
          },
          'Unhandled Error'
        );

        res.status(500).json({
          error: 'Internal Server Error',
        });
      }
    );

    this.logger.info('Фильтр ошибок регистрирован');
  }

  /**
   * Запуск сервера
   */
  public async start(): Promise<void> {
    const port = this.config.get('port') as number;

    return new Promise<void>((resolve, reject) => {
      // Настраиваем слушание на всех наличных адресах
      const server = this.expressApp.listen(port, '0.0.0.0', () => {
        this.logger.info(`Сервер слушает на порту: ${port}`);
        this.logger.info(`Приложение запустилось`);
        resolve();
      });

      // Обрабатываем ошибки при запуске сервера
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.error(
            { port, error: error.message },
            `Порт ${port} уже занят. Закройте другое приложение или измените порт в конфигурации.`
          );
        } else {
          this.logger.error({ error }, 'Ошибка при запуске сервера');
        }
        reject(error);
      });
    });
  }

  /**
   * Остановка сервера
   */
  public async stop(): Promise<void> {
    await this.database.disconnect();
    this.logger.info('Приложение остановлено');
  }
}
