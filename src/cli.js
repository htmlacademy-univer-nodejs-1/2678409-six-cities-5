#!/usr/bin/env node

import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CITY_COORDINATES = [
  { name: 'Paris', latitude: 48.85661, longitude: 2.351499 },
  { name: 'Cologne', latitude: 50.938361, longitude: 6.959974 },
  { name: 'Brussels', latitude: 50.846557, longitude: 4.351697 },
  { name: 'Amsterdam', latitude: 52.370216, longitude: 4.895168 },
  { name: 'Hamburg', latitude: 53.550341, longitude: 10.000654 },
  { name: 'Dusseldorf', latitude: 51.225402, longitude: 6.776314 },
];

const HOUSING_TYPES = ['apartment', 'house', 'room', 'hotel'];
const AMENITIES = [
  'Breakfast',
  'Air conditioning',
  'Laptop friendly workspace',
  'Baby seat',
  'Washer',
  'Towels',
  'Fridge',
];

const Logger = {
  success(message) {
    console.log(chalk.green(`✓ ${message}`));
  },

  error(message) {
    console.error(chalk.red(`✗ ${message}`));
  },

  info(message) {
    console.log(chalk.blue(`ℹ ${message}`));
  },

  warning(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
  },

  log(message) {
    console.log(message);
  },

  header(message) {
    console.log(chalk.bold.cyan('\n═══════════════════════════════════════'));
    console.log(chalk.bold.cyan(`  ${message}`));
    console.log(chalk.bold.cyan('═══════════════════════════════════════\n'));
  },

  section(message) {
    console.log(chalk.bold.yellow(`\n▶ ${message}`));
  },

  list(items) {
    items.forEach((item) => {
      console.log(chalk.cyan(`  • ${item}`));
    });
  },

  count(label, count) {
    console.log(chalk.green(`  ${label}: ${count}`));
  },

  table(data) {
    console.log(chalk.gray('─'.repeat(70)));
    Object.entries(data).forEach(([key, value]) => {
      console.log(chalk.cyan(`  ${key.padEnd(20)}`), chalk.white(value));
    });
    console.log(chalk.gray('─'.repeat(70)));
  },
};

function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString()
    .split('T')[0];
}

const FileReader = {
  readTSV(filePath) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() !== '');

      if (lines.length < 2) {
        Logger.error('TSV файл должен содержать заголовок и как минимум одну строку данных');
        return [];
      }

      const headers = lines[0].split('\t');
      const offers = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const offer = this.parseOfferRow(headers, values);

        if (offer) {
          offers.push(offer);
        }
      }

      return offers;
    } catch (error) {
      Logger.error(`Ошибка при чтении файла: ${error.message}`);
      return [];
    }
  },

  parseOfferRow(headers, values) {
    try {
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      const cityName = rowData['city'];
      const cityCoords = CITY_COORDINATES.find((c) => c.name === cityName);

      if (!cityCoords) {
        Logger.warning(`Город "${cityName}" не найден в списке допустимых городов`);
        return null;
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
        type: rowData['type'],
        bedrooms: parseInt(rowData['bedrooms'], 10),
        guests: parseInt(rowData['guests'], 10),
        price: parseInt(rowData['price'], 10),
        amenities: amenities,
        authorId: generateId(),
        coordinates: {
          latitude: cityCoords.latitude,
          longitude: cityCoords.longitude,
        },
        commentCount: parseInt(rowData['commentCount'] || '0', 10),
      };
    } catch (error) {
      Logger.error(`Ошибка при парсинге строки: ${error.message}`);
      return null;
    }
  },
};

