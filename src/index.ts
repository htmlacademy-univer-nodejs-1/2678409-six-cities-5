import 'reflect-metadata';
import { container } from './core/container.js';
import { TYPES } from './core/types.js';
import { Application } from './app/application.js';
import { Logger } from 'pino';

const start = async () => {
  try {
    const app = container.get<Application>(TYPES.Application);
    await app.init();
  } catch (error) {
    const logger = container.get<Logger>(TYPES.Logger);
    logger.error({ err: error }, 'Критическая ошибка при запуске приложения');
    throw error;
  }
};

start();
