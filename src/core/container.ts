import 'reflect-metadata';
import { Container } from 'inversify';
import { Logger } from 'pino';
import { createLogger } from './logger.js';
import { config, Config } from '../config/config.js';
import { Application } from '../app/application.js';
import { Database } from './database.js';
import { UserService } from '../services/user.service.js';
import { OfferService } from '../services/offer.service.js';
import { CityService } from '../services/city.service.js';
import { CommentService } from '../services/comment.service.js';
import { AuthService } from '../services/auth.service.js';
import { ImportService } from '../cli/import.service.js';
import { UserController } from '../app/controllers/user.controller.js';
import { OfferController } from '../app/controllers/offer.controller.js';
import { FavoritesController } from '../app/controllers/favorites.controller.js';
import { AuthController } from '../app/controllers/auth.controller.js';
import { ExceptionFilter } from './exception-filter.js';
import { IUserService } from '../services/user.service.interface.js';
import { IOfferService } from '../services/offer.service.interface.js';
import { ICityService } from '../services/city.service.interface.js';
import { ICommentService } from '../services/comment.service.interface.js';
import { IAuthService } from '../services/auth.service.interface.js';
import { UploadFileMiddleware } from '../app/middleware/upload-file.middleware.js';
import { AuthenticateMiddleware } from '../app/middleware/authenticate.middleware.js';
import { TYPES } from './types.js';

const container = new Container();

// Регистрация логера как синглтона
container
  .bind<Logger>(TYPES.Logger)
  .toConstantValue(createLogger());

// Регистрация конфигурации как синглтона
container
  .bind<Config>(TYPES.Config)
  .toConstantValue(config);

// Регистрация Database
container
  .bind<Database>(TYPES.Database)
  .to(Database)
  .inSingletonScope();

// Регистрация сервисов
container
  .bind<IUserService>(TYPES.UserService)
  .to(UserService)
  .inSingletonScope();

container
  .bind<IOfferService>(TYPES.OfferService)
  .to(OfferService)
  .inSingletonScope();

container
  .bind<ICityService>(TYPES.CityService)
  .to(CityService)
  .inSingletonScope();

container
  .bind<ICommentService>(TYPES.CommentService)
  .to(CommentService)
  .inSingletonScope();

container
  .bind<IAuthService>(TYPES.AuthService)
  .to(AuthService)
  .inSingletonScope();

// Регистрация ImportService
container
  .bind<ImportService>(TYPES.ImportService)
  .to(ImportService)
  .inSingletonScope();

// Регистрация UploadFileMiddleware
container
  .bind<UploadFileMiddleware>(TYPES.UploadFileMiddleware)
  .to(UploadFileMiddleware)
  .inSingletonScope();

// Регистрация AuthenticateMiddleware
container
  .bind<AuthenticateMiddleware>(TYPES.AuthenticateMiddleware)
  .to(AuthenticateMiddleware)
  .inSingletonScope();

// Регистрация контроллеров
container
  .bind<UserController>(TYPES.UserController)
  .to(UserController)
  .inSingletonScope();

container
  .bind<OfferController>(TYPES.OfferController)
  .to(OfferController)
  .inSingletonScope();

container
  .bind<FavoritesController>(TYPES.FavoritesController)
  .to(FavoritesController)
  .inSingletonScope();

container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();

// Регистрация UploadFileMiddleware
container
  .bind<UploadFileMiddleware>(TYPES.UploadFileMiddleware)
  .to(UploadFileMiddleware)
  .inSingletonScope();

// Регистрация AuthenticateMiddleware
container
  .bind<AuthenticateMiddleware>(TYPES.AuthenticateMiddleware)
  .to(AuthenticateMiddleware)
  .inSingletonScope();

// Регистрация ExceptionFilter
container
  .bind<ExceptionFilter>(TYPES.ExceptionFilter)
  .to(ExceptionFilter)
  .inSingletonScope();

// Регистрация Application
container
  .bind<Application>(TYPES.Application)
  .to(Application)
  .inSingletonScope();

export { container };
export { TYPES } from './types.js';
