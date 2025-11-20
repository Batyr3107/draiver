'use client';

import { useEffect, useState } from 'react';

interface Ride {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
  distance?: number;
  status: string;
  createdAt: string;
  passenger: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  driver?: {
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    vehicleNumber: string;
  };
}

export default function AdminRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadRides();
    loadStats();
  }, [filter]);

  const loadRides = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filter !== 'ALL' && { status: filter }),
        limit: '50',
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rides?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRides(data.data || []);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rides/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ACCEPTED: 'bg-cyan-100 text-cyan-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Ожидание',
      ACCEPTED: 'Принято',
      IN_PROGRESS: 'В пути',
      COMPLETED: 'Завершено',
      CANCELLED: 'Отменено',
    };
    return texts[status] || status;
  };

  if (loading && rides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">🗺️ Управление поездками</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Всего поездок</div>
          <div className="text-3xl font-bold mt-2">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Активные</div>
          <div className="text-3xl font-bold mt-2">{stats.active}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Завершенные</div>
          <div className="text-3xl font-bold mt-2">{stats.completed}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Отмененные</div>
          <div className="text-3xl font-bold mt-2">{stats.cancelled}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Доход</div>
          <div className="text-3xl font-bold mt-2">{(stats.revenue / 1000).toFixed(0)}K₸</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' && 'Все'}
              {status === 'PENDING' && 'Ожидание'}
              {status === 'ACCEPTED' && 'Принятые'}
              {status === 'IN_PROGRESS' && 'В пути'}
              {status === 'COMPLETED' && 'Завершенные'}
              {status === 'CANCELLED' && 'Отмененные'}
            </button>
          ))}
        </div>
      </div>

      {/* Rides List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Пассажир</th>
                <th className="px-6 py-4 text-left">Водитель</th>
                <th className="px-6 py-4 text-left">Маршрут</th>
                <th className="px-6 py-4 text-center">Цена</th>
                <th className="px-6 py-4 text-center">Статус</th>
                <th className="px-6 py-4 text-center">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rides.map((ride) => (
                <tr key={ride.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600">{ride.id.slice(0, 8)}...</p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">
                      {ride.passenger.firstName} {ride.passenger.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{ride.passenger.phone}</p>
                  </td>

                  <td className="px-6 py-4">
                    {ride.driver ? (
                      <>
                        <p className="font-medium text-gray-800">
                          {ride.driver.user.firstName} {ride.driver.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{ride.driver.vehicleNumber}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Не назначен</p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">
                      <span className="text-blue-500">A</span> {ride.pickupAddress.slice(0, 30)}...
                    </p>
                    <p className="text-sm text-gray-800">
                      <span className="text-cyan-500">B</span> {ride.dropoffAddress.slice(0, 30)}...
                    </p>
                    {ride.distance && (
                      <p className="text-xs text-gray-600 mt-1">📏 {ride.distance.toFixed(1)} км</p>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <p className="font-bold text-gray-800">{ride.price}₸</p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ride.status)}`}>
                      {getStatusText(ride.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <p className="text-sm text-gray-600">
                      {new Date(ride.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ride.createdAt).toLocaleTimeString('ru-RU')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Поездки не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