const DataGenerator = {
  generateOffers(count) {
    const offers = [];

    for (let i = 0; i < count; i++) {
      const city = getRandomElement(CITY_COORDINATES);
      const images = Array.from({ length: 6 }, () =>
        `https://images.unsplash.com/photo-${getRandomInt(1000000000, 9999999999)}`
      );

      const offer = {
        title: `Beautiful ${getRandomElement(HOUSING_TYPES)} in ${city.name}`,
        description: `Wonderful place to stay in ${city.name}. Perfect for travelers looking for authentic experience. Fully equipped with all necessary amenities.`,
        date: getRandomDate(),
        city: city.name,
        preview: images[0],
        images: images.join(','),
        isPremium: getRandomInt(0, 1) === 1,
        isFavorite: getRandomInt(0, 1) === 1,
        rating: (getRandomFloat(3.5, 5.0)).toFixed(1),
        type: getRandomElement(HOUSING_TYPES),
        bedrooms: getRandomInt(1, 8),
        guests: getRandomInt(1, 10),
        price: getRandomInt(50, 300),
        amenities: Array.from(
          { length: getRandomInt(2, 5) },
          () => getRandomElement(AMENITIES)
        )
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(','),
        commentCount: getRandomInt(0, 50),
      };

      offers.push(offer);
    }

    return offers;
  },

  generateTSV(offers) {
    const headers = [
      'title',
      'description',
      'date',
      'city',
      'preview',
      'images',
      'isPremium',
      'isFavorite',
      'rating',
      'type',
      'bedrooms',
      'guests',
      'price',
      'amenities',
      'authorName',
      'authorEmail',
      'authorAvatar',
      'authorType',
      'latitude',
      'longitude',
      'commentCount',
    ];

    const lines = [headers.join('\t')];

    offers.forEach((offer) => {
      const city = CITY_COORDINATES.find((c) => c.name === offer.city);
      const authorName = `User ${getRandomInt(1, 100)}`;
      const authorEmail = `user${getRandomInt(1, 100)}@example.com`;
      const authorType = getRandomInt(0, 1) === 1 ? 'pro' : 'normal';
      
      const values = [
        offer.title,
        offer.description,
        offer.date,
        offer.city,
        offer.preview,
        offer.images,
        offer.isPremium,
        offer.isFavorite,
        offer.rating,
        offer.type,
        offer.bedrooms,
        offer.guests,
        offer.price,
        offer.amenities,
        authorName,
        authorEmail,
        `https://api.example.com/avatars/${authorName.toLowerCase().replace(' ', '_')}.jpg`,
        authorType,
        city ? city.latitude.toString() : '0',
        city ? city.longitude.toString() : '0',
        offer.commentCount,
      ];
      lines.push(values.join('\t'));
    });

    return lines.join('\n');
  },
};

