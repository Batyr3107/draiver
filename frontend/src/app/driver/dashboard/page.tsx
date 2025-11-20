'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

interface DriverStats {
  totalRides: number;
  completedRides: number;
  totalEarnings: number;
  rating: number;
  acceptanceRate: number;
}

interface AvailableRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  distance?: number;
  suggestedPrice?: number;
  passengerNotes?: string;
  passenger: {
    firstName: string;
    lastName: string;
    rating: number;
  };
  createdAt: string;
}

interface MyRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
  status: string;
  passenger: {
    firstName: string;
    lastName: string;
    phone: string;
    rating: number;
  };
  startedAt?: string;
  completedAt?: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [myRides, setMyRides] = useState<MyRide[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadAvailableRides();
    loadMyRides();

    if (socket) {
      setupWebSocket();
    }
  }, [socket]);

  const setupWebSocket = () => {
    if (!socket) return;

    socket.on('ride:new', (ride: AvailableRide) => {
      console.log('🚗 New ride available:', ride);
      setAvailableRides((prev) => [ride, ...prev]);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('Новый заказ!', {
          body: `${ride.pickupAddress} → ${ride.dropoffAddress}`,
          icon: '/logo.png'
        });
      }
    });

    socket.on('ride:bid_accepted', (data: { rideId: string }) => {
      console.log('✅ Bid accepted!', data);
      loadMyRides();
      loadAvailableRides();

      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('Ставка принята!', {
          body: 'Пассажир принял ваше предложение',
          icon: '/logo.png'
        });
      }
    });

    return () => {
      socket.off('ride:new');
      socket.off('ride:bid_accepted');
    };
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/driver/stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAvailableRides = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/available`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableRides(data.data || []);
      }
    } catch (error) {
      console.error('Error loading available rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRides = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/driver/rides?status=IN_PROGRESS,ACCEPTED`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMyRides(data.data || []);
      }
    } catch (error) {
      console.error('Error loading my rides:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/driver/availability`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isAvailable: !isAvailable })
        }
      );

      if (response.ok) {
        setIsAvailable(!isAvailable);

        if (socket) {
          socket.emit('driver:availability', { isAvailable: !isAvailable });
        }
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const createBid = async (rideId: string) => {
    if (!bidPrice) {
      alert('Укажите цену');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}/bids`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            proposedPrice: parseFloat(bidPrice),
            estimatedArrival: 10,
            message: bidMessage
          })
        }
      );

      if (response.ok) {
        setBidPrice('');
        setBidMessage('');
        setSelectedRide(null);
        alert('Предложение отправлено!');
      }
    } catch (error) {
      console.error('Error creating bid:', error);
      alert('Ошибка отправки предложения');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'ACCEPTED': return 'text-cyan-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'PENDING': 'Ожидание',
      'ACCEPTED': 'Принято',
      'IN_PROGRESS': 'В пути',
      'COMPLETED': 'Завершено',
      'CANCELLED': 'Отменено'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Панель водителя 🚗</h1>
            <p className="text-gray-600 mt-1">Управление заказами и поездками</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isConnected ? 'Онлайн' : 'Оффлайн'}</span>
            </div>

            <button
              onClick={toggleAvailability}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                isAvailable
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {isAvailable ? '✅ Доступен' : '⏸️ Недоступен'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90">Рейтинг</div>
              <div className="text-3xl font-bold mt-2">{stats.rating.toFixed(1)} ⭐</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90">Заработано</div>
              <div className="text-3xl font-bold mt-2">{stats.totalEarnings.toLocaleString()}₸</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90">Всего поездок</div>
              <div className="text-3xl font-bold mt-2">{stats.totalRides}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90">Завершено</div>
              <div className="text-3xl font-bold mt-2">{stats.completedRides}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90">Принятие</div>
              <div className="text-3xl font-bold mt-2">{stats.acceptanceRate}%</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Rides */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📍 Доступные заказы</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {availableRides.length}
              </span>
            </div>

            {availableRides.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {availableRides.map((ride) => (
                  <div key={ride.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {ride.passenger.firstName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{ride.passenger.firstName}</p>
                            <p className="text-xs text-gray-600">⭐ {ride.passenger.rating.toFixed(1)}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold text-sm">A</span>
                            <p className="text-sm text-gray-700">{ride.pickupAddress}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-cyan-500 font-bold text-sm">B</span>
                            <p className="text-sm text-gray-700">{ride.dropoffAddress}</p>
                          </div>
                        </div>

                        {ride.distance && (
                          <p className="text-xs text-gray-500 mt-2">📏 {ride.distance.toFixed(1)} км</p>
                        )}

                        {ride.passengerNotes && (
                          <p className="text-xs text-gray-600 mt-2 italic">" {ride.passengerNotes}"</p>
                        )}
                      </div>

                      <div className="text-right">
                        {ride.suggestedPrice && (
                          <p className="text-lg font-bold text-gray-800">{ride.suggestedPrice}₸</p>
                        )}
                        <p className="text-xs text-gray-500">предл. цена</p>
                      </div>
                    </div>

                    {selectedRide === ride.id ? (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          placeholder="Ваша цена"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          placeholder="Сообщение (необязательно)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => createBid(ride.id)}
                            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                          >
                            Отправить
                          </button>
                          <button
                            onClick={() => setSelectedRide(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedRide(ride.id)}
                        className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                      >
                        💰 Сделать предложение
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">🔍 Нет доступных заказов</p>
                <p className="text-sm text-gray-400 mt-2">Новые заказы появятся здесь</p>
              </div>
            )}
          </div>

          {/* My Rides */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🚕 Мои поездки</h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {myRides.length}
              </span>
            </div>

            {myRides.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {myRides.map((ride) => (
                  <div
                    key={ride.id}
                    onClick={() => router.push(`/rides/${ride.id}`)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                          {ride.passenger.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{ride.passenger.firstName} {ride.passenger.lastName}</p>
                          <p className="text-xs text-gray-600">📱 {ride.passenger.phone}</p>
                          <p className="text-xs text-gray-600">⭐ {ride.passenger.rating.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">{ride.price}₸</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 mt-3">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold text-sm">A</span>
                        <p className="text-sm text-gray-700">{ride.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-500 font-bold text-sm">B</span>
                        <p className="text-sm text-gray-700">{ride.dropoffAddress}</p>
                      </div>
                    </div>

                    {ride.startedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        🕐 Начало: {new Date(ride.startedAt).toLocaleTimeString('ru-RU')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">📝 Нет активных поездок</p>
                <p className="text-sm text-gray-400 mt-2">Принятые заказы появятся здесь</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/driver/analytics')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center"
            >
              <span className="text-2xl">📊</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Аналитика</p>
            </button>
            <button
              onClick={() => router.push('/driver/earnings')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center"
            >
              <span className="text-2xl">💰</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Заработок</p>
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center"
            >
              <span className="text-2xl">👤</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Профиль</p>
            </button>
            <button
              onClick={() => router.push('/notifications')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-center"
            >
              <span className="text-2xl">🔔</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Уведомления</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
