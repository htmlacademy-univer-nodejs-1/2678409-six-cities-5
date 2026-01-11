/**
 * Интерфейс для услуги доступа к данным
 * Определяет базовый контракт для сервисов с проверкой существования документов
 */
export interface IDocumentService<T> {
  /**
   * Проверить существование документа по ID
   * @param id - Идентификатор документа
   * @returns - true если документ существует, false иначе
   */
  exists(id: string): Promise<boolean>;

  /**
   * Получить документ по ID
   * @param id - Идентификатор документа
   * @returns - Документ или null если не найден
   */
  findById(id: string): Promise<T | null>;
}
