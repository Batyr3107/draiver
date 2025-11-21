import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';

describe('Auth API Integration Tests', () => {
  // Очистка тестовых данных после каждого теста
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          startsWith: '+77099', // Тестовые номера
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      phoneNumber: '+77099999001',
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'Тест',
      lastName: 'Пользователь',
      role: 'PASSENGER',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Регистрация успешна');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('phoneNumber', validUser.phoneNumber);
      expect(response.body.user).not.toHaveProperty('password'); // Пароль не должен возвращаться
    });

    it('should return 400 for missing required fields', async () => {
      const invalidUser = {
        phoneNumber: '+77099999002',
        // Отсутствуют остальные поля
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for duplicate phone number', async () => {
      // Регистрируем первый раз
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Пытаемся зарегистрировать второй раз
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('существует');
    });

    it('should return 400 for invalid phone number format', async () => {
      const invalidUser = {
        ...validUser,
        phoneNumber: 'invalid-phone',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should hash password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { phoneNumber: validUser.phoneNumber },
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe(validUser.password); // Пароль должен быть хеширован
      expect(user?.password).toMatch(/^\$2[aby]\$/); // Bcrypt hash pattern
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      phoneNumber: '+77099999003',
      email: 'login@example.com',
      password: 'SecurePassword123!',
      firstName: 'Логин',
      lastName: 'Тест',
      role: 'PASSENGER',
    };

    beforeEach(async () => {
      // Создаем пользователя для тестов логина
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testUser.phoneNumber,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Вход выполнен успешно');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testUser.phoneNumber,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Неверный');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+77099999999',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: testUser.phoneNumber,
          // Отсутствует password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    const testUser = {
      phoneNumber: '+77099999004',
      email: 'profile@example.com',
      password: 'SecurePassword123!',
      firstName: 'Профиль',
      lastName: 'Тест',
      role: 'PASSENGER',
    };

    let authToken: string;

    beforeEach(async () => {
      // Регистрируем и логинимся для получения токена
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      authToken = registerResponse.body.token;
    });

    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('phoneNumber', testUser.phoneNumber);
      expect(response.body).toHaveProperty('firstName', testUser.firstName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Токен не предоставлен');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Неверный токен');
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Role-based access', () => {
    it('should create DRIVER user with role', async () => {
      const driverUser = {
        phoneNumber: '+77099999005',
        email: 'driver@example.com',
        password: 'SecurePassword123!',
        firstName: 'Водитель',
        lastName: 'Тест',
        role: 'DRIVER',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(driverUser)
        .expect(201);

      expect(response.body.user).toHaveProperty('role', 'DRIVER');
    });

    it('should create ADMIN user with role', async () => {
      const adminUser = {
        phoneNumber: '+77099999006',
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        firstName: 'Админ',
        lastName: 'Тест',
        role: 'ADMIN',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminUser)
        .expect(201);

      expect(response.body.user).toHaveProperty('role', 'ADMIN');
    });
  });
});
