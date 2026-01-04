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

  public async create(userData: CreateUserData): Promise<IUser> {
    const user = new UserModel(userData);
    const saved = await user.save();
    return saved.toObject() as IUser;
  }
}
