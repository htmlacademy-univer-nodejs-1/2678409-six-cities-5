import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { ICommentService } from '../../services/comment.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { CommentResponseDto } from '../dto/comment/comment-response.dto.js';
import { CreateCommentDto } from '../dto/comment/create-comment.dto.js';
import { NotFoundException } from '../../core/exception-filter.js';
import { ValidateObjectIdMiddleware } from '../middleware/validate-objectid.middleware.js';
import { validateDto } from '../middleware/validate-dto.middleware.js';
import { IComment } from '../../models/comment.entity.js';

/**
 * Контроллер для работы с комментариями к предложениям
 * Клиенты могут только добавлять комментарии.
 * Удаление и редактирование комментариев не предусмотрено.
 */
@injectable()
export class CommentController extends Controller {
  constructor(
    @inject(TYPES.CommentService) private readonly commentService: ICommentService,
    @inject(TYPES.ValidateObjectIdMiddleware) private readonly validateObjectIdMiddleware: ValidateObjectIdMiddleware
  ) {
    super('/comments');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    return [
      {
        path: `${this.controllerRoute}/:id`,
        method: 'get',
        handler: this.index.bind(this),
        middleware: [this.validateObjectIdMiddleware],
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'post',
        handler: this.create.bind(this),
        middleware: [this.validateObjectIdMiddleware, validateDto(CreateCommentDto)],
      },
    ];
  }

  /**
   * Получить список комментариев для предложения
   * Максимум 50 последних комментариев, отсортированы по дате (новые первыми)
   */
  private async index(req: Request, res: Response): Promise<void> {
    const { id: offerId } = req.params;

    const comments = await this.commentService.findByOfferId(offerId, 50);

    const responses = comments.map((comment: IComment) =>
      plainToInstance(
        CommentResponseDto,
        {
          id: comment._id.toString(),
          text: comment.text,
          rating: comment.rating,
          date: comment.date.toISOString(),
          author: {
            id: comment.authorId.toString(),
            name: comment.authorId.toString(), // TODO: подставить имя автора
            avatar: '', // TODO: подставить аватар автора
          },
        },
        { excludeExtraneousValues: true }
      )
    );

    this.ok(res, responses);
  }

  /**
   * Создать новый комментарий для предложения
   */
  private async create(req: Request, res: Response): Promise<void> {
    const { id: offerId } = req.params;
    // TODO: Получить authorId из токена
    const authorIdString = '507f1f77bcf86cd799439011'; // Mock userId

    const commentData = {
      text: req.body.text,
      rating: req.body.rating,
      date: new Date(),
      offerId,
      authorId: authorIdString,
    };

    const comment = await this.commentService.create(commentData);

    const response = plainToInstance(
      CommentResponseDto,
      {
        id: comment._id.toString(),
        text: comment.text,
        rating: comment.rating,
        date: comment.date.toISOString(),
        author: {
          id: comment.authorId.toString(),
          name: comment.authorId.toString(), // TODO: подставить имя автора
          avatar: '', // TODO: подставить аватар автора
        },
      },
      { excludeExtraneousValues: true }
    );

    this.created(res, response);
  }
}
