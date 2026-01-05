# 👺 Полное руководство по тестированию

Данное руководство показывает, как тестировать API в 5+ полных способов.

---

## 🔢 Объекты для тестирования

### От "Six Cities" Апартамент

```json
{
  "title": "Beautiful 3 bedrooms apartment in center of Paris",
  "description": "Amazing and very cozy apartment in center of Paris",
  "city": "Paris",
  "preview": "https://16.design.htmlacademy.pro/static/hotel/1.jpg",
  "images": [
    "https://16.design.htmlacademy.pro/static/hotel/1.jpg",
    "https://16.design.htmlacademy.pro/static/hotel/2.jpg"
  ],
  "isPremium": false,
  "type": "apartment",
  "bedrooms": 3,
  "guests": 4,
  "price": 120,
  "amenities": ["WiFi", "Kitchen", "Washer", "Parking", "Air conditioning"],
  "coordinates": {
    "latitude": 48.85661,
    "longitude": 2.351499
  }
}
```

---

## ⚔️ Можности

- [📒 curl](#curl---встроенные-команды) - Встроенные команды
- [Postman](#postman---популярные-туль) - Популярные туль и среды
- [VS Code REST Client](#vs-code-rest-client) - Непосредственно в эдиторе
- [Jest](#jest---unit-тесты) - Автоматические тесты

---

## curl - Встроенные команды

### 1. Получить все предложения

```bash
curl -X GET http://localhost:3000/offers \
  -H "Content-Type: application/json" | jq
```

**Ожиданые коды:** `200` и массив объектов

### 2. Создать предложение

```bash
curl -X POST http://localhost:3000/offers \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful apartment",
    "description": "Amazing place",
    "city": "Paris",
    "preview": "https://via.placeholder.com/800x600",
    "images": ["https://via.placeholder.com/800x600"],
    "isPremium": false,
    "type": "apartment",
    "bedrooms": 2,
    "guests": 4,
    "price": 100,
    "amenities": ["WiFi"],
    "coordinates": {
      "latitude": 48.85661,
      "longitude": 2.351499
    }
  }' | jq
```

**Ожиданые коды:** `201` и созданный объект с `id`

### 3. Получить одно предложение

```bash
curl -X GET http://localhost:3000/offers/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" | jq
```

**Ожиданые коды:** `200` или `404` (если не найдено)

### 4. Обновить предложение

```bash
curl -X PUT http://localhost:3000/offers/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "price": 150
  }' | jq
```

**Ожиданые коды:** `200` и обновленные данные

### 5. Удалить предложение

```bash
curl -X DELETE http://localhost:3000/offers/507f1f77bcf86cd799439012
```

**Ожиданые коды:** `204` (нет содержимого)

### 6. Получить избранные

```bash
curl -X GET http://localhost:3000/favorites \
  -H "Content-Type: application/json" | jq
```

### 7. Отдельные варианты дома

```bash
# Все варианты дома
curl http://localhost:3000/options/house | jq

# Внести выбором
# Все отдельные варианты
curl http://localhost:3000/options/whole-house | jq
```

---

## Postman - Популярные туль

### Шаг 1: Группировка (Кратко)

1. Скачайте [Postman](https://www.postman.com/downloads/)
2. Откройте и нажмите "+" для создания нового запроса
3. Выберите `GET`, введите `http://localhost:3000/offers`
4. Нажмите "Send"

### Шаг 2: Группировка (Полные настройки)

**Requests:**

| Метод | URL | Тип | Body |
|--------|-----|-----|------|
| GET | `http://localhost:3000/offers` | - | - |
| POST | `http://localhost:3000/offers` | JSON | `{Объект}` |
| GET | `http://localhost:3000/offers/{id}` | - | - |
| PUT | `http://localhost:3000/offers/{id}` | JSON | `{Обновленные}` |
| DELETE | `http://localhost:3000/offers/{id}` | - | - |
| GET | `http://localhost:3000/favorites` | - | - |
| POST | `http://localhost:3000/favorites/{id}` | - | - |
| DELETE | `http://localhost:3000/favorites/{id}` | - | - |

---

## VS Code REST Client

### Установка

1. Установите расширение "REST Client" (humao.rest-client)
2. Создайте файл `api.http` в корне проекта
3. Добавьте снижу содержимое
4. Нажмите "Send Request" в каждым блоке

### api.http файл

```http
### Получить все предложения
GET http://localhost:3000/offers

### Создать предложение
POST http://localhost:3000/offers
Content-Type: application/json

{
  "title": "Beautiful apartment",
  "description": "Amazing place",
  "city": "Paris",
  "preview": "https://via.placeholder.com/800x600",
  "images": ["https://via.placeholder.com/800x600"],
  "isPremium": false,
  "type": "apartment",
  "bedrooms": 2,
  "guests": 4,
  "price": 100,
  "amenities": ["WiFi"],
  "coordinates": {
    "latitude": 48.85661,
    "longitude": 2.351499
  }
}

### Получить избранные
GET http://localhost:3000/favorites
```

---

## Jest - Unit тесты

### Установка

```bash
npm install --save-dev jest @types/jest ts-jest
```

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
};
```

### Пример теста

```typescript
// src/controllers/__tests__/offer.controller.test.ts
import request from 'supertest';
import app from '../../app';

describe('Offer Controller', () => {
  it('should return all offers', async () => {
    const response = await request(app)
      .get('/offers')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create a new offer', async () => {
    const newOffer = {
      title: 'Test Apartment',
      description: 'Test',
      city: 'Paris',
      preview: 'https://example.com/preview.jpg',
      images: ['https://example.com/img.jpg'],
      isPremium: false,
      type: 'apartment',
      bedrooms: 2,
      guests: 4,
      price: 100,
      amenities: ['WiFi'],
      coordinates: { latitude: 48.85661, longitude: 2.351499 }
    };

    const response = await request(app)
      .post('/offers')
      .send(newOffer)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
  });
});
```

### Запуск тестов

```bash
# Все тесты
npm test

# Открытые тесты
npm test -- --watch

# Покрытие
npm test -- --coverage
```

---

## ✅ Чек-лист тестирования

### Перед тестированием

- [ ] MongoDB запущена
- [ ] npm install выполнен
- [ ] npm run dev запущен
- [ ] Приложение на http://localhost:3000

### Основные тесты

- [ ] GET /offers (200) наверняет массив
- [ ] POST /offers (201) создает предложение
- [ ] POST /offers (400) для невалидных данных
- [ ] GET /offers/:id (200) для существующего
- [ ] GET /offers/:id (404) для несуществующего
- [ ] PUT /offers/:id (200) обновляет
- [ ] DELETE /offers/:id (204) удаляет
- [ ] GET /favorites (200) наверняет аррей

---

## 🔍 Ошибки и решения

### Ошибка: ECONNREFUSED
```bash
# MongoDB не запущена
docker run -d --name mongodb -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:latest
```

### Ошибка: Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Ошибка: Невалидные данные
Текущая ответственность апи, проверьте:
- Все поля заполнены
- Типы данных соответствуют
- Нормализация JSON

---

## 📚 Готовые команды

```bash
# Быстрые тесты
./QUICK_TEST.sh

# Отдельные endpoints
curl http://localhost:3000/offers
curl http://localhost:3000/options/house

# Unit тесты
npm test
```

---

**Нравится?** Проверьте **START_HERE.md** для быстрого старта! 🚀
