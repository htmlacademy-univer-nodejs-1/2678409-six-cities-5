import { Types } from 'mongoose';
import { IOffer, CreateOfferData } from '../models/offer.entity.js';

export interface IOfferService {
  findById(id: string | Types.ObjectId): Promise<IOffer | null>;
  create(offerData: CreateOfferData): Promise<IOffer>;
}
