# CI/CD Pipeline Documentation

Комплексная система Continuous Integration и Continuous Deployment для Draiver.

## Обзор

GitHub Actions workflows автоматизируют:
- ✅ Тестирование кода
- ✅ Линтинг и проверку типов
- ✅ Сборку Docker образов
- ✅ Скан безопасности
- ✅ Деплой на staging/production
- ✅ Обновление зависимостей

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Триггеры**:
- Push в ветки: `main`, `develop`, `claude/**`
- Pull requests в: `main`, `develop`

**Jobs**:

#### Backend Test
- Запускает PostgreSQL 15 и Redis 7
- Устанавливает Node.js 20
- Устанавливает зависимости (`npm ci`)
- Генерирует Prisma Client
- Выполняет миграции БД
- Запускает тесты
- Загружает coverage в Codecov

#### Backend Lint
- ESLint проверка
- TypeScript type checking

#### Frontend Test
- Устанавливает зависимости
- Запускает тесты
- Собирает production build

#### Frontend Lint
- ESLint проверка
- TypeScript type checking

#### Docker Build
- Тестовая сборка backend Docker image
- Тестовая сборка frontend Docker image
- Использует GitHub Actions cache

#### Security Scan
- Trivy сканирование уязвимостей
- Загружает результаты в GitHub Security

### 2. CD Pipeline (`cd.yml`)

**Триггеры**:
- Push в `main` → деплой на staging
- Push тега `v*` → деплой на production

**Jobs**:

#### Build & Push
- Логин в GitHub Container Registry
- Сборка и push backend Docker image
- Сборка и push frontend Docker image
- Теги: branch name, semver, sha

#### Deploy Staging
- SSH деплой на staging сервер
- `docker-compose pull`
- `docker-compose up -d`
- Выполнение миграций Prisma
- Health check

#### Deploy Production
- SSH деплой на production сервер
- `docker-compose pull`
- `docker-compose up -d`
- Выполнение миграций Prisma
- Health check
- Уведомление в Slack

### 3. Dependabot (`dependabot.yml`)

**Автоматические обновления**:
- Backend npm зависимости (еженедельно, понедельник)
- Frontend npm зависимости (еженедельно, понедельник)
- Docker base images (еженедельно)
- GitHub Actions versions (еженедельно)

**Настройки**:
- Max 10 open PRs одновременно
- Auto-assign reviewer: Batyr3107
- Labels: dependencies, backend/frontend/docker/github-actions

## Переменные окружения

### CI Tests

```yaml
NODE_ENV: test
DATABASE_URL: postgresql://draiver_test:test_password@localhost:5432/draiver_test
JWT_SECRET: test-jwt-secret-key
REDIS_URL: redis://localhost:6379
```

### CD Build

Frontend build args:
```yaml
NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
NEXT_PUBLIC_WS_URL: ${{ secrets.NEXT_PUBLIC_WS_URL }}
```

## GitHub Secrets

### Обязательные для CD

#### Staging
- `STAGING_HOST` - IP или домен staging сервера
- `STAGING_USER` - SSH пользователь
- `STAGING_SSH_KEY` - SSH приватный ключ

#### Production
- `PRODUCTION_HOST` - IP или домен production сервера
- `PRODUCTION_USER` - SSH пользователь
- `PRODUCTION_SSH_KEY` - SSH приватный ключ

#### Frontend Environment
- `NEXT_PUBLIC_API_URL` - URL Backend API
- `NEXT_PUBLIC_WS_URL` - URL WebSocket сервера

#### Notifications (опционально)
- `SLACK_WEBHOOK` - Webhook для уведомлений в Slack

### Как добавить secrets

```bash
# В GitHub репозитории:
Settings → Secrets and variables → Actions → New repository secret

# Или через GitHub CLI:
gh secret set STAGING_HOST --body "staging.draiver.kz"
gh secret set STAGING_USER --body "deploy"
gh secret set STAGING_SSH_KEY < ~/.ssh/staging_key
```

## Deployment процесс

### Staging Deployment

1. **Пуш в main**:
   ```bash
   git push origin main
   ```

2. **Автоматически**:
   - CI проверки (tests, lint, build)
   - Docker build & push
   - SSH подключение к staging
   - Pull последних образов
   - Перезапуск контейнеров
   - Миграции БД
   - Health check

3. **Проверка**:
   ```bash
   curl https://staging.draiver.kz/health
   ```

### Production Deployment

1. **Создание release tag**:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Автоматически**:
   - CI проверки
   - Docker build & push с тегом v1.0.0
   - SSH подключение к production
   - Pull образов с тегом
   - Перезапуск контейнеров
   - Миграции БД
   - Health check
   - Уведомление в Slack

3. **Проверка**:
   ```bash
   curl https://draiver.kz/health
   ```

## Server Setup

### Требования

- Ubuntu 20.04 LTS или новее
- Docker 24.0+
- Docker Compose 2.20+
- SSH доступ

### Подготовка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo apt update
sudo apt install docker-compose-plugin

# Создание директории приложения
sudo mkdir -p /opt/draiver
sudo chown $USER:$USER /opt/draiver

