# Инструкция по установке и запуску Draiver

## Требования

- Node.js 18 или выше
- PostgreSQL 14 или выше
- npm или yarn

## Установка

### 1. Backend

```bash
cd backend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env

# Отредактируйте .env файл и укажите данные для подключения к PostgreSQL
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/draiver?schema=public"
# JWT_SECRET="ваш-секретный-ключ"
```

### 2. База данных

Создайте базу данных PostgreSQL:

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE draiver;

# Выйдите
\q
```

Запустите миграции Prisma:

```bash
cd backend

# Генерация Prisma Client
npx prisma generate

# Применение миграций
npx prisma migrate dev --name init
```

### 3. Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env.local

# Файл .env.local должен содержать:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Запуск

### Запуск Backend

```bash
cd backend
npm run dev
```

Backend будет доступен на `http://localhost:5000`

### Запуск Frontend

```bash
cd frontend
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Использование

### Регистрация

1. Откройте `http://localhost:3000`
2. Перейдите на страницу регистрации
3. Заполните форму:
   - Имя и фамилия
   - Номер телефона (формат: +77001234567)
   - Email (необязательно)
   - Пароль
   - Выберите роль: Пассажир или Водитель

### Для водителей

После регистрации как водитель:
1. Создайте профиль водителя с информацией об автомобиле
2. Включите статус "Доступен"
3. Просматривайте активные заказы
4. Делайте предложения с желаемой ценой
5. Ожидайте принятия предложения пассажиром

### Для пассажиров

После регистрации как пассажир:
1. Создайте новый заказ, указав:
   - Адрес подачи
   - Адрес назначения
   - Желаемую цену (необязательно)
2. Ожидайте предложений от водителей
3. Просматривайте предложения и выбирайте лучшее
4. Примите предложение водителя

## API Документация

### Endpoints

#### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/profile` - Получение профиля (требует токен)

#### Поездки
- `POST /api/rides` - Создание заказа
- `GET /api/rides/active` - Активные заказы
- `GET /api/rides/my-rides` - Мои поездки
- `GET /api/rides/:id` - Детали поездки
- `PATCH /api/rides/:id/status` - Обновление статуса
- `PATCH /api/rides/:id/cancel` - Отмена поездки

#### Предложения
- `POST /api/bids` - Создание предложения (только водители)
- `POST /api/bids/:bidId/accept` - Принятие предложения
- `GET /api/bids/ride/:rideId` - Предложения для поездки
- `DELETE /api/bids/:bidId` - Удаление предложения

#### Водители
- `POST /api/drivers/profile` - Создание профиля водителя
- `GET /api/drivers/profile` - Получение профиля
- `PATCH /api/drivers/profile` - Обновление профиля
- `PATCH /api/drivers/availability` - Переключение доступности
- `PATCH /api/drivers/location` - Обновление местоположения
- `GET /api/drivers/nearby` - Поиск ближайших водителей

## WebSocket Events

### Для пассажиров
- `bidReceived` - Новое предложение от водителя

### Для водителей
- `bidAcceptedNotification` - Предложение принято

### Общие
- `rideStatusChanged` - Изменение статуса поездки
- `driverLocationUpdate` - Обновление местоположения водителя

## Структура проекта

```
draiver/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Контроллеры
│   │   ├── routes/         # Маршруты
│   │   ├── middleware/     # Middleware
│   │   ├── config/         # Конфигурация
│   │   ├── types/          # TypeScript типы
│   │   └── utils/          # Утилиты
│   ├── prisma/
│   │   └── schema.prisma   # Схема БД
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js страницы
│   │   ├── components/    # React компоненты
│   │   ├── services/      # API сервисы
│   │   ├── store/         # Zustand хранилища
│   │   ├── types/         # TypeScript типы
│   │   └── styles/        # Стили
│   └── package.json
│
└── README.md
```

## Troubleshooting

### Ошибки подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env
- Убедитесь, что база данных создана

### CORS ошибки
- Проверьте, что FRONTEND_URL в backend/.env совпадает с адресом frontend
- Убедитесь, что backend запущен на порту 5000

### WebSocket не подключается
- Проверьте NEXT_PUBLIC_SOCKET_URL в frontend/.env.local
- Убедитесь, что backend запущен

## Дальнейшее развитие

Планируемые функции:
- Интеграция с реальными картами (Google Maps / Яндекс.Карты)
- Система оплаты (Kaspi, Halyk)
- Рейтинговая система и отзывы
- Push-уведомления
- Мобильное приложение (React Native)
- История поездок и аналитика
- Система промокодов
- Поддержка нескольких языков (каз/рус/англ)
