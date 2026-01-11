import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IOfferService } from '../../services/offer.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { OfferResponseDto } from '../dto/offer/offer-response.dto.js';
import { Types } from 'mongoose';
import { IOffer } from '../../models/offer.entity.js';
import { DocumentExistsMiddlewareFactory } from '../middleware/document-exists.factory.js';
import { AuthenticateMiddleware } from '../middleware/authenticate.middleware.js';
import { IUserService } from '../../services/user.service.interface.js';
import { Logger } from 'pino';

/**
 * Контроллер для работы с предложениями
 */
@injectable()
export class OfferController extends Controller {
  constructor(
    @inject(TYPES.OfferService) private readonly offerService: IOfferService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
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
    const documentExistsMiddleware = DocumentExistsMiddlewareFactory.create(
      this.offerService,
      'id',
      this.logger
    );

    return [
      {
        path: `${this.controllerRoute}`,
        method: 'get',
        handler: this.index.bind(this),
      },
      {
        path: `${this.controllerRoute}`,
        method: 'post',
        handler: this.create.bind(this),
        middleware: [this.authenticateMiddleware],
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'get',
        // Добавляем middleware проверки существования
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.show.bind(this)
        ),
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'put',
        // Добавляем middleware проверки существования и авторизации
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.update.bind(this)
          )
        ),
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'delete',
        // Добавляем middleware проверки существования и авторизации
        handler: this.wrapMiddleware(
          documentExistsMiddleware.execute.bind(documentExistsMiddleware),
          this.wrapMiddleware(
            this.authenticateMiddleware.execute.bind(this.authenticateMiddleware),
            this.delete.bind(this)
          )
        ),
      },
      {
        path: `${this.controllerRoute}/premium/:city`,
        method: 'get',
        handler: this.getPremium.bind(this),
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
   * Получить все предложения
   * Флаг isFavorite формируется на основе избранного текущего пользователя
   */
  private async index(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 60;
    const offers = await this.offerService.findMany(limit);

    // Получаем список избранных предложений, если пользователь авторизован
    let favoriteOfferIds: Types.ObjectId[] = [];
    if (req.user) {
      favoriteOfferIds = await this.userService.getFavoriteOffers(req.user._id);
    }

    const responses = offers.map((offer: IOffer) => {
      const offerId = new Types.ObjectId(offer._id);
      const isFavorite = favoriteOfferIds.some(
        (favId) => favId.toString() === offerId.toString()
      );

      return plainToInstance(
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
          isFavorite,
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
    });

    this.ok(res, responses);
  }

  /**
   * Создать новое предложение
   */
  private async create(req: Request, res: Response): Promise<void> {
    // Получаем authorId из токена (добавлен middleware)
    if (!req.user) {
      throw new Error('Пользователь не авторизован');
    }
    const authorId = req.user._id;

    const offerData = {
      title: req.body.title,
      description: req.body.description,
      date: new Date(),
      city: req.body.city,
      preview: req.body.preview,
      images: req.body.images,
      isPremium: req.body.isPremium || false,
      rating: 0, // Новые предложения начинают с 0
      type: req.body.type,
      bedrooms: req.body.bedrooms,
      guests: req.body.guests,
      price: req.body.price,
      amenities: req.body.amenities,
      authorId,
      coordinates: req.body.coordinates,
      commentCount: 0,
    };

    const offer = await this.offerService.create(offerData);

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

    this.created(res, response);
  }

  /**
   * Получить предложение по ID
   * Middleware уже проверила существование
   * Флаг isFavorite формируется на основе избранного текущего пользователя
   */
  private async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Документ гарантированно существует (проверила middleware)
    const offer = await this.offerService.findById(id);
    if (!offer) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
    }

    // Проверяем, находится ли предложение в избранном
    let isFavorite = false;
    if (req.user) {
      const favoriteOfferIds = await this.userService.getFavoriteOffers(req.user._id);
      const offerId = new Types.ObjectId(offer._id);
      isFavorite = favoriteOfferIds.some(
        (favId) => favId.toString() === offerId.toString()
      );
    }

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
        isFavorite,
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
   * Обновить предложение
   * Middleware уже проверила существование
   */
  private async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // TODO: Проверить, что пользователь - автор

    // Документ гарантированно существует (проверила middleware)
    const updatedOffer = await this.offerService.update(id, req.body);
    if (!updatedOffer) {
      // Это не должно произойти, но TypeScript требует проверку
      return;
    }

    const response = plainToInstance(
      OfferResponseDto,
      {
        id: updatedOffer._id.toString(),
        title: updatedOffer.title,
        description: updatedOffer.description,
        date: updatedOffer.date.toISOString(),
        city: updatedOffer.city,
        preview: updatedOffer.preview,
        images: updatedOffer.images,
        isPremium: updatedOffer.isPremium,
        isFavorite: false,
        rating: updatedOffer.rating,
        type: updatedOffer.type,
        bedrooms: updatedOffer.bedrooms,
        guests: updatedOffer.guests,
        price: updatedOffer.price,
        amenities: updatedOffer.amenities,
        authorId: updatedOffer.authorId.toString(),
        commentCount: updatedOffer.commentCount,
        coordinates: updatedOffer.coordinates,
        createdAt: updatedOffer.createdAt.toISOString(),
        updatedAt: updatedOffer.updatedAt.toISOString(),
      },
      { excludeExtraneousValues: true }
    );

    this.ok(res, response);
  }

  /**
   * Удалить предложение
   * Middleware уже проверила существование
   */
  private async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // TODO: Проверить, что пользователь - автор

    // Документ гарантированно существует (проверила middleware)
    await this.offerService.delete(id);

    this.noContent(res);
  }

  /**
   * Получить премиальные предложения города
   */
  private async getPremium(req: Request, res: Response): Promise<void> {
    const { city } = req.params;

    const offers = await this.offerService.findPremiumByCity(city);

    const responses = offers.map((offer: IOffer) =>
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
      )
    );

    this.ok(res, responses);
  }
}
