import { Expose } from 'class-transformer';

/**
 * DTO для ответа предложения
 */
export class OfferResponseDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  description!: string;

  @Expose()
  date!: string;

  @Expose()
  city!: string;

  @Expose()
  preview!: string;

  @Expose()
  images!: string[];

  @Expose()
  isPremium!: boolean;

  @Expose()
  isFavorite!: boolean;

  @Expose()
  rating!: number;

  @Expose()
  type!: 'apartment' | 'house' | 'room' | 'hotel';

  @Expose()
  bedrooms!: number;

  @Expose()
  guests!: number;

  @Expose()
  price!: number;

  @Expose()
  amenities!: string[];

  @Expose()
  authorId!: string;

  @Expose()
  commentCount!: number;

  @Expose()
  coordinates!: {
    latitude: number;
    longitude: number;
  };

  @Expose()
  createdAt!: string;

  @Expose()
  updatedAt!: string;
}
