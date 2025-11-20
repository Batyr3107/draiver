import express from 'express';
import { createServer } from 'http';
import { config } from './config';
import routes from './routes';
import {
  helmetConfig,
  corsConfig,
  rateLimiter,
  securityHeaders,
  requestLogger,
  jsonSizeLimit,
  urlEncodedSizeLimit
} from './middleware/security';
import { initializeWebSocket } from './websocket/socket';

const app = express();
const httpServer = createServer(app);

// Security Middleware
app.use(securityHeaders);
app.use(helmetConfig);
app.use(corsConfig);
app.use(requestLogger);

// Применяем rate limiting ко всем роутам кроме health check
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  rateLimiter(req, res, next);
});

// Body parsing
app.use(express.json({ limit: jsonSizeLimit }));
app.use(express.urlencoded({ extended: true, limit: urlEncodedSizeLimit }));

// API Routes
app.use('/api', routes);

// Health check (без rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint не найден'
  });
});

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Экспорт io для использования в контроллерах
export { io };

// Запуск сервера
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚗 Draiver API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🛡️  Security: Enabled (Helmet, CORS, Rate Limiting)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

export default app;
