import 'reflect-metadata';
import { Container } from 'inversify';
import { Logger } from 'pino';
import { createLogger } from './logger.js';
import { config, Config } from '../config/config.js';
import { Application } from '../app/application.js';
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

// Регистрация Application
container
  .bind<Application>(TYPES.Application)
  .to(Application)
  .inSingletonScope();

export { container };
export { TYPES } from './types.js';
