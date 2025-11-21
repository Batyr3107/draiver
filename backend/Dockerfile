# Multi-stage build для минимизации размера образа

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production && \
    npm cache clean --force

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Компилируем TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Устанавливаем dumb-init для правильной обработки сигналов
RUN apk add --no-cache dumb-init

# Создаем пользователя без прав root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копируем только необходимые файлы из builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Используем dumb-init для запуска приложения
ENTRYPOINT ["dumb-init", "--"]

# Запускаем приложение
CMD ["node", "dist/server.js"]
