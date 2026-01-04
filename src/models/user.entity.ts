import 'reflect-metadata';
import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  avatar?: string | null;
  type: 'pro' | 'normal';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = {
  name: string;
  email: string;
  avatar?: string;
  type: 'pro' | 'normal';
};

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
    },
    type: {
      type: String,
      enum: ['pro', 'normal'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// @ts-ignore - Type instantiation is excessively deep
export const UserModel = mongoose.model('User', userSchema);
