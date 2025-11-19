# Draiver - Приложение для райдшеринга в Казахстане

Современное приложение для заказа поездок, похожее на Indriver, разработанное специально для казахстанского рынка.

## Особенности

- 🚗 Заказ поездок с возможностью торговаться о цене
- 👥 Отдельные интерфейсы для пассажиров и водителей
- 💰 Гибкая система ценообразования
- 🗺️ Интеграция с картами для построения маршрутов
- ⚡ Real-time обновления статуса поездки
- 💳 Множественные способы оплаты
- 🌐 Поддержка казахского и русского языков

## Технологический стек

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Socket.IO (WebSocket)
- JWT Authentication
- Prisma ORM

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand (управление состоянием)
- React Query
- Socket.IO Client

### Карты
- Leaflet / OpenStreetMap
- Геолокация HTML5

## Структура проекта

```
draiver/
├── backend/          # API сервер
├── frontend/         # Веб-приложение
├── mobile/           # Мобильное приложение (будущее)
└── shared/           # Общие типы и утилиты
```

## Начало работы

### Предварительные требования
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Установка

1. Клонируйте репозиторий
2. Установите зависимости для backend:
```bash
cd backend
npm install
```

3. Установите зависимости для frontend:
```bash
cd frontend
npm install
```

4. Настройте переменные окружения (см. `.env.example`)

5. Запустите миграции базы данных:
```bash
cd backend
npm run migrate
```

6. Запустите проект:
```bash
# Backend
cd backend
npm run dev

# Frontend (в новом терминале)
cd frontend
npm run dev
```

## Лицензия

MIT
