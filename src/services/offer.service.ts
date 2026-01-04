import 'reflect-metadata';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { IOffer, OfferModel, CreateOfferData } from '../models/offer.entity.js';
import { IOfferService } from './offer.service.interface.js';

@injectable()
export class OfferService implements IOfferService {
  public async findById(id: string | Types.ObjectId): Promise<IOffer | null> {
    const offer = await OfferModel.findById(id).lean().exec();
    return offer as IOffer | null;
  }

  public async create(offerData: CreateOfferData): Promise<IOffer> {
    const offer = new OfferModel(offerData);
    const saved = await offer.save();
    return saved.toObject() as IOffer;
  }
}
