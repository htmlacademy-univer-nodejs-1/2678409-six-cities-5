import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { container, TYPES } from '../core/container.js';
import { ImportService } from './import.service.js';
import { Logger } from 'pino';

const CITY_COORDINATES = [
  { name: 'Paris', latitude: 48.85661, longitude: 2.351499 },
  { name: 'Cologne', latitude: 50.938361, longitude: 6.959974 },
  { name: 'Brussels', latitude: 50.846557, longitude: 4.351697 },
  { name: 'Amsterdam', latitude: 52.370216, longitude: 4.895168 },
  { name: 'Hamburg', latitude: 53.550341, longitude: 10.000654 },
  { name: 'Dusseldorf', latitude: 51.225402, longitude: 6.776314 },
];

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

function readTSV(filePath: string): ParsedOffer[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error('TSV файл должен содержать заголовок и как минимум одну строку данных');
    }

    const headers = lines[0].split('\t');
    const offers: ParsedOffer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const offer = parseOfferRow(headers, values);

      if (offer) {
        offers.push(offer);
      }
    }

    return offers;
  } catch (error) {
    throw new Error(`Ошибка при чтении файла: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseOfferRow(headers: string[], values: string[]): ParsedOffer | null {
  try {
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    const cityName = rowData['city'];
    const cityCoords = CITY_COORDINATES.find((c) => c.name === cityName);

    if (!cityCoords) {
      throw new Error(`Город "${cityName}" не найден в списке допустимых городов`);
    }

    const images = rowData['images']
      .split(',')
      .map((img) => img.trim())
      .filter((img) => img.length > 0);

    const amenities = rowData['amenities']
      .split(',')
      .map((amenity) => amenity.trim())
      .filter((amenity) => amenity.length > 0);

    return {
      title: rowData['title'],
      description: rowData['description'],
      date: rowData['date'],
      city: cityName,
      preview: rowData['preview'],
      images: images.slice(0, 6),
      isPremium: rowData['isPremium'] === 'true',
      isFavorite: rowData['isFavorite'] === 'true',
      rating: parseFloat(rowData['rating']),
      type: rowData['type'] as 'apartment' | 'house' | 'room' | 'hotel',
      bedrooms: parseInt(rowData['bedrooms'], 10),
      guests: parseInt(rowData['guests'], 10),
      price: parseInt(rowData['price'], 10),
      amenities: amenities,
      authorName: rowData['authorName'] || '',
      authorEmail: rowData['authorEmail'] || '',
      authorAvatar: rowData['authorAvatar'] || undefined,
      authorType: (rowData['authorType'] || 'normal') as 'pro' | 'normal',
      latitude: parseFloat(rowData['latitude']) || cityCoords.latitude,
      longitude: parseFloat(rowData['longitude']) || cityCoords.longitude,
      commentCount: parseInt(rowData['commentCount'] || '0', 10),
    };
  } catch (error) {
    throw new Error(`Ошибка при парсинге строки: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function importCommand(filePath: string): Promise<void> {
  const logger = container.get<Logger>(TYPES.Logger);
  const importService = container.get<ImportService>(TYPES.ImportService);

  logger.info('Импорт данных из TSV файла');
  logger.info(`Чтение файла: ${filePath}`);

  try {
    const offers = readTSV(filePath);

    if (offers.length === 0) {
      logger.warn('Файл не содержит данных');
      return;
    }

    logger.info(`Найдено предложений: ${offers.length}`);
    // Параметры подключения к БД берутся из переменных окружения через конфигурацию
    await importService.importOffers(offers);
    logger.info('Импорт данных завершён успешно!');
  } catch (error) {
    logger.error({ err: error }, 'Ошибка при импорте данных');
    process.exit(1);
  }
}
