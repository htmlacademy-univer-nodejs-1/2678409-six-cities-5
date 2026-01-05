#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логи
echo -e "${BLUE}====================================="
echo -e "  🚀 QUICK TEST для проекта"
echo -e "=====================================${NC}\n"

# Проверка подключения
echo -e "${YELLOW}[1] Проверяю соединение...${NC}"
if ! curl -s http://localhost:3000/offers > /dev/null; then
    echo -e "${RED}✗ Ошибка: API не на http://localhost:3000${NC}"
    echo -e "${YELLOW}Пожалуйста, запустите: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API доступна${NC}"

# Проверка GET /offers
echo -e "\n${YELLOW}[2] Тест: GET /offers${NC}"
RESPONSE=$(curl -s http://localhost:3000/offers)
if echo "$RESPONSE" | grep -q '\['; then
    echo -e "${GREEN}✓ GET /offers работает${NC}"
else
    echo -e "${RED}✗ Неверный ответ${NC}"
fi

# Проверка POST /offers
echo -e "\n${YELLOW}[3] Тест: POST /offers${NC}"
NEW_OFFER=$(curl -s -X POST http://localhost:3000/offers \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Apartment",
    "description": "Test description",
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
  }')

if echo "$NEW_OFFER" | grep -q 'title'; then
    echo -e "${GREEN}✓ POST /offers работает${NC}"
    # Использую тестовое ID для дальнейших тестов
    TEST_ID=$(echo "$NEW_OFFER" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
    if [ -z "$TEST_ID" ]; then
        TEST_ID=$(echo "$NEW_OFFER" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
else
    echo -e "${RED}✗ Неверный ответ${NC}"
    TEST_ID="507f1f77bcf86cd799439012" # Тестовые ID 
    echo "$NEW_OFFER"
fi

# Проверка GET /offers/{id}
echo -e "\n${YELLOW}[4] Тест: GET /offers/{id}${NC}"
if [ -n "$TEST_ID" ]; then
    GET_SINGLE=$(curl -s http://localhost:3000/offers/$TEST_ID)
    if echo "$GET_SINGLE" | grep -q 'title'; then
        echo -e "${GREEN}✓ GET /offers/{id} работает${NC}"
    else
        echo -e "${RED}✗ Не найдено предложение${NC}"
    fi
else
    echo -e "${RED}✗ Нет ID для теста${NC}"
fi

# Проверка GET /favorites
echo -e "\n${YELLOW}[5] Тест: GET /favorites${NC}"
FAV=$(curl -s http://localhost:3000/favorites)
if echo "$FAV" | grep -q '\['; then
    echo -e "${GREEN}✓ GET /favorites работает${NC}"
else
    echo -e "${RED}✗ Неверный ответ${NC}"
fi

# Итого
echo -e "\n${BLUE}====================================="
echo -e "  ✨ Краткое тестирование завершено"
echo -e "=====================================${NC}"
echo -e "\n${GREEN}Основные endpoints на месте! 🚀${NC}\n"
