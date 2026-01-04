import pino from 'pino';

export const createLogger = () => {
  // Если используется pipe с pino-pretty, не используем транспорт
  const usePipe = process.env.USE_PINO_PRETTY_PIPE === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: !usePipe && isDevelopment
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
      : undefined,
  });
};

export type Logger = ReturnType<typeof pino>;
