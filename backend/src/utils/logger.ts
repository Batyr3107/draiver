import winston from 'winston';
import path from 'path';

/**
 * Winston Logger configuration
 * Логирование в файлы и консоль с различными уровнями
 */

// Определение формата логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Формат для консоли (более читаемый)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Создание директории для логов
const logsDir = path.join(process.cwd(), 'logs');

// Транспорты (куда записываем логи)
const transports: winston.transport[] = [];

// Консоль (всегда включена в development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug',
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: 'info',
    })
  );
}

// Файлы (только в production или если явно указано)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Ошибки в отдельный файл
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Все логи
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Успешные операции
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'success.log'),
      level: 'info',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

// Создание logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

// Helper методы для логирования специфичных событий
export const loggers = {
  /**
   * Логирование API запросов
   */
  apiRequest: (method: string, url: string, userId?: string, statusCode?: number) => {
    logger.info('API Request', {
      type: 'api_request',
      method,
      url,
      userId,
      statusCode,
    });
  },

  /**
   * Логирование ошибок
   */
  error: (message: string, error: Error, context?: object) => {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    });
  },

  /**
   * Логирование успешных операций
   */
  success: (operation: string, userId?: string, details?: object) => {
    logger.info(operation, {
      type: 'success',
      userId,
      ...details,
    });
  },

  /**
   * Логирование событий поездок
   */
  ride: (event: string, rideId: string, userId: string, details?: object) => {
    logger.info(`Ride ${event}`, {
      type: 'ride_event',
      event,
      rideId,
      userId,
      ...details,
    });
  },

  /**
   * Логирование платежей
   */
  payment: (event: string, amount: number, userId: string, details?: object) => {
    logger.info(`Payment ${event}`, {
      type: 'payment_event',
      event,
      amount,
      userId,
      ...details,
    });
  },

  /**
   * Логирование событий WebSocket
   */
  socket: (event: string, userId?: string, socketId?: string, details?: object) => {
    logger.debug(`Socket ${event}`, {
      type: 'socket_event',
      event,
      userId,
      socketId,
      ...details,
    });
  },

  /**
   * Логирование попыток авторизации
   */
  auth: (event: string, userId?: string, success: boolean = true, details?: object) => {
    logger.info(`Auth ${event}`, {
      type: 'auth_event',
      event,
      userId,
      success,
      ...details,
    });
  },

  /**
   * Логирование операций с базой данных
   */
  database: (operation: string, model: string, recordId?: string, details?: object) => {
    logger.debug(`Database ${operation}`, {
      type: 'database_operation',
      operation,
      model,
      recordId,
      ...details,
    });
  },

  /**
   * Логирование отправки уведомлений
   */
  notification: (
    type: 'email' | 'sms' | 'push',
    recipient: string,
    success: boolean,
    details?: object
  ) => {
    logger.info(`Notification ${type} sent`, {
      type: 'notification',
      notificationType: type,
      recipient,
      success,
      ...details,
    });
  },

  /**
   * Логирование производительности
   */
  performance: (operation: string, duration: number, details?: object) => {
    logger.debug(`Performance: ${operation}`, {
      type: 'performance',
      operation,
      duration,
      unit: 'ms',
      ...details,
    });
  },

  /**
   * Логирование безопасности (подозрительная активность)
   */
  security: (event: string, severity: 'low' | 'medium' | 'high', details?: object) => {
    logger.warn(`Security: ${event}`, {
      type: 'security_event',
      event,
      severity,
      ...details,
    });
  },
};

// Middleware для Express логирования
export const expressLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id;

    loggers.apiRequest(req.method, req.originalUrl, userId, res.statusCode);

    if (duration > 1000) {
      loggers.performance(`Slow request: ${req.method} ${req.originalUrl}`, duration, {
        statusCode: res.statusCode,
        userId,
      });
    }
  });

  next();
};

// Обработка необработанных исключений
if (process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });
  });
}

export default logger;
