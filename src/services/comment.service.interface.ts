import { Types } from 'mongoose';
import { IComment, CreateCommentData } from '../models/comment.entity.js';

export interface ICommentService {
  create(commentData: CreateCommentData): Promise<IComment>;
  findByOfferId(offerId: string | Types.ObjectId, limit?: number): Promise<IComment[]>;
  deleteByOfferId(offerId: string | Types.ObjectId): Promise<void>;
  calculateAverageRating(offerId: string | Types.ObjectId): Promise<number>;
  countByOfferId(offerId: string | Types.ObjectId): Promise<number>;
}
