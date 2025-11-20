'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useRideUpdates } from '@/hooks/useRideUpdates';

interface SavedLocation {
  id: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalRides: number;
}

interface RecentRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
  status: string;
  createdAt: string;
  driver?: {
    user: {
      firstName: string;
      lastName: string;
      rating: number;
    };
  };
}

export default function PassengerDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const { ride, driverLocation, bids } = useRideUpdates({
    socket,
    rideId: activeRideId,
    onStatusChange: (status) => {
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        setActiveRideId(null);
        loadRecentRides();
      }
    },
    onNewBid: () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('Новая ставка!', {
          body: 'Водитель предложил свою цену',
          icon: '/logo.png'
        });
      }
    }
  });

  useEffect(() => {
    loadUserData();
    loadSavedLocations();
    loadRecentRides();
    loadUnreadNotifications();
    checkActiveRide();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadSavedLocations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data.data || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadRecentRides = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/history?limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecentRides(data.data || []);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?isRead=false`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkActiveRide = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/active`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setActiveRideId(data.data.id);
        }
      }
    } catch (error) {
      console.error('Error checking active ride:', error);
    }
  };

  const quickBookRide = (location: SavedLocation) => {
    router.push(`/ride?dropoff=${encodeURIComponent(location.address)}`);
  };

  const getLoyaltyColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 'GOLD': return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
      case 'SILVER': return 'bg-gradient-to-r from-gray-200 to-gray-400';
      default: return 'bg-gradient-to-r from-orange-300 to-orange-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-600';
      case 'IN_PROGRESS': return 'text-blue-600';
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Привет, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Готовы к новой поездке?</p>
        </div>

        {/* Connection Status */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Подключено' : 'Отключено'}
          </span>
        </div>

        {/* Active Ride */}
        {ride && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🚗 Активная поездка</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ride.status)}`}>
                {getStatusText(ride.status)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 font-bold">A</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Откуда</p>
                  <p className="font-medium">{ride.pickupAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-500 font-bold">B</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Куда</p>
                  <p className="font-medium">{ride.dropoffAddress}</p>
                </div>
              </div>

              {ride.driver && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {ride.driver.user.firstName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{ride.driver.user.firstName} {ride.driver.user.lastName}</p>
                    <p className="text-sm text-gray-600">
                      {ride.driver.vehicleMake} {ride.driver.vehicleModel} • {ride.driver.vehicleNumber}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium">{ride.driver.user.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {bids.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Предложения водителей ({bids.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {bid.driver.user.firstName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{bid.driver.user.firstName}</p>
                            <p className="text-xs text-gray-600">⭐ {bid.driver.user.rating.toFixed(1)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{bid.proposedPrice}₸</p>
                          <p className="text-xs text-gray-600">{bid.estimatedArrival} мин</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => router.push(`/rides/${ride.id}`)}
                  className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Подробнее
                </button>
                <button
                  onClick={() => router.push(`/rides/${ride.id}/chat`)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  💬 Чат
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Booking */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Быстрый заказ</h2>

            <button
              onClick={() => router.push('/ride')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition mb-4"
            >
              🚕 Новая поездка
            </button>

            {savedLocations.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Сохраненные места:</p>
                {savedLocations.slice(0, 3).map((location) => (
                  <button
                    key={location.id}
                    onClick={() => quickBookRide(location)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition text-left"
                  >
                    <span className="text-2xl">
                      {location.type === 'HOME' ? '🏠' : location.type === 'WORK' ? '💼' : '⭐'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {location.type === 'HOME' ? 'Дом' : location.type === 'WORK' ? 'Работа' : 'Избранное'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{location.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Нет сохраненных мест
              </p>
            )}
          </div>

          {/* Loyalty Card */}
          <div className={`${getLoyaltyColor(user?.loyaltyTier || 'BRONZE')} rounded-2xl shadow-lg p-6 text-white`}>
            <h2 className="text-xl font-bold mb-2">💎 {user?.loyaltyTier || 'BRONZE'}</h2>
            <p className="text-sm opacity-90 mb-4">Программа лояльности</p>

            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Баллы</span>
                <span className="text-2xl font-bold">{user?.loyaltyPoints || 0}</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((user?.loyaltyPoints || 0) / 1000 * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Всего поездок</p>
                <p className="text-3xl font-bold">{user?.totalRides || 0}</p>
              </div>
              <button
                onClick={() => router.push('/achievements')}
                className="bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition"
              >
                🏆 Достижения
              </button>
            </div>
          </div>
        </div>

        {/* Recent Rides */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📋 Недавние поездки</h2>
            <button
              onClick={() => router.push('/rides/history')}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              Все →
            </button>
          </div>

          {recentRides.length > 0 ? (
            <div className="space-y-3">
              {recentRides.map((ride) => (
                <div
                  key={ride.id}
                  onClick={() => router.push(`/rides/${ride.id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 truncate">{ride.dropoffAddress}</p>
                    <p className="text-sm text-gray-600 truncate">{ride.pickupAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ride.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-800">{ride.price}₸</p>
                    <p className={`text-sm ${getStatusColor(ride.status)}`}>
                      {getStatusText(ride.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Нет поездок</p>
          )}
        </div>

        {/* Notifications Badge */}
        {unreadNotifications > 0 && (
          <button
            onClick={() => router.push('/notifications')}
            className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition flex items-center gap-2"
          >
            <span>🔔</span>
            <span className="font-semibold">{unreadNotifications}</span>
          </button>
        )}
      </div>
    </div>
  );
}
