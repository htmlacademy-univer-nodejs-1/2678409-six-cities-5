import { Router, Request, Response, NextFunction } from 'express';
import multer, { Multer, MulterError } from 'multer';
import { extname } from 'path';
import { nanoid } from 'nanoid';
import { lookup } from 'mime-types';
import { injectable, inject } from 'inversify';
import { Logger } from 'pino';
import { TYPES } from '../../core/types.js';
import { Config } from '../../config/config.js';
import { BadRequestException } from '../../core/exception-filter.js';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Миддлвер для загрузки файлов
 * Обрабатывает загруженные файлы, составляет ним странс в req.file
 */
@injectable()
export class UploadFileMiddleware {
  private multerInstance: Multer;
  private readonly uploadDir: string;
  private readonly allowedMimes: string[] = ['image/jpeg', 'image/png'];
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5 MB

  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Config) private readonly config: Config
  ) {
    this.uploadDir = this.config.get('uploadDir') as string;
    this.initializeUploadDirectory();
    this.multerInstance = this.createMulterInstance();
  }

  /**
   * Инициализировать директорию для отгружок
   */
  private async initializeUploadDirectory(): Promise<void> {
    try {
      if (!existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
        this.logger.info(`Директория для отгружок создана: ${this.uploadDir}`);
      }
    } catch (err) {
      this.logger.error(
        { error: err },
        `Ошибка при нициализации директории отгружок`
      );
    }
  }

  /**
   * Составить поконигурированные параметры multer
   */
  private createMulterInstance(): Multer {
    return multer({
      storage: multer.diskStorage({
        destination: (_req: Request, _file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (_req: Request, file, cb) => {
          // Генерируем уникальное отчества явно файла
          const uniqueId = nanoid();
          // Определяем расширение файла через mime-types
          const ext = this.getFileExtension(file.mimetype);
          const filename = `${uniqueId}${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (_req: Request, file, cb) => {
        // Проверяем MIME тип файла
        if (this.allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Доволен только загружать JPEG и PNG`
            )
          );
        }
      },
    });
  }

  /**
   * Определить расширение файла по MIME типу
   */
  private getFileExtension(mimetype: string): string {
    const ext = lookup(mimetype);
    return ext ? `.${ext}` : '';
  }

  /**
   * Основной обработчик миддлвера
   * Обрабатывает один файл ис поля 'avatar'
   */
  public execute = (): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const uploadHandler = this.multerInstance.single('avatar');

      uploadHandler(req, res, (err: unknown) => {
        if (err instanceof MulterError) {
          // Обрабатываем ошибки multer
          this.logger.error(
            { error: err.message, code: err.code },
            'Ошибка при отгружке файла'
          );

          if (err.code === 'LIMIT_FILE_SIZE') {
            throw new BadRequestException(
              `Размер файла превышает не больше 5МБ`
            );
          }

          throw new BadRequestException(err.message);
        }

        if (err) {
          this.logger.error({ error: err }, 'Ошибка при отгружке файла');
          throw new BadRequestException((err as Error).message);
        }

        if (req.file) {
          this.logger.debug(
            { filename: req.file.filename, fieldname: req.file.fieldname },
            'Файл успешно отгружен'
          );
        }

        next();
      });
    };
  };
}
