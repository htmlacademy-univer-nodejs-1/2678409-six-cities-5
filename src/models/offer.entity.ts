import 'reflect-metadata';
import mongoose, { Schema, Types } from 'mongoose';

export interface IOffer {
  _id: Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  city: string;
  preview: string;
  images: string[];
  isPremium: boolean;
  isFavorite: boolean;
  rating: number;
  type: 'apartment' | 'house' | 'room' | 'hotel';
  bedrooms: number;
  guests: number;
  price: number;
  amenities: string[];
  authorId: Types.ObjectId;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOfferData = {
  title: string;
  description: string;
  date: Date;
  city: string;
  preview: string;
  images: string[];
  isPremium: boolean;
  isFavorite: boolean;
  rating: number;
  type: 'apartment' | 'house' | 'room' | 'hotel';
  bedrooms: number;
  guests: number;
  price: number;
  amenities: string[];
  authorId: Types.ObjectId;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  commentCount: number;
};

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    preview: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    isPremium: {
      type: Boolean,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['apartment', 'house', 'room', 'hotel'],
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    amenities: {
      type: [String],
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const OfferModel = mongoose.model('Offer', offerSchema);
