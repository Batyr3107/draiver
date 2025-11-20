'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlatformStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  activeRides: number;
  completedRides: number;
  totalRevenue: number;
  averageRating: number;
  newUsersToday: number;
  newRidesToday: number;
}

interface RecentActivity {
  id: string;
  type: 'ride' | 'user' | 'driver' | 'payment';
  description: string;
  timestamp: string;
  amount?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      // Загрузка статистики
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/stats?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Загрузка последней активности
      const activityResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/activity?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return '🚗';
      case 'user':
        return '👤';
      case 'driver':
        return '🚕';
      case 'payment':
        return '💰';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Статистика платформы</h1>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timeRange === range
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'day' ? 'День' : range === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">👥</span>
            {stats && stats.newUsersToday > 0 && (
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                +{stats.newUsersToday} сегодня
              </span>
            )}
          </div>
          <div className="text-sm opacity-90">Всего пользователей</div>
          <div className="text-4xl font-bold mt-2">{stats?.totalUsers || 0}</div>
        </div>

        {/* Total Drivers */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">🚗</span>
          </div>
          <div className="text-sm opacity-90">Всего водителей</div>
          <div className="text-4xl font-bold mt-2">{stats?.totalDrivers || 0}</div>
        </div>

        {/* Total Rides */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">🗺️</span>
            {stats && stats.newRidesToday > 0 && (
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                +{stats.newRidesToday} сегодня
              </span>
            )}
          </div>
          <div className="text-sm opacity-90">Всего поездок</div>
          <div className="text-4xl font-bold mt-2">{stats?.totalRides || 0}</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">💰</span>
          </div>
          <div className="text-sm opacity-90">Общий доход</div>
          <div className="text-4xl font-bold mt-2">
            {(stats?.totalRevenue || 0).toLocaleString()}₸
          </div>
        </div>

        {/* Active Rides */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">🚕</span>
          </div>
          <div className="text-sm opacity-90">Активные поездки</div>
          <div className="text-4xl font-bold mt-2">{stats?.activeRides || 0}</div>
        </div>

        {/* Completed Rides */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">✅</span>
          </div>
          <div className="text-sm opacity-90">Завершенные поездки</div>
          <div className="text-4xl font-bold mt-2">{stats?.completedRides || 0}</div>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">⭐</span>
          </div>
          <div className="text-sm opacity-90">Средний рейтинг</div>
          <div className="text-4xl font-bold mt-2">
            {(stats?.averageRating || 0).toFixed(1)}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">📈</span>
          </div>
          <div className="text-sm opacity-90">Процент завершения</div>
          <div className="text-4xl font-bold mt-2">
            {stats && stats.totalRides > 0
              ? Math.round((stats.completedRides / stats.totalRides) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Последняя активность</h2>
          <button
            onClick={() => loadDashboardData()}
            className="text-purple-500 hover:text-purple-600 font-medium"
          >
            🔄 Обновить
          </button>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <p className="font-medium text-gray-800">{activity.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.timestamp).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
                {activity.amount && (
                  <div className="text-right">
                    <p className="font-bold text-green-600">{activity.amount}₸</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Нет активности</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Быстрые действия</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full bg-purple-100 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-200 transition text-left font-medium"
            >
              👥 Управление пользователями
            </button>
            <button
              onClick={() => router.push('/admin/drivers')}
              className="w-full bg-green-100 text-green-700 px-4 py-3 rounded-lg hover:bg-green-200 transition text-left font-medium"
            >
              🚗 Проверка водителей
            </button>
            <button
              onClick={() => router.push('/admin/promocodes')}
              className="w-full bg-orange-100 text-orange-700 px-4 py-3 rounded-lg hover:bg-orange-200 transition text-left font-medium"
            >
              🎁 Создать промокод
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Требует внимания</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-700">Новые обращения</span>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                5
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-700">Ожидают верификации</span>
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                12
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Открытые споры</span>
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                3
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-4">🎯 Цели месяца</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Новые пользователи</span>
                <span className="text-sm font-bold">750/1000</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Поездки</span>
                <span className="text-sm font-bold">4200/5000</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: '84%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Доход</span>
                <span className="text-sm font-bold">3.2M/4M₸</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: '80%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
