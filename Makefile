.PHONY: help build up down restart logs ps clean test migrate seed

# Default target
help:
	@echo "Draiver - Docker Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make logs-backend  - View backend logs only"
	@echo "  make logs-frontend - View frontend logs only"
	@echo "  make ps          - Show running containers"
	@echo "  make clean       - Remove all containers, volumes, and images"
	@echo "  make test        - Run backend tests"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with test data"
	@echo "  make shell-backend  - Open shell in backend container"
	@echo "  make shell-frontend - Open shell in frontend container"
	@echo "  make shell-db    - Open PostgreSQL shell"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Start all services with logs
up-logs:
	docker-compose up

# Stop all services
down:
	docker-compose down

# Restart all services
restart: down up

# View logs
logs:
	docker-compose logs -f

# Backend logs only
logs-backend:
	docker-compose logs -f backend

# Frontend logs only
logs-frontend:
	docker-compose logs -f frontend

# Show running containers
ps:
	docker-compose ps

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans

# Run backend tests
test:
	docker-compose exec backend npm test

# Run database migrations
migrate:
	docker-compose exec backend npx prisma migrate deploy

# Seed database
seed:
	docker-compose exec backend npm run seed

# Open shell in backend container
shell-backend:
	docker-compose exec backend sh

# Open shell in frontend container
shell-frontend:
	docker-compose exec frontend sh

# Open PostgreSQL shell
shell-db:
	docker-compose exec postgres psql -U draiver -d draiver

# Health check
health:
	@echo "Checking backend health..."
	@curl -f http://localhost:5000/health || echo "Backend is down"
	@echo "\nChecking frontend health..."
	@curl -f http://localhost:3000/ > /dev/null || echo "Frontend is down"

# Production deployment
deploy-prod:
	docker-compose --profile production up -d

# Development mode
dev:
	docker-compose -f docker-compose.dev.yml up
