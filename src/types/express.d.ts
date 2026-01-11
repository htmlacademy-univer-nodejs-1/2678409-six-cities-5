import { IUser } from '../models/user.entity.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
