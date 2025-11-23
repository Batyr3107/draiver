# Multi-stage build для Next.js приложения

# Stage 1: Dependencies
FROM node:25-alpine AS deps

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci && \
    npm cache clean --force

# Stage 2: Builder
FROM node:25-alpine AS builder

WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходники
COPY . .

# Устанавливаем переменные окружения для build
ENV NEXT_TELEMETRY_DISABLED 1

# Собираем приложение
RUN npm run build

# Stage 3: Production
FROM node:25-alpine AS runner

WORKDIR /app

# Создаем пользователя без прав root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Копируем .next folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем приложение
CMD ["node", "server.js"]
