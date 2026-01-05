import { Types } from 'mongoose';
import { IUser, CreateUserData } from '../models/user.entity.js';

export interface IUserService {
  findById(id: string | Types.ObjectId): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailAndPassword(email: string, passwordHash: string): Promise<IUser | null>;
  create(userData: CreateUserData): Promise<IUser>;
  addToFavorites(userId: string | Types.ObjectId, offerId: string | Types.ObjectId): Promise<void>;
  removeFromFavorites(userId: string | Types.ObjectId, offerId: string | Types.ObjectId): Promise<void>;
  getFavoriteOffers(userId: string | Types.ObjectId): Promise<Types.ObjectId[]>;
}
