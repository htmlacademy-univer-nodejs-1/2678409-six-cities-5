import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { ICommentService } from '../../services/comment.service.interface.js';
import { IUserService } from '../../services/user.service.interface.js';
import { IOfferService } from '../../services/offer.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { CommentResponseDto } from '../dto/comment/comment-response.dto.js';
import { CreateCommentDto } from '../dto/comment/create-comment.dto.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import { AuthenticateMiddleware } from '../middleware/authenticate.middleware.js';
import { validateDto } from '../middleware/validate-dto.middleware.js';
import { DocumentExistsMiddlewareFactory } from '../middleware/document-exists.factory.js';
import { NotFoundException } from '../../core/exception-filter.js';
import { Logger } from 'pino';
import { Types } from 'mongoose';

/**
 * Контроллер для работы с комментариями
 */
@injectable()
export class CommentController extends Controller {
  constructor(
    @inject(TYPES.CommentService) private readonly commentService: ICommentService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.OfferService) private readonly offerService: IOfferService,
    @inject(TYPES.AuthenticateMiddleware) private readonly authenticateMiddleware: AuthenticateMiddleware,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {
    super('/offers');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    // Создаем middleware для проверки существования предложения
    const offerExistsMiddleware = DocumentExistsMiddlewareFactory.create(
      this.offerService,
      'offerId',
      this.logger
    );

    return [
      {
        path: `${this.controllerRoute}/:offerId/comments`,
        method: 'get',
        handler: this.wrapMiddleware(
          offerExistsMiddleware.execute.bind(offerExistsMiddleware),
          this.index.bind(this)
        ),
      },
      {
        path: `${this.controllerRoute}/:offerId/comments`,
        method: 'post',
        handler: this.wrapMiddleware(
          offerExistsMiddleware.execute.bind(offerExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.create.bind(this)
          )
        ),
        middleware: [validateDto(CreateCommentDto)],
      },
    ];
  }

  /**
   * Вспомогательный метод для оборачивания middleware в обработчик маршрута
   */
  private wrapMiddleware(
    middleware: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
    handler: (req: Request, res: Response) => Promise<void>
  ): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response) =>
      new Promise<void>((resolve, reject) => {
        middleware(req, res, (err?: Error | string) => {
          if (err) {
            reject(err instanceof Error ? err : new Error(err));
            return;
          }
          handler(req, res).then(resolve).catch(reject);
        });
      });
  }

  /**
   * Получить список комментариев для предложения
   */
  private async index(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    // Получаем комментарии
    const comments = await this.commentService.findByOfferId(offerId, limit);

    // Формируем ответ с информацией об авторах
    const responses = await Promise.all(
      comments.map(async (comment) => {
        const author = await this.userService.findById(comment.authorId.toString());
        if (!author) {
          this.logger.warn({ authorId: comment.authorId }, 'Автор комментария не найден');
          throw new NotFoundException('Автор комментария не найден');
        }

        const authorResponse = plainToInstance(
          UserResponseDto,
          {
            id: author._id.toString(),
            name: author.name,
            email: author.email,
            avatar: author.avatar || null,
            type: author.type,
            createdAt: author.createdAt.toISOString(),
            updatedAt: author.updatedAt.toISOString(),
          },
          { excludeExtraneousValues: true }
        );

        return plainToInstance(
          CommentResponseDto,
          {
            id: comment._id.toString(),
            text: comment.text,
            rating: comment.rating,
            publishedAt: comment.createdAt.toISOString(),
            author: authorResponse,
          },
          { excludeExtraneousValues: true }
        );
      })
    );

    this.ok(res, responses);
  }

  /**
   * Создать комментарий для предложения
   */
  private async create(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const { text, rating } = req.body;

    // Проверяем авторизацию
    if (!req.user) {
      throw new NotFoundException('Пользователь не авторизован');
    }

    // Создаем комментарий
    const comment = await this.commentService.create({
      text,
      rating,
      authorId: req.user._id,
      offerId: new Types.ObjectId(offerId),
    });

    // Получаем информацию об авторе
    const author = await this.userService.findById(comment.authorId.toString());
    if (!author) {
      this.logger.warn({ authorId: comment.authorId }, 'Автор комментария не найден');
      throw new NotFoundException('Автор комментария не найден');
    }

    const authorResponse = plainToInstance(
      UserResponseDto,
      {
        id: author._id.toString(),
        name: author.name,
        email: author.email,
        avatar: author.avatar || null,
        type: author.type,
        createdAt: author.createdAt.toISOString(),
        updatedAt: author.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    const response = plainToInstance(
      CommentResponseDto,
      {
        id: comment._id.toString(),
        text: comment.text,
        rating: comment.rating,
        publishedAt: comment.createdAt.toISOString(),
        author: authorResponse,
      },
      { excludeExtraneousValues: true }
    );

    this.created(res, response);
  }
}
