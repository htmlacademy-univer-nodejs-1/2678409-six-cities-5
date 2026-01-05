import { Expose } from 'class-transformer';

/**
 * DTO для обновления предложения
 */
export class UpdateOfferDto {
    @Expose()
      title?: string;

    @Expose()
      description?: string;

    @Expose()
      city?: string;

    @Expose()
      preview?: string;

    @Expose()
      images?: string[];

    @Expose()
      isPremium?: boolean;

    @Expose()
      type?: 'apartment' | 'house' | 'room' | 'hotel';

    @Expose()
      bedrooms?: number;

    @Expose()
      guests?: number;

    @Expose()
      price?: number;

    @Expose()
      amenities?: string[];

    @Expose()
      coordinates?: {
        latitude: number;
        longitude: number;
    };
}
