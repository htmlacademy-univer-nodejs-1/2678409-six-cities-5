import { Types } from 'mongoose';
import { IUser, CreateUserData } from '../models/user.entity.js';
import { IDocumentService } from '../core/service.interface.js';

export interface IUserService extends IDocumentService<IUser> {
  findById(id: string | Types.ObjectId): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailAndPassword(email: string, passwordHash: string): Promise<IUser | null>;
  create(userData: CreateUserData): Promise<IUser>;
  addToFavorites(userId: string | Types.ObjectId, offerId: string | Types.ObjectId): Promise<void>;
  removeFromFavorites(userId: string | Types.ObjectId, offerId: string | Types.ObjectId): Promise<void>;
  getFavoriteOffers(userId: string | Types.ObjectId): Promise<Types.ObjectId[]>;
  updateAvatar(id: string, avatarPath: string): Promise<IUser | null>;
}
