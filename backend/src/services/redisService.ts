import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

/**
 * Redis Service для кэширования
 * Используется для:
 * - Кэширование часто запрашиваемых данных
 * - Хранение сессий
 * - Rate limiting
 * - Очереди задач
 */
class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Инициализация Redis клиента
   */
  private async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Too many reconnection attempts');
              return new Error('Redis reconnection failed');
            }
            // Экспоненциальная задержка: 50ms, 100ms, 200ms, ...
            return Math.min(retries * 50, 3000);
          },
        },
      });

      // Обработчики событий
      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err, { service: 'redis' });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Connected and ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: Reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('❌ Redis: Connection closed');
        this.isConnected = false;
      });

      // Подключение
      await this.client.connect();
    } catch (error) {
      logger.error('Redis initialization failed', error as Error, { service: 'redis' });
      this.client = null;
    }
  }

  /**
   * Получение значения из кэша
   */
  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available for GET operation');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      // Попытка парсить JSON
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(`Redis GET error for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Установка значения в кэш
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available for SET operation');
      return false;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }

      return true;
    } catch (error) {
      logger.error(`Redis SET error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Удаление ключа
   */
  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Удаление нескольких ключей по паттерну
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error(`Redis DEL pattern error for: ${pattern}`, error as Error);
      return 0;
    }
  }

  /**
   * Проверка существования ключа
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Установка TTL для ключа
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Инкремент значения (для счетчиков)
   */
  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key: ${key}`, error as Error);
      return 0;
    }
  }

  /**
   * Декремент значения
   */
  async decr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error(`Redis DECR error for key: ${key}`, error as Error);
      return 0;
    }
  }

  /**
   * Работа с хэшами (для объектов)
   */
  async hSet(key: string, field: string, value: any): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, stringValue);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for key: ${key}`, error as Error);
      return false;
    }
  }

  async hGet<T = string>(key: string, field: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.hGet(key, field);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(`Redis HGET error for key: ${key}`, error as Error);
      return null;
    }
  }

  async hGetAll<T = Record<string, string>>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.hGetAll(key);
      return value as T;
    } catch (error) {
      logger.error(`Redis HGETALL error for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Работа со списками (для очередей)
   */
  async lPush(key: string, ...values: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      logger.error(`Redis LPUSH error for key: ${key}`, error as Error);
      return 0;
    }
  }

  async rPop(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.rPop(key);
    } catch (error) {
      logger.error(`Redis RPOP error for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Закрытие подключения
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('👋 Redis: Disconnected');
    }
  }

  /**
   * Статус подключения
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Получение клиента (для продвинутых операций)
   */
  getClient(): RedisClientType | null {
    return this.client;
  }
}

// Singleton instance
export const redisService = new RedisService();
export default redisService;

// Helper функции для распространенных кэш-паттернов

/**
 * Кэширование с автоматическим обновлением
 */
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // 5 минут по умолчанию
): Promise<T> {
  // Попытка получить из кэша
  const cached = await redisService.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Если нет в кэше, загружаем
  const fresh = await fetchFn();

  // Сохраняем в кэш
  await redisService.set(key, fresh, ttl);

  return fresh;
}

/**
 * Инвалидация кэша по паттерну
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await redisService.delPattern(pattern);
  logger.info(`Cache invalidated for pattern: ${pattern}`);
}
