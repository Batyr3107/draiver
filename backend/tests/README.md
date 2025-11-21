# 🧪 Draiver Backend Tests

Комплексный набор тестов для backend API приложения Draiver.

## 📁 Структура

```
tests/
├── setup.ts                    # Настройка тестового окружения
├── unit/                       # Юнит-тесты
│   └── utils/
│       ├── jwt.test.ts        # Тесты JWT утилит
│       └── distance.test.ts   # Тесты вычисления расстояния
└── integration/                # Интеграционные тесты
    ├── auth.test.ts           # Тесты auth API
    └── admin.test.ts          # Тесты admin API
```

## 🚀 Запуск тестов

### Установка зависимостей
```bash
npm install
```

### Запуск всех тестов
```bash
npm test
```

### Запуск с coverage
```bash
npm test -- --coverage
```

### Запуск только юнит-тестов
```bash
npm run test:unit
```

### Запуск только интеграционных тестов
```bash
npm run test:integration
```

### Watch mode (для разработки)
```bash
npm run test:watch
```

## 📊 Coverage

Минимальные требования к покрытию кода:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🧪 Типы тестов

### Unit Tests
Тестируют отдельные функции и утилиты в изоляции:
- JWT генерация и валидация
- Вычисление расстояний (Haversine formula)
- Валидация данных

### Integration Tests
Тестируют API endpoints с реальными HTTP запросами:
- Auth API (регистрация, логин, профиль)
- Admin API (статистика, управление пользователями, водителями, поездками)
- Role-based access control

## 🗄️ Тестовая база данных

Для интеграционных тестов используется отдельная тестовая БД:
```
DATABASE_URL=postgresql://test:test@localhost:5432/draiver_test
```

### Настройка тестовой БД
```bash
# Создание тестовой БД
createdb draiver_test

# Запуск миграций
DATABASE_URL=postgresql://test:test@localhost:5432/draiver_test npx prisma migrate dev
```

## 📝 Написание тестов

### Пример юнит-теста
```typescript
describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Пример интеграционного теста
```typescript
describe('POST /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(data)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

## 🔧 Конфигурация

Конфигурация Jest находится в `jest.config.js`:
- Preset: `ts-jest` для TypeScript
- Test environment: `node`
- Coverage thresholds: 70%
- Setup file: `tests/setup.ts`

## 🐛 Debugging

Для отладки тестов:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Затем откройте `chrome://inspect` в Chrome.

## 📚 Дополнительная информация

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [SuperTest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Jest Guide](https://kulshekhar.github.io/ts-jest/)

## ✅ Best Practices

1. **Изоляция**: Каждый тест должен быть независимым
2. **Очистка**: Используйте `afterEach` для очистки данных
3. **Моки**: Мокируйте внешние зависимости
4. **Названия**: Используйте описательные названия тестов
5. **AAA pattern**: Arrange, Act, Assert

```typescript
it('should do something', () => {
  // Arrange - подготовка
  const input = setupInput();

  // Act - действие
  const result = functionToTest(input);

  // Assert - проверка
  expect(result).toBe(expected);
});
```
