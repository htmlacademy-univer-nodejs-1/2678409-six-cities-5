import 'reflect-metadata';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { IComment, CommentModel, CreateCommentData } from '../models/comment.entity.js';
import { ICommentService } from './comment.service.interface.js';
import { OfferModel } from '../models/offer.entity.js';

@injectable()
export class CommentService implements ICommentService {

  public async create(commentData: CreateCommentData): Promise<IComment> {
    const comment = new CommentModel(commentData);
    const saved = await comment.save();
    
    // Обновляем количество комментариев и рейтинг предложения
    await this.updateOfferStats(commentData.offerId);
    
    return saved.toObject() as IComment;
  }

  public async findByOfferId(
    offerId: string | Types.ObjectId,
    limit: number = 50
  ): Promise<IComment[]> {
    const comments = await CommentModel
      .find({ offerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    
    return comments as IComment[];
  }

  public async deleteByOfferId(offerId: string | Types.ObjectId): Promise<void> {
    await CommentModel.deleteMany({ offerId }).exec();
  }

  public async calculateAverageRating(offerId: string | Types.ObjectId): Promise<number> {
    const result = await CommentModel.aggregate([
      { $match: { offerId: new Types.ObjectId(offerId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]).exec();

    if (result.length === 0 || result[0].averageRating === null) {
      return 0;
    }

    // Округляем до 1 знака после запятой
    return Math.round(result[0].averageRating * 10) / 10;
  }

  public async countByOfferId(offerId: string | Types.ObjectId): Promise<number> {
    return CommentModel.countDocuments({ offerId }).exec();
  }

  private async updateOfferStats(offerId: string | Types.ObjectId): Promise<void> {
    const commentCount = await this.countByOfferId(offerId);
    const averageRating = await this.calculateAverageRating(offerId);

    await OfferModel.findByIdAndUpdate(offerId, {
      commentCount,
      rating: averageRating,
    }).exec();
  }
}
