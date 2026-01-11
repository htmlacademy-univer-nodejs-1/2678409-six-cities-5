import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { Logger } from 'pino';
import { NotFoundException } from '../../core/exception-filter.js';
import { IDocumentService } from '../../core/service.interface.js';

/**
 * Миддлвер для проверки существования документа в базе данных по ID
 *
 * Использование:
 * const middleware = new DocumentExistsMiddleware(offerService, 'id', logger);
 * router.delete('/:id', middleware.execute.bind(middleware), deleteHandler);
 *
 * @param service - Сервис доступа к данным, реализующий IDocumentService
 * @param paramName - Наименование параметра маршрута с ID
 * @param logger - Логгер
 */
@injectable()
export class DocumentExistsMiddleware {
  constructor(
    private readonly service: IDocumentService<unknown>,
    private readonly paramName: string = 'id',
    private readonly logger: Logger
  ) {}

  /**
   * Основной метод миддлвера
   * Проверяет существование документа по ID
   */
  public async execute(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    const documentId = req.params[this.paramName];

    // Проверяем наличие ID в параметрах
    if (!documentId) {
      this.logger.warn(
        { paramName: this.paramName },
        'Отсутствует бобываемый параметр'
      );
      throw new NotFoundException(`Параметр ${this.paramName} не найден`);
    }

    // Проверяем существование документа
    const documentExists = await this.service.exists(documentId);

    if (!documentExists) {
      this.logger.debug(
        { documentId, paramName: this.paramName },
        'Документ не найден'
      );
      throw new NotFoundException(`Документ с ID ${documentId} не найден`);
    }

    this.logger.debug(
      { documentId, paramName: this.paramName },
      'Документ существует'
    );

    // Попередаем токен дальнейшему миддлверу
    next();
  }
}
