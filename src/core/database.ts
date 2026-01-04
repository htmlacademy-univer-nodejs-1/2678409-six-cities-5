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
      const dbHost = this.config.getProperties().dbHost;
      const dbPort = this.config.getProperties().dbPort;
      const dbName = this.config.getProperties().dbName;
      const dbUser = this.config.getProperties().dbUser;
      const dbPassword = this.config.getProperties().dbPassword;

      // Получаем значения из переменных окружения
      const host = typeof dbHost === 'object' && dbHost !== null && 'env' in dbHost
        ? process.env[String((dbHost as unknown as { env: string }).env)] || '127.0.0.1'
        : String(dbHost);
      const port = typeof dbPort === 'object' && dbPort !== null && 'env' in dbPort
        ? process.env[String((dbPort as unknown as { env: string }).env)] || '27017'
        : String(dbPort);
      const name = typeof dbName === 'object' && dbName !== null && 'env' in dbName
        ? process.env[String((dbName as unknown as { env: string }).env)] || 'six-cities'
        : String(dbName);
      const user = typeof dbUser === 'object' && dbUser !== null && 'env' in dbUser
        ? process.env[String((dbUser as unknown as { env: string }).env)]
        : dbUser ? String(dbUser) : undefined;
      const password = typeof dbPassword === 'object' && dbPassword !== null && 'env' in dbPassword
        ? process.env[String((dbPassword as unknown as { env: string }).env)]
        : dbPassword ? String(dbPassword) : undefined;

      this.logger.info('Попытка подключения к MongoDB...');

      let connectionString: string;
      if (user && password) {
        connectionString = `mongodb://${user}:${password}@${host}:${port}/${name}?authSource=admin`;
      } else {
        connectionString = `mongodb://${host}:${port}/${name}`;
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
