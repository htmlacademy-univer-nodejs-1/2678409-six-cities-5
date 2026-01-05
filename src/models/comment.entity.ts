import 'reflect-metadata';
import mongoose, { Schema, Types } from 'mongoose';

export interface IComment {
  _id: Types.ObjectId;
  text: string;
  rating: number;
  authorId: Types.ObjectId;
  offerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCommentData = {
  text: string;
  rating: number;
  authorId: Types.ObjectId;
  offerId: Types.ObjectId;
};

const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CommentModel = mongoose.model('Comment', commentSchema);
