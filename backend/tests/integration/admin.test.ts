import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let regularUserToken: string;
  let adminUserId: string;
  let regularUserId: string;

  // Создаем админа и обычного пользователя перед тестами
  beforeAll(async () => {
    // Создаем админа
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        phoneNumber: '+77099998001',
        email: 'admin@test.com',
        password: 'AdminPass123!',
        firstName: 'Админ',
        lastName: 'Тестовый',
        role: 'ADMIN',
      });

    adminToken = adminResponse.body.token;
    adminUserId = adminResponse.body.user.id;

    // Создаем обычного пользователя
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        phoneNumber: '+77099998002',
        email: 'user@test.com',
        password: 'UserPass123!',
        firstName: 'Юзер',
        lastName: 'Обычный',
        role: 'PASSENGER',
      });

    regularUserToken = userResponse.body.token;
    regularUserId = userResponse.body.user.id;
  });

  afterAll(async () => {
    // Очистка
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          startsWith: '+77099998',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/stats', () => {
    it('should get platform statistics with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/stats?timeRange=day')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalDrivers');
      expect(response.body.data).toHaveProperty('totalRides');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Доступ запрещен');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/admin/stats')
        .expect(401);
    });

    it('should support different time ranges', async () => {
      const timeRanges = ['day', 'week', 'month'];

      for (const timeRange of timeRanges) {
        const response = await request(app)
          .get(`/api/admin/stats?timeRange=${timeRange}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('timeRange', timeRange);
      }
    });
  });

  describe('GET /api/admin/activity', () => {
    it('should get recent activity', async () => {
      const response = await request(app)
        .get('/api/admin/activity?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/admin/activity?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get users list with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const adminUsers = response.body.data.users.filter((u: any) => u.role === 'ADMIN');
      expect(adminUsers.length).toBeGreaterThan(0);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Админ')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/admin/users/:id/block', () => {
    it('should block a user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isBlocked: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('isBlocked', true);

      // Проверяем в БД
      const user = await prisma.user.findUnique({
        where: { id: regularUserId },
      });
      expect(user?.isBlocked).toBe(true);
    });

    it('should unblock a user', async () => {
      // Сначала блокируем
      await request(app)
        .put(`/api/admin/users/${regularUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isBlocked: true });

      // Затем разблокируем
      const response = await request(app)
        .put(`/api/admin/users/${regularUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isBlocked: false })
        .expect(200);

      expect(response.body.data).toHaveProperty('isBlocked', false);
    });

    it('should not allow blocking self', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isBlocked: true })
        .expect(400);

      expect(response.body.error).toContain('самого себя');
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should change user role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'DRIVER' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('role', 'DRIVER');

      // Проверяем в БД
      const user = await prisma.user.findUnique({
        where: { id: regularUserId },
      });
      expect(user?.role).toBe('DRIVER');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'INVALID_ROLE' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not allow changing own role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'PASSENGER' })
        .expect(400);

      expect(response.body.error).toContain('самому себе');
    });

    it('should create driver profile when changing to DRIVER role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'DRIVER' })
        .expect(200);

      // Проверяем, что создан профиль водителя
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: regularUserId },
      });
      expect(driverProfile).toBeDefined();
    });
  });

  describe('GET /api/admin/drivers', () => {
    it('should get drivers list', async () => {
      const response = await request(app)
        .get('/api/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by verification status', async () => {
      const response = await request(app)
        .get('/api/admin/drivers?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/rides', () => {
    it('should get rides list', async () => {
      const response = await request(app)
        .get('/api/admin/rides')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter by ride status', async () => {
      const response = await request(app)
        .get('/api/admin/rides?status=COMPLETED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/rides/stats', () => {
    it('should get ride statistics', async () => {
      const response = await request(app)
        .get('/api/admin/rides/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('cancelled');
      expect(response.body.data).toHaveProperty('revenue');
    });
  });

  describe('Authorization checks', () => {
    it('should deny access to all admin endpoints without admin role', async () => {
      const endpoints = [
        '/api/admin/stats',
        '/api/admin/activity',
        '/api/admin/users',
        '/api/admin/drivers',
        '/api/admin/rides',
        '/api/admin/rides/stats',
      ];

      for (const endpoint of endpoints) {
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(403);
      }
    });
  });
});
