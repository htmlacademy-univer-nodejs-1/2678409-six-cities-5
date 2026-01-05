import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import { Logger } from 'pino';
import { Config } from '../config/config.js';
import { TYPES } from './types.js';

@injectable()
export class Database {
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Config) private readonly config: Config,
  ) {}

  public async connect(): Promise<void> {
    try {
      // Получаем значения из конфигурации через getProperties()
      // и извлекаем реальные значения
      const props = this.config.getProperties();

      // Для значений с default - они уже распарсены
      // Для значений без default - может быть undefined или объект
      const host = typeof props.dbHost === 'string' ? props.dbHost : '127.0.0.1';
      const port = typeof props.dbPort === 'number' ? props.dbPort : 27017;
      const name = typeof props.dbName === 'string' ? props.dbName : 'six-cities';

      // Для опциональных значений проверяем, что это не объект конфигурации
      let user: string | undefined;
      if (props.dbUser && typeof props.dbUser === 'string') {
        user = props.dbUser;
      } else if (props.dbUser && typeof props.dbUser === 'object' && 'env' in props.dbUser) {
        // Это объект конфигурации, получаем из env
        const envKey = String((props.dbUser as unknown as { env: string }).env);
        const envValue = process.env[envKey];
        user = (envValue && typeof envValue === 'string') ? envValue : undefined;
      }

      let password: string | undefined;
      if (props.dbPassword && typeof props.dbPassword === 'string') {
        password = props.dbPassword;
      } else if (props.dbPassword && typeof props.dbPassword === 'object' && 'env' in props.dbPassword) {
        // Это объект конфигурации, получаем из env
        const envKey = String((props.dbPassword as unknown as { env: string }).env);
        const envValue = process.env[envKey];
        password = (envValue && typeof envValue === 'string') ? envValue : undefined;
      }

      // Финальная проверка - убеждаемся, что user и password - строки или undefined
      // Также проверяем, что они не пустые
      if (user && (typeof user !== 'string' || user.trim() === '')) {
        user = undefined;
      }
      if (password && (typeof password !== 'string' || password.trim() === '')) {
        password = undefined;
      }

      this.logger.info('Попытка подключения к MongoDB...');
      this.logger.debug({ host, port, name, hasUser: !!user, hasPassword: !!password }, 'Параметры подключения');

      let connectionString: string;
      // Используем аутентификацию только если оба значения указаны и не пустые
      // Для локальной разработки MongoDB обычно работает без аутентификации
      if (user && password && user.trim() !== '' && password.trim() !== '') {
        connectionString = `mongodb://${user}:${password}@${host}:${port}/${name}?authSource=admin`;
        this.logger.debug('Используется аутентификация MongoDB');
      } else {
        connectionString = `mongodb://${host}:${port}/${name}`;
        this.logger.debug('Подключение к MongoDB без аутентификации');
      }

      this.logger.debug(`Подключение к: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);

      await mongoose.connect(connectionString, {
        authSource: user && password ? 'admin' : undefined,
      });

      this.logger.info(`Успешно подключено к MongoDB: ${host}:${port}/${name}`);
    } catch (error) {
      this.logger.error({ err: error }, 'Ошибка при подключении к MongoDB');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.logger.info('Отключено от MongoDB');
    } catch (error) {
      this.logger.error({ err: error }, 'Ошибка при отключении от MongoDB');
      throw error;
    }
  }
}
