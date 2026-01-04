import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Logger } from 'pino';
import { Config } from '../config/config.js';
import { TYPES } from '../core/types.js';

@injectable()
export class Application {
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Config) private readonly config: Config,
  ) {}

  public async init(): Promise<void> {
    this.logger.info('Приложение инициализировано');
    const portValue = this.config.getProperties().port;
    // Если значение - объект схемы, получаем из переменных окружения
    const port = typeof portValue === 'object' && portValue !== null && 'env' in portValue
      ? process.env[portValue.env as string] || portValue
      : portValue;
    this.logger.info(`Сервер слушает на порту: ${port}`);
  }

  public async start(): Promise<void> {
    this.logger.info('Приложение запущено');
  }

  public async stop(): Promise<void> {
    this.logger.info('Приложение остановлено');
  }
}
