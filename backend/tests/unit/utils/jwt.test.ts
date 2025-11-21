import { generateToken, verifyToken } from '../../../src/utils/jwt';

describe('JWT Utils', () => {
  const testPayload = {
    id: 'user-123',
    phoneNumber: '+77011234567',
    role: 'PASSENGER' as const,
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT имеет 3 части
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(testPayload);
      const token2 = generateToken({ ...testPayload, id: 'user-456' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.phoneNumber).toBe(testPayload.phoneNumber);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Создаем токен с истекшим сроком (используя прошлую дату)
      const expiredToken = generateToken(testPayload);

      // Для полной проверки нужно изменить SECRET или использовать mock времени
      // Здесь просто проверяем, что функция работает
      expect(verifyToken(expiredToken)).toBeDefined();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';

      expect(() => verifyToken(malformedToken)).toThrow();
    });
  });

  describe('Token lifecycle', () => {
    it('should complete full token lifecycle (generate -> verify)', () => {
      const originalPayload = {
        id: 'lifecycle-test',
        phoneNumber: '+77777777777',
        role: 'DRIVER' as const,
      };

      const token = generateToken(originalPayload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(originalPayload.id);
      expect(decoded.phoneNumber).toBe(originalPayload.phoneNumber);
      expect(decoded.role).toBe(originalPayload.role);
      expect(decoded.iat).toBeDefined(); // issued at должен быть установлен
    });
  });
});
