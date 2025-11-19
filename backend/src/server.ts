import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const httpServer = createServer(app);

// Настройка Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// WebSocket соединения
io.on('connection', (socket) => {
  console.log('Новое WebSocket соединение:', socket.id);

  // Присоединение к комнате пользователя
  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`Пользователь ${userId} присоединился к комнате`);
  });

  // Отправка местоположения водителя
  socket.on('driverLocation', (data) => {
    const { rideId, latitude, longitude } = data;
    io.to(rideId).emit('driverLocationUpdate', { latitude, longitude });
  });

  // Обновление статуса поездки
  socket.on('rideStatusUpdate', (data) => {
    const { rideId, status } = data;
    io.to(rideId).emit('rideStatusChanged', { status });
  });

  // Новое предложение от водителя
  socket.on('newBid', (data) => {
    const { passengerId, bid } = data;
    io.to(passengerId).emit('bidReceived', bid);
  });

  // Принятие предложения
  socket.on('bidAccepted', (data) => {
    const { driverId, ride } = data;
    io.to(driverId).emit('bidAcceptedNotification', ride);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket соединение закрыто:', socket.id);
  });
});

// Экспорт io для использования в контроллерах
export { io };

// Запуск сервера
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`🚗 Draiver API запущен на порту ${PORT}`);
  console.log(`📡 WebSocket сервер работает`);
  console.log(`🌍 Окружение: ${config.nodeEnv}`);
});

export default app;
