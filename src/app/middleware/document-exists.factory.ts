import { Logger } from 'pino';
import { DocumentExistsMiddleware } from './document-exists.middleware.js';
import { IDocumentService } from '../../core/service.interface.js';

export class DocumentExistsMiddlewareFactory {
  /**
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
