FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start command (для dev используется через docker-compose)
CMD ["npm", "run", "dev"]
