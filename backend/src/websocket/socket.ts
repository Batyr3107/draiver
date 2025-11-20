import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketIOServer;

/**
 * Инициализация WebSocket сервера
 */
export const initializeWebSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || 'http://localhost:3000',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware для аутентификации
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      console.log(`✅ WebSocket: User ${decoded.id} connected`);
      next();
    } catch (error) {
      console.error('❌ WebSocket auth error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Обработка подключений
  io.on('connection', (socket: AuthSocket) => {
    console.log(`🔌 Socket connected: ${socket.id}, User: ${socket.userId}`);

    // Присоединяем пользователя к его личной комнате
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Импортируем обработчики событий
    registerChatEvents(socket);
    registerRideEvents(socket);
    registerNotificationEvents(socket);
    registerDriverLocationEvents(socket);

    // Обработка отключения
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Обработка ошибок
    socket.on('error', (error) => {
      console.error(`❌ Socket error: ${socket.id}`, error);
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
};

/**
 * Получить экземпляр Socket.IO сервера
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Отправить событие конкретному пользователю
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Отправить событие всем пользователям в комнате
 */
export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

// ==================== CHAT EVENTS ====================

function registerChatEvents(socket: AuthSocket) {
  // Присоединиться к комнате чата поездки
  socket.on('chat:join', async (rideId: string) => {
    try {
      // Проверяем что пользователь участник поездки
      const ride = await prisma.ride.findFirst({
        where: {
          id: rideId,
          OR: [
            { passengerId: socket.userId },
            { driver: { userId: socket.userId } }
          ]
        }
      });

      if (!ride) {
        socket.emit('error', { message: 'Доступ запрещен' });
        return;
      }

      socket.join(`chat:${rideId}`);
      socket.emit('chat:joined', { rideId });
      console.log(`💬 User ${socket.userId} joined chat:${rideId}`);
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Ошибка подключения к чату' });
    }
  });

  // Отправка сообщения
  socket.on('chat:message', async (data: { rideId: string; content: string }) => {
    try {
      const { rideId, content } = data;

      // Получаем информацию о поездке
      const ride = await prisma.ride.findFirst({
        where: {
          id: rideId,
          OR: [
            { passengerId: socket.userId },
            { driver: { userId: socket.userId } }
          ]
        },
        include: {
          driver: true,
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      if (!ride) {
        socket.emit('error', { message: 'Поездка не найдена' });
        return;
      }

      // Определяем получателя
      const receiverId = ride.passengerId === socket.userId
        ? ride.driver?.userId
        : ride.passengerId;

      if (!receiverId) {
        socket.emit('error', { message: 'Получатель не найден' });
        return;
      }

      // Создаем сообщение в БД
      const message = await prisma.message.create({
        data: {
          rideId,
          senderId: socket.userId!,
          receiverId,
          content
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Отправляем сообщение всем в комнате чата
      io.to(`chat:${rideId}`).emit('chat:message', message);

      // Отправляем уведомление получателю
      emitToUser(receiverId, 'notification', {
        type: 'MESSAGE',
        title: 'Новое сообщение',
        message: `${message.sender.firstName}: ${content.substring(0, 50)}...`,
        data: { rideId, messageId: message.id }
      });

      console.log(`💬 Message sent in chat:${rideId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });

  // Индикатор "печатает..."
  socket.on('chat:typing', (data: { rideId: string; isTyping: boolean }) => {
    socket.to(`chat:${data.rideId}`).emit('chat:typing', {
      userId: socket.userId,
      isTyping: data.isTyping
    });
  });
}

// ==================== RIDE EVENTS ====================

function registerRideEvents(socket: AuthSocket) {
  // Присоединиться к комнате поездки
  socket.on('ride:join', (rideId: string) => {
    socket.join(`ride:${rideId}`);
    socket.emit('ride:joined', { rideId });
    console.log(`🚗 User ${socket.userId} joined ride:${rideId}`);
  });

  // Обновление статуса поездки
  socket.on('ride:status', async (data: { rideId: string; status: string }) => {
    try {
      const { rideId, status } = data;

      // Обновляем статус в БД
      const ride = await prisma.ride.update({
        where: { id: rideId },
        data: { status: status as any }
      });

      // Уведомляем всех участников поездки
      io.to(`ride:${rideId}`).emit('ride:status_updated', {
        rideId,
        status,
        updatedAt: new Date()
      });

      console.log(`🚗 Ride ${rideId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating ride status:', error);
      socket.emit('error', { message: 'Ошибка обновления статуса' });
    }
  });

  // Новое предложение (bid)
  socket.on('ride:new_bid', async (data: { rideId: string; bidId: string }) => {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: data.bidId },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              rating: true
            }
          },
          ride: {
            select: {
              passengerId: true
            }
          }
        }
      });

      if (bid) {
        // Уведомляем пассажира о новом предложении
        emitToUser(bid.ride.passengerId, 'ride:new_bid', bid);

        // Отправляем push уведомление
        await prisma.notification.create({
          data: {
            userId: bid.ride.passengerId,
            type: 'BID_RECEIVED',
            title: 'Новое предложение',
            message: `${bid.driver.firstName} предложил ${bid.price} ₸`,
            data: { rideId: data.rideId, bidId: data.bidId }
          }
        });

        console.log(`💵 New bid for ride ${data.rideId}`);
      }
    } catch (error) {
      console.error('Error handling new bid:', error);
    }
  });

  // Предложение принято
  socket.on('ride:bid_accepted', async (data: { rideId: string; bidId: string }) => {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: data.bidId },
        include: {
          driver: true
        }
      });

      if (bid) {
        // Уведомляем водителя
        emitToUser(bid.driverId, 'ride:bid_accepted', {
          rideId: data.rideId,
          bidId: data.bidId
        });

        // Уведомляем всех в комнате поездки
        io.to(`ride:${data.rideId}`).emit('ride:bid_accepted', {
          rideId: data.rideId,
          bidId: data.bidId
        });

        console.log(`✅ Bid ${data.bidId} accepted`);
      }
    } catch (error) {
      console.error('Error handling bid acceptance:', error);
    }
  });
}

// ==================== NOTIFICATION EVENTS ====================

function registerNotificationEvents(socket: AuthSocket) {
  // Отметить уведомление как прочитанное
  socket.on('notification:read', async (notificationId: string) => {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      socket.emit('notification:read', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Отметить все уведомления как прочитанные
  socket.on('notification:read_all', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: socket.userId,
          isRead: false
        },
        data: { isRead: true }
      });

      socket.emit('notification:read_all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });
}

// ==================== DRIVER LOCATION EVENTS ====================

function registerDriverLocationEvents(socket: AuthSocket) {
  // Обновление геолокации водителя
  socket.on('driver:location', async (data: { latitude: number; longitude: number; rideId?: string }) => {
    try {
      const { latitude, longitude, rideId } = data;

      // Обновляем локацию в БД
      await prisma.driverProfile.updateMany({
        where: { userId: socket.userId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude
        }
      });

      // Если есть активная поездка, уведомляем пассажира
      if (rideId) {
        io.to(`ride:${rideId}`).emit('driver:location_updated', {
          latitude,
          longitude,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  });

  // Водитель доступен/занят
  socket.on('driver:availability', async (isAvailable: boolean) => {
    try {
      await prisma.driverProfile.updateMany({
        where: { userId: socket.userId },
        data: { isAvailable }
      });

      socket.emit('driver:availability_updated', { isAvailable });
      console.log(`👨‍✈️ Driver ${socket.userId} availability: ${isAvailable}`);
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  });
}

export default { initializeWebSocket, getIO, emitToUser, emitToRoom };
