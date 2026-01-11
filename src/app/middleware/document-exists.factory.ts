import { Logger } from 'pino';
import { DocumentExistsMiddleware } from './document-exists.middleware.js';
import { IDocumentService } from '../../core/service.interface.js';

/**
 * Фабрика для создания миддлвер DocumentExistsMiddleware
 * Позволяет легко конфигурировать сами объекты миддлвера
 * для разных паометров и параметров
 */
export class DocumentExistsMiddlewareFactory {
  /**
   * Создать новые миддлвер для проверки существования документа
   * @param service - Сервис доступа к данным
   * @param paramName - Наименование параметра маршрута
   * @param logger - Логгер
   * @returns - Новые покофигуриранные миддлвер
   */
  public static create(
    service: IDocumentService<unknown>,
    paramName = 'id',
    logger: Logger
  ): DocumentExistsMiddleware {
    return new DocumentExistsMiddleware(service, paramName, logger);
  }
}
