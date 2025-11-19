import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket подключен');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket отключен');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('join', userId);
    }
  }

  onNewBid(callback: (bid: any) => void) {
    if (this.socket) {
      this.socket.on('bidReceived', callback);
    }
  }

  onBidAccepted(callback: (ride: any) => void) {
    if (this.socket) {
      this.socket.on('bidAcceptedNotification', callback);
    }
  }

  onRideStatusUpdate(callback: (data: { status: string }) => void) {
    if (this.socket) {
      this.socket.on('rideStatusChanged', callback);
    }
  }

  onDriverLocationUpdate(callback: (data: { latitude: number; longitude: number }) => void) {
    if (this.socket) {
      this.socket.on('driverLocationUpdate', callback);
    }
  }

  emitDriverLocation(rideId: string, latitude: number, longitude: number) {
    if (this.socket) {
      this.socket.emit('driverLocation', { rideId, latitude, longitude });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
