FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Компилируем TypeScript
RUN npm run build

# Открываем порт
EXPOSE 5000

# Запускаем миграции и приложение
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
