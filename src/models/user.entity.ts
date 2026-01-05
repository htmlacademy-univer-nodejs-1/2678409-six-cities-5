import 'reflect-metadata';
import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  avatar?: string | null;
  passwordHash: string;
  type: 'pro' | 'normal';
  favoriteOffers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = {
  name: string;
  email: string;
  avatar?: string;
  passwordHash: string;
  type: 'pro' | 'normal';
  favoriteOffers?: mongoose.Types.ObjectId[];
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
    passwordHash: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['pro', 'normal'],
      required: true,
    },
    favoriteOffers: {
      type: [Schema.Types.ObjectId],
      ref: 'Offer',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// @ts-ignore - Type instantiation is excessively deep
export const UserModel = mongoose.model('User', userSchema);
