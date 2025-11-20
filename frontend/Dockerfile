FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Expose port
EXPOSE 3000

# Start command (для dev используется через docker-compose)
CMD ["npm", "run", "dev"]
