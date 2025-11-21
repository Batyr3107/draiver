/**
 * Jest Setup
 * Настройка тестового окружения
 */

// Мокируем переменные окружения для тестов
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.PORT = '5001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/draiver_test';

// Увеличиваем timeout для асинхронных операций
jest.setTimeout(10000);

// Глобальные моки
global.console = {
  ...console,
  error: jest.fn(), // Подавляем error логи в тестах
  warn: jest.fn(),  // Подавляем warning логи в тестах
};

// Очистка после всех тестов
afterAll(async () => {
  // Закрываем все соединения
  await new Promise((resolve) => setTimeout(resolve, 500));
});
