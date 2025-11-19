'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, StatusBadge } from '../../../components/UI';
import ThemeToggle from '../../../components/ThemeToggle';

export default function RideHistoryPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRides();
  }, [filter]);

  const fetchRides = async () => {
    // API запрос
    setRides([
      {
        id: '1',
        pickupAddress: 'ул. Абая, 123',
        dropoffAddress: 'ул. Достык, 456',
        finalPrice: 1500,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        driver: {
          firstName: 'Иван',
          lastName: 'Иванов',
          rating: 4.9
        }
      },
      {
        id: '2',
        pickupAddress: 'пр. Аль-Фараби, 10',
        dropoffAddress: 'ТРЦ Mega',
        finalPrice: 2300,
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        driver: {
          firstName: 'Петр',
          lastName: 'Петров',
          rating: 5.0
        }
      }
    ]);
  };

  const statusColors: any = {
    COMPLETED: 'success',
    CANCELLED: 'danger',
    IN_PROGRESS: 'primary'
  };

  const statusNames: any = {
    COMPLETED: 'Завершена',
    CANCELLED: 'Отменена',
    IN_PROGRESS: 'В процессе'
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">История поездок</h1>
          <ThemeToggle />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 hover:shadow-md'
              }`}
            >
              {f === 'all' && 'Все'}
              {f === 'completed' && 'Завершенные'}
              {f === 'cancelled' && 'Отмененные'}
            </button>
          ))}
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {rides.map((ride) => (
            <Card key={ride.id} hoverable className="cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Route */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      <div className="w-0.5 h-8 bg-gradient-to-b from-primary-500 to-green-500"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Откуда</p>
                        <p className="font-semibold">{ride.pickupAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Куда</p>
                        <p className="font-semibold">{ride.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {ride.driver && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-xl">👨‍✈️</span>
                      <span>{ride.driver.firstName} {ride.driver.lastName}</span>
                      <span className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{ride.driver.rating}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {ride.finalPrice} ₸
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ride.completedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <StatusBadge status={statusColors[ride.status]}>
                    {statusNames[ride.status]}
                  </StatusBadge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-300 font-medium hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors">
                  🔁 Повторить поездку
                </button>
                <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  📄 Чек
                </button>
              </div>
            </Card>
          ))}
        </div>

        {rides.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold mb-2">Поездок пока нет</h3>
            <p className="text-gray-600 dark:text-gray-400">Совершите свою первую поездку!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
