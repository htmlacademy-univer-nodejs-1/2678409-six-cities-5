import 'reflect-metadata';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { IUser, UserModel, CreateUserData } from '../models/user.entity.js';
import { IUserService } from './user.service.interface.js';

@injectable()
export class UserService implements IUserService {
  public async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    const user = await UserModel.findById(id).lean().exec();
    return user as IUser | null;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email }).lean().exec();
    return user as IUser | null;
  }

  public async findByEmailAndPassword(
    email: string,
    passwordHash: string
  ): Promise<IUser | null> {
    const user = await UserModel.findOne({ email, passwordHash }).lean().exec();
    return user as IUser | null;
  }

  public async create(userData: CreateUserData): Promise<IUser> {
    const user = new UserModel(userData);
    const saved = await user.save();
    return saved.toObject() as IUser;
  }

  public async addToFavorites(
    userId: string | Types.ObjectId,
    offerId: string | Types.ObjectId
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteOffers: new Types.ObjectId(offerId) } },
      { new: true }
    ).exec();
  }

  public async removeFromFavorites(
    userId: string | Types.ObjectId,
    offerId: string | Types.ObjectId
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { favoriteOffers: new Types.ObjectId(offerId) } },
      { new: true }
    ).exec();
  }

  public async getFavoriteOffers(
    userId: string | Types.ObjectId
  ): Promise<Types.ObjectId[]> {
    const user = await UserModel.findById(userId).lean().exec();
    if (!user) {
      return [];
    }
    return (user as IUser).favoriteOffers || [];
  }
}
