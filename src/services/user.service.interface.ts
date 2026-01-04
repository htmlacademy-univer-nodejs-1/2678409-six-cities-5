import { Types } from 'mongoose';
import { IUser, CreateUserData } from '../models/user.entity.js';

export interface IUserService {
  findById(id: string | Types.ObjectId): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(userData: CreateUserData): Promise<IUser>;
}
