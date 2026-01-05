import { Types } from 'mongoose';
import { IOffer, CreateOfferData, UpdateOfferData } from '../models/offer.entity.js';

export interface IOfferService {
  findById(id: string | Types.ObjectId): Promise<IOffer | null>;
  findMany(limit?: number): Promise<IOffer[]>;
  create(offerData: CreateOfferData): Promise<IOffer>;
  update(id: string | Types.ObjectId, offerData: UpdateOfferData): Promise<IOffer | null>;
  delete(id: string | Types.ObjectId): Promise<void>;
  findPremiumByCity(city: string, limit?: number): Promise<IOffer[]>;
  findFavorites(userId: string | Types.ObjectId): Promise<IOffer[]>;
  updateStats(id: string | Types.ObjectId, stats: { commentCount?: number; rating?: number }): Promise<void>;
}
