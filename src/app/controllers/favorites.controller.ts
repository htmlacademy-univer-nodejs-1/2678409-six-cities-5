import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IOfferService } from '../../services/offer.service.interface.js';
import { IUserService } from '../../services/user.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { OfferResponseDto } from '../dto/offer/offer-response.dto.js';
import { DocumentExistsMiddlewareFactory } from '../middleware/document-exists.factory.js';
import { AuthenticateMiddleware } from '../middleware/authenticate.middleware.js';
import { Logger } from 'pino';

/**
 * Контроллер для работы с избранными предложениями
 */
@injectable()
export class FavoritesController extends Controller {
  constructor(
    @inject(TYPES.OfferService) private readonly offerService: IOfferService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.AuthenticateMiddleware) private readonly authenticateMiddleware: AuthenticateMiddleware,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {
    super('/favorites');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
    // Создаем middleware для проверки существования предложения
    const documentExistsMiddleware = DocumentExistsMiddlewareFactory.create(
      this.offerService,
      'offerId',
      this.logger
    );

    return [
      {
        path: `${this.controllerRoute}`,
        method: 'get',
        handler: this.index.bind(this),
        middleware: [this.authenticateMiddleware],
      },
      {
        path: `${this.controllerRoute}/:offerId`,
        method: 'post',
        // Добавляем middleware проверки существования предложения и авторизации
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.add.bind(this)
          )
        ),
      },
      {
        path: `${this.controllerRoute}/:offerId`,
        method: 'delete',
        // Добавляем middleware проверки существования предложения и авторизации
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.remove.bind(this)
          )
        ),
      },
    ];
  }

  /**
   * Вспомогательный метод для оборачивания middleware в обработчик маршрута
   */
  private wrapMiddleware(
    middleware: (req: Request, res: Response, next: (err?: any) => void) => Promise<void> | void,
    handler: (req: Request, res: Response) => Promise<void>
  ): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response) =>
      new Promise<void>((resolve, reject) => {
        middleware(req, res, (err?: any) => {
          if (err) {
            reject(err);
            return;
          }
          handler(req, res).then(resolve).catch(reject);
        });
      });
  }

  /**
   * Получить все избранные предложения
   */
  private async index(req: Request, res: Response): Promise<void> {
    // Получаем userId из токена (добавлен middleware)
    if (!req.user) {
      throw new Error('Пользователь не авторизован');
    }
    const userId = req.user._id.toString();

    const offers = await this.offerService.findFavorites(userId);

    const responses = offers.map((offer) =>
      plainToInstance(
        OfferResponseDto,
        {
          id: offer._id.toString(),
          title: offer.title,
          description: offer.description,
          date: offer.date.toISOString(),
          city: offer.city,
          preview: offer.preview,
          images: offer.images,
          isPremium: offer.isPremium,
          isFavorite: true,
          rating: offer.rating,
          type: offer.type,
          bedrooms: offer.bedrooms,
          guests: offer.guests,
          price: offer.price,
          amenities: offer.amenities,
          authorId: offer.authorId.toString(),
          commentCount: offer.commentCount,
          coordinates: offer.coordinates,
          createdAt: offer.createdAt.toISOString(),
          updatedAt: offer.updatedAt.toISOString(),
        },
        { excludeExtraneousValues: true }
      )
    );

    this.ok(res, responses);
  }

  /**
   * Добавить в избранные
   * Middleware уже проверила существование предложения
   */
  private async add(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    // Получаем userId из токена (добавлен middleware)
    if (!req.user) {
      throw new Error('Пользователь не авторизован');
    }
    const userId = req.user._id.toString();

    // Документ гарантированно существует (проверила middleware)
    const offer = await this.offerService.findById(offerId);
    if (!offer) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
    }

    // Добавляем в избранные
    await this.userService.addToFavorites(userId, offerId);

    const response = plainToInstance(
      OfferResponseDto,
      {
        id: offer._id.toString(),
        title: offer.title,
        description: offer.description,
        date: offer.date.toISOString(),
        city: offer.city,
        preview: offer.preview,
        images: offer.images,
        isPremium: offer.isPremium,
        isFavorite: true,
        rating: offer.rating,
        type: offer.type,
        bedrooms: offer.bedrooms,
        guests: offer.guests,
        price: offer.price,
        amenities: offer.amenities,
        authorId: offer.authorId.toString(),
        commentCount: offer.commentCount,
        coordinates: offer.coordinates,
        createdAt: offer.createdAt.toISOString(),
        updatedAt: offer.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    this.ok(res, response);
  }

  /**
   * Удалить из избранных
   * Middleware уже проверила существование предложения
   */
  private async remove(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    // Получаем userId из токена (добавлен middleware)
    if (!req.user) {
      throw new Error('Пользователь не авторизован');
    }
    const userId = req.user._id.toString();

    // Документ гарантированно существует (проверила middleware)
    const offer = await this.offerService.findById(offerId);
    if (!offer) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
    }

    // Удаляем из избранных
    await this.userService.removeFromFavorites(userId, offerId);

    const response = plainToInstance(
      OfferResponseDto,
      {
        id: offer._id.toString(),
        title: offer.title,
        description: offer.description,
        date: offer.date.toISOString(),
        city: offer.city,
        preview: offer.preview,
        images: offer.images,
        isPremium: offer.isPremium,
        isFavorite: false,
        rating: offer.rating,
        type: offer.type,
        bedrooms: offer.bedrooms,
        guests: offer.guests,
        price: offer.price,
        amenities: offer.amenities,
        authorId: offer.authorId.toString(),
        commentCount: offer.commentCount,
        coordinates: offer.coordinates,
        createdAt: offer.createdAt.toISOString(),
        updatedAt: offer.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    this.ok(res, response);
  }
}
