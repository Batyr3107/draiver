'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/UI';
import { DriverStats } from '../../../components/PremiumComponents';
import ThemeToggle from '../../../components/ThemeToggle';

export default function DriverAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    // API запрос
    setStats({
      totalRides: 247,
      rating: 4.9,
      totalEarnings: 987500,
      totalTips: 45600,
      weeklyRides: [12, 15, 18, 14, 20, 16, 19],
      topRoutes: [
        { from: 'ул. Абая', to: 'ТРЦ Mega', count: 15, earnings: 22500 },
        { from: 'пр. Аль-Фараби', to: 'Аэропорт', count: 12, earnings: 48000 },
        { from: 'ул. Достык', to: 'Вокзал', count: 10, earnings: 15000 }
      ],
      hourlyDistribution: {
        morning: 35,
        afternoon: 45,
        evening: 60,
        night: 20
      },
      recentReviews: [
        { rating: 5, comment: 'Отличный водитель!', date: new Date().toISOString() },
        { rating: 5, comment: 'Быстро и безопасно', date: new Date().toISOString() }
      ]
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">Аналитика и статистика</h1>
          <ThemeToggle />
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                period === p
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 hover:shadow-md'
              }`}
            >
              {p === 'day' && 'День'}
              {p === 'week' && 'Неделя'}
              {p === 'month' && 'Месяц'}
              {p === 'year' && 'Год'}
            </button>
          ))}
        </div>

        {/* Main Stats */}
        <DriverStats stats={stats} />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Weekly Chart */}
          <Card gradient>
            <h3 className="font-semibold text-lg mb-4">Поездки за неделю</h3>
            <div className="flex items-end justify-between gap-2 h-48">
              {stats?.weeklyRides?.map((count: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-500"
                      style={{ height: `${(count / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}
                  </span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Hourly Distribution */}
          <Card gradient>
            <h3 className="font-semibold text-lg mb-4">Распределение по времени суток</h3>
            <div className="space-y-4">
              {[
                { label: '🌅 Утро (6-12)', value: stats?.hourlyDistribution?.morning || 0, color: 'bg-yellow-500' },
                { label: '☀️ День (12-18)', value: stats?.hourlyDistribution?.afternoon || 0, color: 'bg-orange-500' },
                { label: '🌆 Вечер (18-24)', value: stats?.hourlyDistribution?.evening || 0, color: 'bg-blue-500' },
                { label: '🌙 Ночь (0-6)', value: stats?.hourlyDistribution?.night || 0, color: 'bg-purple-500' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Routes */}
          <Card gradient className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-4">Популярные маршруты</h3>
            <div className="space-y-3">
              {stats?.topRoutes?.map((route: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{route.from} → {route.to}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{route.count} поездок</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 dark:text-primary-400">{route.earnings} ₸</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">заработано</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Reviews */}
          <Card gradient className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-4">Последние отзывы</h3>
            <div className="space-y-3">
              {stats?.recentReviews?.map((review: any, i: number) => (
                <div key={i} className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-xl">
                          {j < review.rating ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(review.date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips Stats */}
          <Card gradient>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Статистика чаевых
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Всего получено:</span>
                <span className="text-2xl font-bold text-gradient">{stats?.totalTips} ₸</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Средние чаевые:</span>
                <span className="text-xl font-semibold">{Math.round(stats?.totalTips / stats?.totalRides)} ₸</span>
              </div>
              <div className="flex justify-between items-center">
                <span>% поездок с чаевыми:</span>
                <span className="text-xl font-semibold">65%</span>
              </div>
            </div>
          </Card>

          {/* Performance Score */}
          <Card gradient>
            <h3 className="font-semibold text-lg mb-4">Оценка производительности</h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.92)}`}
                    className="text-primary-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gradient">92%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Отличная работа! Продолжайте в том же духе</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