const CliCommand = {
  showHelp() {
    Logger.header('Six Cities CLI - Справка');

    Logger.log(chalk.bold('Программа для подготовки данных для REST API сервера.'));
    Logger.log('');
    Logger.log(`${chalk.bold('Пример:') } npm run cli <command> [arguments]`);
    Logger.log('');
    Logger.section('Команды:');

    const commands = [
      {
        command: '--version',
        description: 'выводит номер версии',
      },
      {
        command: '--help',
        description: 'печатает этот текст',
      },
      {
        command: '--import <path>',
        description: 'импортирует данные из TSV в MongoDB',
      },
      {
        command: '--generate <n> <path> <url>',
        description: 'генерирует произвольное количество тестовых данных',
      },
    ];

    commands.forEach(({ command, description }) => {
      Logger.log(chalk.cyan(`  ${command.padEnd(30)}`), chalk.white(description));
    });

    Logger.log('');
  },

  showVersion() {
    try {
      const packageJsonPath = join(__dirname, '../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const version = packageJson.version || '1.0.0';

      Logger.header('Информация о версии');
      Logger.success(`Версия приложения: ${version}`);
    } catch (error) {
      Logger.error('Не удалось получить информацию о версии');
    }
  },

  importData(filePath) {
    Logger.header('Импорт данных из TSV файла');

    if (!filePath) {
      Logger.error('Путь к файлу не указан');
      Logger.info('Использование: npm run cli --import <path>');
      return;
    }

    Logger.info(`Чтение файла: ${filePath}`);
    const offers = FileReader.readTSV(filePath);

    if (offers.length === 0) {
      Logger.warning('Файл не содержит данных или произошла ошибка при чтении');
      return;
    }

    Logger.section('Результаты импорта');
    Logger.count('Успешно импортировано предложений', offers.length);

    Logger.section('Детали предложений');

    offers.forEach((offer, index) => {
      console.log('');
      console.log(chalk.bold.blue(`Предложение #${index + 1}:`));
      console.log(chalk.gray('─'.repeat(70)));
      console.log(chalk.cyan('Заголовок:       '), chalk.white(offer.title));
      console.log(
        chalk.cyan('Описание:        '),
        chalk.white(`${offer.description.substring(0, 50) }...`)
      );
      console.log(chalk.cyan('Город:           '), chalk.yellow(offer.city));
      console.log(chalk.cyan('Цена:            '), chalk.green(`${offer.price}€`));
      console.log(chalk.cyan('Тип жилья:       '), chalk.magenta(offer.type));
      console.log(chalk.cyan('Спальни:         '), chalk.white(offer.bedrooms.toString()));
      console.log(chalk.cyan('Гости:           '), chalk.white(offer.guests.toString()));
      console.log(chalk.cyan('Рейтинг:         '), chalk.yellow(`${offer.rating} ⭐`));
      console.log(
        chalk.cyan('Премиум:         '),
        offer.isPremium ? chalk.green('✓ Да') : chalk.red('✗ Нет')
      );
      console.log(
        chalk.cyan('В избранном:     '),
        offer.isFavorite ? chalk.green('✓ Да') : chalk.red('✗ Нет')
      );
      console.log(chalk.cyan('Удобства:        '), chalk.cyan(offer.amenities.join(', ')));
      console.log(
        chalk.cyan('Фотографий:      '),
        chalk.white(offer.images.length.toString())
      );
      console.log(chalk.gray('─'.repeat(70)));
    });

    Logger.section('Статистика');
    const premiumCount = offers.filter((o) => o.isPremium).length;
    const avgPrice = Math.round(offers.reduce((sum, o) => sum + o.price, 0) / offers.length);
    const avgRating = (offers.reduce((sum, o) => sum + parseFloat(o.rating), 0) / offers.length).toFixed(1);

    console.log('');
    console.log(chalk.green(`  📊 Премиальных предложений: ${premiumCount}`));
    console.log(chalk.green(`  💰 Средняя цена: ${avgPrice}€`));
    console.log(chalk.green(`  ⭐ Средний рейтинг: ${avgRating}`));

    // Группировка по городам
    const cityCounts = {};
    offers.forEach((offer) => {
      cityCounts[offer.city] = (cityCounts[offer.city] || 0) + 1;
    });

    Logger.section('Распределение по городам');
    Object.entries(cityCounts).forEach(([city, count]) => {
      console.log(chalk.cyan(`  ${city.padEnd(15)}`), chalk.yellow(`${count} предложений`));
    });

    Logger.success('Импорт данных завершён успешно!');
    console.log('');
  },

  generateData(count, filePath, url) {
    Logger.header('Генерация тестовых данных');

    if (!count || !filePath || !url) {
      Logger.error('Не указаны все параметры');
      Logger.info('Использование: npm run cli --generate <n> <path> <url>');
      return;
    }

    const countNum = parseInt(count, 10);

    if (isNaN(countNum) || countNum <= 0) {
      Logger.error('Количество должно быть положительным числом');
      return;
    }

    Logger.info(`Генерирование ${countNum} предложений...`);

    const offers = DataGenerator.generateOffers(countNum);
    const tsvContent = DataGenerator.generateTSV(offers);

    try {
      writeFileSync(filePath, tsvContent, 'utf-8');
      Logger.success(`Файл успешно создан: ${filePath}`);

      Logger.section('Информация о генерированных данных');
      Logger.count('Всего предложений', offers.length);

      const premiumCount = offers.filter((o) => o.isPremium === 'true').length;
      const avgPrice = Math.round(
        offers.reduce((sum, o) => sum + o.price, 0) / offers.length
      );

      Logger.count('Премиальных предложений', premiumCount);
      Logger.count('Средняя цена', avgPrice);

      const cityCounts = {};
      offers.forEach((offer) => {
        cityCounts[offer.city] = (cityCounts[offer.city] || 0) + 1;
      });

      Logger.section('Распределение по городам');
      Object.entries(cityCounts).forEach(([city, count]) => {
        console.log(chalk.cyan(`  ${city.padEnd(15)}`), chalk.yellow(`${count} предложений`));
      });

      Logger.success('Генерация данных завершена успешно!');
      console.log('');
    } catch (error) {
      Logger.error(`Ошибка при сохранении файла: ${error.message}`);
    }
  },
};

function parseArguments(args) {
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const values = [];
      let j = i + 1;

      while (j < args.length && !args[j].startsWith('--')) {
        values.push(args[j]);
        j++;
      }

      parsed[key] =
        values.length === 0 ? 'true' : values.length === 1 ? values[0] : values;
      i = j - 1;
    }
  }

  return parsed;
}


function main() {
  const args = process.argv.slice(2);

  // Если нет аргументов, показываем справку
  if (args.length === 0) {
    CliCommand.showHelp();
    process.exit(0);
  }

  const parsedArgs = parseArguments(args);

  // Обработка команд
  if (parsedArgs['help'] !== undefined) {
    CliCommand.showHelp();
  } else if (parsedArgs['version'] !== undefined) {
    CliCommand.showVersion();
  } else if (parsedArgs['import'] !== undefined) {
    const filePath = Array.isArray(parsedArgs['import'])
      ? parsedArgs['import'][0]
      : parsedArgs['import'];

    // Используем TypeScript команду импорта
    // Параметры подключения к БД берутся из переменных окружения
    import('../dist/cli/import.command.js').then(({ importCommand }) => {
      importCommand(filePath).catch((error) => {
        console.error('Ошибка при импорте:', error);
        process.exit(1);
      });
    });
  } else if (parsedArgs['generate'] !== undefined) {
    const generateParams = Array.isArray(parsedArgs['generate'])
      ? parsedArgs['generate']
      : [parsedArgs['generate']];

    CliCommand.generateData(generateParams[0], generateParams[1], generateParams[2]);
  } else {
    console.log('Неизвестная команда. Используйте --help для справки');
    CliCommand.showHelp();
  }
}

// Запуск приложения
main();
