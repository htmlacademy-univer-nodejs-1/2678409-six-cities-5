import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Types } from 'mongoose';
import { IOffer, OfferModel, CreateOfferData, UpdateOfferData } from '../models/offer.entity.js';
import { IOfferService } from './offer.service.interface.js';
import { ICommentService } from './comment.service.interface.js';
import { IUserService } from './user.service.interface.js';
import { IDocumentService } from '../core/service.interface.js';
import { TYPES } from '../core/types.js';

/**
 * Сервис для работы с предложениями по аренде
 * Реализует интерфейсы IOfferService и IDocumentService
 */
@injectable()
export class OfferService implements IOfferService, IDocumentService<IOffer> {
  constructor(
    @inject(TYPES.CommentService) private readonly commentService: ICommentService,
    @inject(TYPES.UserService) private readonly userService: IUserService,
  ) {}

  public async findById(id: string | Types.ObjectId): Promise<IOffer | null> {
    const offer = await OfferModel.findById(id).lean().exec();
    return offer as IOffer | null;
  }

  public async findMany(limit = 60): Promise<IOffer[]> {
    const offers = await OfferModel
      .find()
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();

    return offers as IOffer[];
  }

  public async create(offerData: CreateOfferData): Promise<IOffer> {
    const offer = new OfferModel({
      ...offerData,
      commentCount: offerData.commentCount ?? 0,
      rating: offerData.rating ?? 0,
    });
    const saved = await offer.save();
    return saved.toObject() as IOffer;
  }

  public async update(
    id: string | Types.ObjectId,
    offerData: UpdateOfferData
  ): Promise<IOffer | null> {
    const offer = await OfferModel
      .findByIdAndUpdate(id, offerData, { new: true })
      .lean()
      .exec();

    return offer as IOffer | null;
  }

  public async delete(id: string | Types.ObjectId): Promise<void> {
    // Удаляем все комментарии к предложению
    await this.commentService.deleteByOfferId(id);

    // Удаляем предложение
    await OfferModel.findByIdAndDelete(id).exec();
  }

  public async findPremiumByCity(city: string, limit = 3): Promise<IOffer[]> {
    const offers = await OfferModel
      .find({ city, isPremium: true })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();

    return offers as IOffer[];
  }

  public async findFavorites(userId: string | Types.ObjectId): Promise<IOffer[]> {
    const favoriteOfferIds = await this.userService.getFavoriteOffers(userId);

    if (favoriteOfferIds.length === 0) {
      return [];
    }

    const offers = await OfferModel
      .find({ _id: { $in: favoriteOfferIds } })
      .sort({ date: -1 })
      .lean()
      .exec();

    return offers as IOffer[];
  }

  public async updateStats(
    id: string | Types.ObjectId,
    stats: { commentCount?: number; rating?: number }
  ): Promise<void> {
    const updateData: Record<string, number> = {};

    if (stats.commentCount !== undefined) {
      updateData.commentCount = stats.commentCount;
    }

    if (stats.rating !== undefined) {
      updateData.rating = stats.rating;
    }

    await OfferModel.findByIdAndUpdate(id, updateData).exec();
  }

  /**
   * Проверить существование предложения по ID (IDocumentService)
   */
  public async exists(id: string): Promise<boolean> {
    const offer = await OfferModel.findById(id).lean().exec();
    return offer !== null;
  }
}
