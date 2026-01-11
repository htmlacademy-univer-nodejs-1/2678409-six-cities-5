import { IUser } from '../models/user.entity.js';

export interface IAuthService {
  createToken(user: IUser): Promise<string>;
  verifyToken(token: string): Promise<{ id: string; email: string } | null>;
}
