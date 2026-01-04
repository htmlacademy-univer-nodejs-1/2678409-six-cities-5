import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Logger } from 'pino';
import { Database } from '../core/database.js';
import { IUserService } from '../services/user.service.interface.js';
import { IOfferService } from '../services/offer.service.interface.js';
import { ICityService } from '../services/city.service.interface.js';
import { TYPES } from '../core/types.js';
import { Types } from 'mongoose';

interface ParsedOffer {
  title: string;
  description: string;
  date: string;
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
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorType: 'pro' | 'normal';
  latitude: number;
  longitude: number;
  commentCount: number;
}

@injectable()
export class ImportService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Database) private readonly database: Database,
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.OfferService) private readonly offerService: IOfferService,
    @inject(TYPES.CityService) private readonly cityService: ICityService,
  ) {}

  public async importOffers(offers: ParsedOffer[]): Promise<void> {
    try {
      // Подключаемся к БД (параметры берутся из переменных окружения через конфигурацию)
      await this.database.connect();
      this.logger.info('Начало импорта данных...');

      let importedCount = 0;
      let skippedCount = 0;

      for (const offerData of offers) {
        try {
          // Создаем или находим город
          let city = await this.cityService.findByName(offerData.city);
          
          if (!city) {
            city = await this.cityService.create({
              name: offerData.city,
              coordinates: {
                latitude: offerData.latitude,
                longitude: offerData.longitude,
              },
            });
            this.logger.debug(`Создан город: ${city.name}`);
          }

          // Создаем или находим пользователя
          let user = await this.userService.findByEmail(offerData.authorEmail);
          
          if (!user) {
            user = await this.userService.create({
              name: offerData.authorName,
              email: offerData.authorEmail,
              avatar: offerData.authorAvatar,
              type: offerData.authorType,
            });
            this.logger.debug(`Создан пользователь: ${user.email}`);
          }

          // Создаем предложение
          await this.offerService.create({
            title: offerData.title,
            description: offerData.description,
            date: new Date(offerData.date),
            city: offerData.city,
            preview: offerData.preview,
            images: offerData.images,
            isPremium: offerData.isPremium,
            isFavorite: offerData.isFavorite,
            rating: offerData.rating,
            type: offerData.type,
            bedrooms: offerData.bedrooms,
            guests: offerData.guests,
            price: offerData.price,
            amenities: offerData.amenities,
            authorId: user._id as Types.ObjectId,
            coordinates: {
              latitude: offerData.latitude,
              longitude: offerData.longitude,
            },
            commentCount: offerData.commentCount,
          });

          importedCount++;
        } catch (error) {
          this.logger.warn({ err: error }, `Ошибка при импорте предложения: ${offerData.title}`);
          skippedCount++;
        }
      }

      this.logger.info(`Импорт завершен. Импортировано: ${importedCount}, Пропущено: ${skippedCount}`);
    } catch (error) {
      this.logger.error({ err: error }, 'Ошибка при импорте данных');
      throw error;
    } finally {
      await this.database.disconnect();
    }
  }
}
