import 'reflect-metadata';
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { plainToInstance } from 'class-transformer';
import { TYPES } from '../../core/types.js';
import { IOfferService } from '../../services/offer.service.interface.js';
import { Controller } from '../../core/controller.abstract.js';
import { IRoute } from '../../core/route.interface.js';
import { OfferResponseDto } from '../dto/offer/offer-response.dto.js';
import { NotFoundException } from '../../core/exception-filter.js';
import { Types } from 'mongoose';

/**
 * Контроллер для работы с предложениями
 */
@injectable()
export class OfferController extends Controller {
  constructor(
    @inject(TYPES.OfferService) private readonly offerService: IOfferService
  ) {
    super('/offers');
  }

  /**
   * Получить все маршруты контроллера
   */
  public getRoutes(): IRoute[] {
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
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'get',
        handler: this.show.bind(this),
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'put',
        handler: this.update.bind(this),
      },
      {
        path: `${this.controllerRoute}/:id`,
        method: 'delete',
        handler: this.delete.bind(this),
      },
      {
        path: `${this.controllerRoute}/premium/:city`,
        method: 'get',
        handler: this.getPremium.bind(this),
      },
    ];
  }

  /**
   * Получить все предложения
   */
  private async index(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 60;
    const offers = await this.offerService.findMany(limit);

    const responses = offers.map((offer: any) =>
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
          isFavorite: false, // TODO: проверить наличие в исбранным
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
   * Создать новое предложение
   */
  private async create(req: Request, res: Response): Promise<void> {
    // TODO: Получить authorId из токена
    const authorIdString = '507f1f77bcf86cd799439011'; // Mock userId
    const authorId = new Types.ObjectId(authorIdString);

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
   */
  private async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const offer = await this.offerService.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
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

  /**
   * Обновить предложение
   */
  private async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // TODO: Проверить, что пользователь - автор

    const offer = await this.offerService.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const updatedOffer = await this.offerService.update(id, req.body);
    if (!updatedOffer) {
      throw new NotFoundException('Offer not found after update');
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
   */
  private async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // TODO: Проверить, что пользователь - автор

    const offer = await this.offerService.findById(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    await this.offerService.delete(id);

    this.noContent(res);
  }

  /**
   * Получить премиальные предложения города
   */
  private async getPremium(req: Request, res: Response): Promise<void> {
    const { city } = req.params;

    const offers = await this.offerService.findPremiumByCity(city);

    const responses = offers.map((offer: any) =>
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
