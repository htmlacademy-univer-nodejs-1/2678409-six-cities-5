import 'reflect-metadata';
import convict from 'convict';
import convictFormatWithValidator from 'convict-format-with-validator';
import dotenv from 'dotenv';

// Загрузка переменных окружения из .env файла
dotenv.config();

// Регистрируем дополнительные форматы для convict
convict.addFormats(convictFormatWithValidator);

// Определение схемы конфигурации
const configSchema = convict({
  nodeEnv: {
    doc: 'Окружение приложения',
    format: ['development', 'production', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'Номер порта сервера',
    format: 'port',
    env: 'PORT',
    arg: 'port',
  },
  dbHost: {
    doc: 'IP адрес сервера баз данных',
    format: 'ipaddress',
    env: 'DB_HOST',
  },
  dbPort: {
    doc: 'Номер порта БД',
    format: 'port',
    default: 5432,
    env: 'DB_PORT',
  },
  dbUser: {
    doc: 'Пользователь БД',
    default: 'postgres',
    env: 'DB_USER',
  },
  dbPassword: {
    doc: 'Пароль БД',
    default: 'root',
    env: 'DB_PASSWORD',
  },
  dbName: {
    doc: 'Название БД',
    default: 'six-cities',
    env: 'DB_NAME',
  },
  salt: {
    doc: 'Соль для хеширования',
    env: 'SALT',
  },
  jwtSecret: {
    doc: 'Секрет для JWT',
    default: 'your_jwt_secret',
    env: 'JWT_SECRET',
  },
  uploadDir: {
    doc: 'Директория для загрузок',
    default: 'uploads',
    env: 'UPLOAD_DIR',
  },
  staticDir: {
    doc: 'Директория для статики',
    default: 'public',
    env: 'STATIC_DIR',
  },
});

// Загружаем конфигурацию
configSchema.load({});

// Валидируем конфигурацию
configSchema.validate({ allowed: 'strict' });

// Экспортируем готовый конфиг
export const config = configSchema;

// Экспортируем тип конфига
export type Config = typeof configSchema;