# Клонирование репозитория
cd /opt/draiver
git clone https://github.com/Batyr3107/draiver.git .

# Создание .env файла
cp .env.example .env
nano .env  # Заполнить production значения
```

### SSH Key Setup

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/draiver_deploy

# Копирование публичного ключа на сервер
ssh-copy-id -i ~/.ssh/draiver_deploy.pub user@staging.draiver.kz
ssh-copy-id -i ~/.ssh/draiver_deploy.pub user@draiver.kz

# Добавление приватного ключа в GitHub Secrets
cat ~/.ssh/draiver_deploy | pbcopy  # macOS
cat ~/.ssh/draiver_deploy | xclip   # Linux
# Вставить в GitHub Settings → Secrets
```

## Мониторинг

### GitHub Actions Dashboard

```
https://github.com/Batyr3107/draiver/actions
```

- Статус всех workflows
- История запусков
- Логи выполнения
- Артефакты

### CI/CD Badge

Добавьте в README.md:

```markdown
![CI](https://github.com/Batyr3107/draiver/workflows/CI%20Pipeline/badge.svg)
![CD](https://github.com/Batyr3107/draiver/workflows/CD%20Pipeline/badge.svg)
```

### Codecov Badge

```markdown
[![codecov](https://codecov.io/gh/Batyr3107/draiver/branch/main/graph/badge.svg)](https://codecov.io/gh/Batyr3107/draiver)
```

## Troubleshooting

### CI Tests Failing

**Problem**: Tests fail в CI, но проходят локально

**Solution**:
1. Проверьте версии Node.js (должна быть 20)
2. Проверьте DATABASE_URL в workflow
3. Убедитесь что PostgreSQL service запущен
4. Проверьте migration файлы

### Docker Build Fails

**Problem**: Docker build timeout или out of memory

**Solution**:
1. Оптимизируйте Dockerfile (multi-stage build)
2. Используйте .dockerignore
3. Включите BuildKit cache
4. Проверьте размер context

### SSH Deployment Fails

**Problem**: SSH подключение не удается

**Solution**:
1. Проверьте SSH_KEY в secrets
2. Проверьте права на ключ (должны быть 600)
3. Проверьте HOST и USER в secrets
4. Убедитесь что firewall разрешает SSH

### Health Check Fails

**Problem**: Health check endpoint не отвечает после деплоя

**Solution**:
1. Увеличьте sleep время перед проверкой
2. Проверьте логи контейнеров: `docker-compose logs`
3. Проверьте что все сервисы запущены: `docker-compose ps`
4. Проверьте миграции БД

## Best Practices

### Branch Strategy

```
main         → production (через tags)
develop      → staging (автоматически)
feature/*    → PR в develop
hotfix/*     → PR в main
claude/**    → AI development branches
```

### Commit Messages

```bash
# Good
git commit -m "✨ Add user authentication"
git commit -m "🐛 Fix login bug"
git commit -m "📝 Update API docs"

# Bad
git commit -m "fix stuff"
git commit -m "wip"
```

### Versioning

Используйте semantic versioning:
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.1.1` - Patch release (bug fixes)

### Testing

- Минимальное coverage: 70%
- Все новые features должны иметь тесты
- CI должен пройти перед merge

### Security

- Никогда не коммитьте secrets
- Используйте GitHub Secrets для чувствительных данных
- Регулярно обновляйте зависимости (Dependabot)
- Проверяйте Trivy scan результаты

## Manual Operations

### Rollback

```bash
# На сервере
cd /opt/draiver
docker-compose down
git checkout v1.0.0  # предыдущая версия
docker-compose pull
docker-compose up -d
```

### Database Rollback

```bash
# Откат последней миграции
docker-compose exec backend npx prisma migrate resolve --rolled-back migration_name
```

### View Logs

```bash
# Все логи
docker-compose logs

# Backend only
docker-compose logs -f backend

# Последние 100 строк
docker-compose logs --tail 100
```

### Manual Deploy

```bash
# Без GitHub Actions
ssh user@draiver.kz
cd /opt/draiver
git pull
docker-compose build
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## Performance

### Build Time Optimization

- ✅ Используется BuildKit cache
- ✅ Multi-stage Docker builds
- ✅ npm ci вместо npm install
- ✅ Параллельные jobs

**Типичное время**:
- CI Pipeline: 5-7 минут
- Docker Build: 3-5 минут
- Deployment: 2-3 минуты

### Cache Strategy

```yaml
# Node.js dependencies cache
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json

# Docker layers cache
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Future Improvements

⏳ **TODO**:
- [ ] E2E тесты (Playwright/Cypress)
- [ ] Performance testing (k6)
- [ ] Blue-Green deployment
- [ ] Canary releases
- [ ] Database backup перед миграциями
- [ ] Automatic rollback при health check failure
- [ ] Multi-region deployment
- [ ] CDN integration для static assets

## Support

**Issues**: https://github.com/Batyr3107/draiver/issues
**Discussions**: https://github.com/Batyr3107/draiver/discussions
