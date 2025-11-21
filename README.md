# 🚗 Draiver - Премиум Райдшеринг для Казахстана

<div align="center">

![Draiver Logo](https://via.placeholder.com/150x150?text=Draiver)

**Современное приложение для заказа поездок с инновационной системой торгов**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

[Особенности](#-особенности) • [Технологии](#-технологический-стек) • [Установка](#-быстрый-старт) • [Документация](#-документация) • [API](#-api-endpoints)

</div>

---

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Особенности](#-особенности)
- [Технологический стек](#-технологический-стек)
- [Архитектура](#-архитектура)
- [Быстрый старт](#-быстрый-старт)
- [Docker](#-docker-развертывание)
- [API Endpoints](#-api-endpoints)
- [Тестирование](#-тестирование)
- [Документация](#-документация)
- [Contributing](#-contributing)
- [Лицензия](#-лицензия)

---

## 🎯 О проекте

**Draiver** - это современное full-stack приложение для райдшеринга, разработанное специально для казахстанского рынка. Вдохновленное успехом InDriver, Draiver предлагает уникальную систему торгов, где пассажиры и водители могут договариваться о цене поездки в реальном времени.

### Почему Draiver?

- 🎨 **Премиум дизайн**: Современный градиентный интерфейс с purple-pink палитрой
- ⚡ **Real-time**: WebSocket для мгновенных обновлений статуса поездок
- 🗺️ **Yandex Maps**: Интеграция с лучшими картами для Казахстана
- 💰 **Гибкие цены**: Система торгов между пассажирами и водителями
- 🔐 **Безопасность**: JWT auth, RBAC, защита от XSS и SQL injection
- 📊 **Админ панель**: Полное управление платформой
- 🧪 **Тестирование**: 50+ юнит и интеграционных тестов

---

## ✨ Особенности

### Для пассажиров
- 📍 Заказ поездок с указанием точек A и B
- 💵 Предложение своей цены и получение контрпредложений
- 👀 Просмотр профилей водителей (рейтинг, отзывы, авто)
- 💬 Встроенный чат с водителем
- 🗺️ Отслеживание поездки в реальном времени
- ⭐ Система отзывов и рейтингов
- 🎁 Промокоды и скидки
- 🏆 Программа лояльности (Bronze → Silver → Gold → Platinum)

### Для водителей
- 📢 Получение уведомлений о новых заказах
- 💰 Возможность предлагать свою цену
- 📊 Статистика заработка и поездок
- 🚗 Управление профилем и автомобилем
- 📝 История поездок
- 💳 Чаевые от пассажиров
- 🏅 Система достижений

### Для администраторов
- 📊 Dashboard с real-time статистикой
- 👥 Управление пользователями (блокировка, изменение ролей)
- 🚕 Верификация водителей
- 🗺️ Мониторинг всех поездок
- 🎫 Создание и управление промокодами
- 📈 Аналитика платформы
- 🔔 Просмотр активности

### Премиум возможности
- 📧 Email уведомления (Nodemailer)
- 📱 SMS уведомления (SMSC.kz)
- 🔴 Redis кеширование
- 📝 Structured logging (Winston)
- 💳 Готовность к интеграции Kaspi.kz
- 🌍 Мультиязычность (KZ/RU/EN)

---

## 🛠 Технологический стек

<table>
<tr>
<td>

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5
- **Auth**: JWT + bcrypt
- **WebSocket**: Socket.IO
- **Cache**: Redis 7
- **Email**: Nodemailer
- **SMS**: SMSC.kz API
- **Logging**: Winston
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

</td>
<td>

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript 5
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **Maps**: Yandex Maps API
- **WebSocket**: Socket.IO Client
- **Forms**: React Hook Form
- **HTTP**: Fetch API
- **Icons**: Lucide React

</td>
</tr>
</table>

### DevOps & Infrastructure
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (готово)
- **Testing**: Jest + SuperTest
- **DB Migrations**: Prisma Migrate
- **Reverse Proxy**: Nginx (optional)
- **Process Manager**: PM2 (optional)

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 14 + React + TypeScript + Tailwind + Yandex Maps  │
│                    Port: 3000                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP REST API + WebSocket
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                         Backend                             │
│      Node.js + Express + TypeScript + Socket.IO            │
│                    Port: 5000                               │
├─────────────────────────────────────────────────────────────┤
│  Controllers │ Services │ Middleware │ Utils │ WebSocket   │
└─────┬──────────────┬──────────────┬────────────────────────┘
      │              │              │
      │              │              └─────────────┐
      │              │                            │
┌─────▼──────┐  ┌───▼──────┐  ┌──────────┐  ┌──▼──────┐
│ PostgreSQL │  │  Redis   │  │  SMTP    │  │ SMSC.kz │
│   (DB)     │  │ (Cache)  │  │ (Email)  │  │  (SMS)  │
│  Port 5432 │  │Port 6379 │  └──────────┘  └─────────┘
└────────────┘  └──────────┘
```

### Структура проекта

```
draiver/
├── backend/
│   ├── src/
│   │   ├── config/          # Конфигурация (DB, env)
│   │   ├── controllers/     # Контроллеры API
│   │   ├── middleware/      # Middleware (auth, validation, security)
│   │   ├── routes/          # Определение роутов
│   │   ├── services/        # Бизнес-логика (email, sms, redis)
│   │   ├── types/           # TypeScript типы
│   │   ├── utils/           # Утилиты (jwt, logger, distance)
│   │   ├── websocket/       # WebSocket handlers
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # DB схема (14 моделей)
│   │   └── migrations/      # DB миграции
│   ├── tests/               # Тесты (50+ tests)
│   │   ├── unit/           # Юнит-тесты
│   │   └── integration/    # Интеграционные тесты
│   ├── Dockerfile          # Production Docker image
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Админ панель (dashboard, users, drivers, rides, promo)
│   │   │   ├── driver/      # Дашборд водителя
│   │   │   ├── passenger/   # Дашборд пассажира
│   │   │   └── ride/        # Страница заказа поездки
│   │   ├── components/      # React компоненты
│   │   ├── hooks/           # Custom hooks (useSocket, useChat, useRideUpdates)
│   │   └── styles/          # Глобальные стили
│   ├── public/              # Статика
│   ├── Dockerfile          # Production Docker image
│   └── package.json
│
├── docker-compose.yml       # Orchestration (postgres, redis, backend, frontend)
├── Makefile                 # Docker commands (20+)
├── .env.example             # Environment variables template
└── README.md               # Эта документация
```

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 20.x или выше
- **PostgreSQL** 15.x или выше
- **Redis** 7.x или выше (опционально)
- **npm** или **yarn**
- **Docker** и **Docker Compose** (рекомендуется)

### Вариант 1: Docker (Рекомендуется) 🐳

Самый простой способ запустить проект:

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/yourusername/draiver.git
cd draiver

# 2. Скопируйте и настройте переменные окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками

# 3. Запустите все сервисы
make up
# или
docker-compose up -d

# 4. Запустите миграции БД
make migrate
# или
docker-compose exec backend npx prisma migrate deploy

# 5. (Опционально) Заполните тестовыми данными
make seed
# или
docker-compose exec backend npm run seed
```

Приложение будет доступно:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Вариант 2: Локальная установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/yourusername/draiver.git
cd draiver

# 2. Установите зависимости Backend
cd backend
npm install
cp .env.example .env
# Настройте .env

# 3. Запустите PostgreSQL и Redis (локально или Docker)
# Убедитесь, что PostgreSQL работает на порту 5432
# Убедитесь, что Redis работает на порту 6379

# 4. Запустите миграции
npm run migrate

# 5. Генерируйте Prisma Client
npm run prisma:generate

# 6. (Опционально) Заполните БД
npm run seed

# 7. Запустите backend
npm run dev
# Backend запущен на http://localhost:5000

# 8. В новом терминале установите Frontend
cd ../frontend
npm install
cp .env.example .env.local
# Настройте .env.local

# 9. Запустите frontend
npm run dev
# Frontend запущен на http://localhost:3000
```

---

## 🐳 Docker развертывание

### Makefile команды

```bash
# Сборка образов
make build

# Запуск всех сервисов
make up

# Остановка всех сервисов
make down

# Перезапуск
make restart

# Просмотр логов
make logs
make logs-backend
make logs-frontend

# Открыть shell в контейнерах
make shell-backend
make shell-frontend
make shell-db

# Запустить тесты
make test

# Health check
make health

# Полная очистка (удаление всех данных)
make clean
```

### Docker Compose профили

```bash
# Development mode
docker-compose up

# Production mode с Nginx
docker-compose --profile production up
```

---

## 📡 API Endpoints

### Аутентификация

```http
POST   /api/auth/register     # Регистрация
POST   /api/auth/login        # Вход
GET    /api/auth/profile      # Получение профиля (требует auth)
```

### Поездки

```http
GET    /api/rides             # Список поездок
POST   /api/rides             # Создание поездки
GET    /api/rides/:id         # Детали поездки
PUT    /api/rides/:id/status  # Обновление статуса
```

### Торги (Bids)

```http
GET    /api/bids              # Список торгов
POST   /api/bids              # Создание торга
PUT    /api/bids/:id/accept   # Принять торг
PUT    /api/bids/:id/reject   # Отклонить торг
```

### Водители

```http
GET    /api/drivers           # Список водителей
POST   /api/drivers/profile   # Создание профиля водителя
PUT    /api/drivers/profile   # Обновление профиля
PUT    /api/drivers/location  # Обновление местоположения
GET    /api/drivers/available # Доступные водители
```

### Отзывы

```http
GET    /api/reviews            # Список отзывов
POST   /api/reviews            # Создание отзыва
GET    /api/reviews/driver/:id # Отзывы водителя
GET    /api/reviews/stats/:id  # Статистика отзывов
```

### Админ (требует роль ADMIN)

```http
GET    /api/admin/stats         # Статистика платформы
GET    /api/admin/activity      # Последняя активность
GET    /api/admin/users         # Список пользователей
PUT    /api/admin/users/:id/block    # Блокировка пользователя
PUT    /api/admin/users/:id/role     # Изменение роли
GET    /api/admin/drivers       # Список водителей
PUT    /api/admin/drivers/:id/verify # Верификация водителя
GET    /api/admin/rides         # Список поездок
GET    /api/admin/rides/stats   # Статистика поездок
```

### Премиум функции

```http
POST   /api/promo-codes        # Создание промокода (admin)
POST   /api/promo-codes/apply  # Применение промокода
POST   /api/tips               # Оставить чаевые
GET    /api/achievements       # Получить достижения
POST   /api/chat/messages      # Отправить сообщение
GET    /api/notifications      # Получить уведомления
```

### WebSocket Events

```javascript
// Client -> Server
socket.emit('join-ride', { rideId });
socket.emit('update-location', { latitude, longitude });
socket.emit('send-message', { rideId, message });

// Server -> Client
socket.on('ride-updated', (ride) => {});
socket.on('new-bid', (bid) => {});
socket.on('driver-location', (location) => {});
socket.on('new-message', (message) => {});
```

**Полная документация API**: См. [API Documentation](./docs/API.md)

---

## 🧪 Тестирование

### Backend тесты

Проект включает 50+ тестов с покрытием 70%+:

```bash
# Все тесты с coverage
npm test

# Только юнит-тесты
npm run test:unit

# Только интеграционные тесты
npm run test:integration

# Watch mode
npm run test:watch

# В Docker
make test
```

### Структура тестов

```
tests/
├── unit/
│   └── utils/
│       ├── jwt.test.ts        # JWT токены (15+ тестов)
│       └── distance.test.ts   # Haversine formula (8+ тестов)
└── integration/
    ├── auth.test.ts           # Auth API (20+ тестов)
    └── admin.test.ts          # Admin API (25+ тестов)
```

### Coverage требования

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

**Подробнее**: См. [Testing Documentation](./backend/tests/README.md)

---

## 📚 Документация

### Для разработчиков
- [API Documentation](./docs/API.md) - Полное описание всех endpoints
- [Database Schema](./backend/prisma/schema.prisma) - Структура БД (14 моделей)
- [Testing Guide](./backend/tests/README.md) - Как писать и запускать тесты
- [WebSocket Events](./docs/WEBSOCKET.md) - Real-time события
- [Docker Guide](./docs/DOCKER.md) - Развертывание в Docker

### Для администраторов
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Environment Variables](./docs/ENV.md) - Настройка переменных окружения
- [Monitoring](./docs/MONITORING.md) - Мониторинг и логирование

### Database Schema

14 моделей:
```
User → DriverProfile → Ride → Bid → Review
PromoCode → Tip → Achievement → UserAchievement
Chat → Message → Notification → Location → LoyaltyProgram
```

**Диаграмма**: См. [Database ERD](./docs/ERD.png)

---

## 🔐 Безопасность

- ✅ **JWT Authentication** с refresh tokens
- ✅ **RBAC** (Role-Based Access Control)
- ✅ **Bcrypt** password hashing
- ✅ **Helmet** security headers
- ✅ **CORS** настроен
- ✅ **Rate Limiting** для API
- ✅ **XSS Protection** с санитизацией
- ✅ **SQL Injection** защита через Prisma
- ✅ **Non-root** Docker containers
- ✅ **Input Validation** с Zod

---

## 🌍 Переменные окружения

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/draiver

# JWT
JWT_SECRET=your-super-secret-key

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# SMS (SMSC.kz)
SMS_API_KEY=your-api-key
SMS_API_SECRET=your-api-secret

# Yandex Maps
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your-yandex-key
```

**Полный список**: См. [.env.example](./.env.example)

---

## 📊 Статистика проекта

### Кодовая база
- **Backend**: ~4,500 строк TypeScript
- **Frontend**: ~2,800 строк TypeScript + React
- **Tests**: ~1,000 строк тестов
- **Всего**: ~8,300+ строк кода

### Функциональность
- **API Endpoints**: 45+ REST endpoints
- **WebSocket Events**: 12+ real-time events
- **Database Models**: 14 моделей
- **Tests**: 50+ тестов
- **Pages**: 15+ страниц в frontend
- **Components**: 30+ React компонентов

### Production Ready
- ✅ Multi-stage Docker builds
- ✅ Health checks
- ✅ Structured logging
- ✅ Error handling
- ✅ Input validation
- ✅ Security best practices
- ✅ Automated tests
- ✅ CI/CD ready

---

## 🤝 Contributing

Мы приветствуем вклад в проект! Пожалуйста, следуйте этим шагам:

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Coding Standards
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- 70%+ test coverage

---

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для подробностей.

---

## 👥 Авторы

- **Ваше имя** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Благодарности

- InDriver за вдохновение
- Yandex за отличные карты для Казахстана
- Open source community за замечательные инструменты

---

## 📞 Контакты

- **Email**: support@draiver.kz
- **Telegram**: @draiver_support
- **Website**: https://draiver.kz

---

<div align="center">

**Made with ❤️ in Kazakhstan**

[⬆ Вернуться наверх](#-draiver---премиум-райдшеринг-для-казахстана)

</div>
