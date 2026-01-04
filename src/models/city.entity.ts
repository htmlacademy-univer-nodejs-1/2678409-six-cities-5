import 'reflect-metadata';
import mongoose, { Schema } from 'mongoose';

export interface ICity {
  _id: mongoose.Types.ObjectId;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCityData = {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

const citySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

export const CityModel = mongoose.model('City', citySchema);
