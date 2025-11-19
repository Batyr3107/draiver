'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../components/UI';
import { Achievements, LoyaltyCard, SavedLocations } from '../../components/PremiumComponents';
import ThemeToggle from '../../components/ThemeToggle';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [locations, setLocations] = useState<any>([]);
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    // Загрузка данных пользователя
    fetchUserData();
    fetchAchievements();
    fetchLoyalty();
    fetchLocations();
    fetchReferralStats();
  }, []);

  const fetchUserData = async () => {
    // API запрос
    setUser({
      firstName: 'Алексей',
      lastName: 'Петров',
      phoneNumber: '+7 700 123 4567',
      email: 'alex@example.com',
      rating: 4.8,
      totalRides: 127
    });
  };

  const fetchAchievements = async () => {
    // API запрос
    setAchievements({
      unlocked: [
        {
          id: '1',
          achievement: {
            icon: '🚗',
            name: 'Первая поездка',
            description: 'Совершите свою первую поездку',
            points: 50
          }
        }
      ],
      locked: [
        {
          id: '2',
          icon: '⭐',
          name: '50 поездок',
          description: 'Совершите 50 поездок',
          points: 250
        }
      ],
      totalPoints: 350
    });
  };

  const fetchLoyalty = async () => {
    // API запрос
    setLoyalty({
      currentTier: {
        tier: 'SILVER',
        name: 'Серебро',
        minPoints: 500,
        benefits: ['Приоритетная поддержка', 'Скидка 5%', 'Ранний доступ к промокодам']
      },
      points: 750,
      nextTier: {
        tier: 'GOLD',
        points: 2000
      },
      pointsToNext: 1250
    });
  };

  const fetchLocations = async () => {
    // API запрос
    setLocations([
      {
        id: '1',
        type: 'HOME',
        name: 'Дом',
        address: 'ул. Абая, 123',
        latitude: 43.2220,
        longitude: 76.8512
      }
    ]);
  };

  const fetchReferralStats = async () => {
    // API запрос
    setReferralStats({
      referralCode: 'ALEX2025',
      totalReferrals: 5,
      totalEarned: 2500,
      referrals: []
    });
  };

  const tabs = [
    { id: 'profile', name: 'Профиль', icon: '👤' },
    { id: 'achievements', name: 'Достижения', icon: '🏆' },
    { id: 'loyalty', name: 'Лояльность', icon: '💎' },
    { id: 'locations', name: 'Адреса', icon: '🏠' },
    { id: 'referrals', name: 'Рефералы', icon: '🤝' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">Мой профиль</h1>
          <ThemeToggle />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card gradient>
                <h2 className="text-2xl font-bold mb-4">Личная информация</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Имя</label>
                    <p className="text-lg font-semibold">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Телефон</label>
                    <p className="text-lg font-semibold">{user?.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-lg font-semibold">{user?.email}</p>
                  </div>
                </div>
              </Card>

              <Card gradient>
                <h2 className="text-2xl font-bold mb-4">Статистика</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-3xl font-bold text-gradient">{user?.rating}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Рейтинг</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-3xl font-bold text-gradient">{user?.totalRides}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Поездок</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'achievements' && (
            <Achievements achievements={achievements} />
          )}

          {activeTab === 'loyalty' && (
            <div className="max-w-2xl">
              <LoyaltyCard loyalty={loyalty} />
            </div>
          )}

          {activeTab === 'locations' && (
            <SavedLocations
              locations={locations}
              onAdd={(data: any) => console.log('Add location:', data)}
              onDelete={(id: string) => console.log('Delete location:', id)}
            />
          )}

          {activeTab === 'referrals' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card gradient className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-4xl">🤝</span>
                  Реферальная программа
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Приглашайте друзей и получайте бонусы за каждого приглашенного!
                </p>
                <div className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl mb-4">
                  <p className="text-sm mb-2">Ваш реферальный код:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg font-mono text-2xl font-bold text-center">
                      {referralStats?.referralCode}
                    </code>
                    <button className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                      📋 Копировать
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <div className="text-5xl mb-2">👥</div>
                  <div className="text-4xl font-bold text-gradient">{referralStats?.totalReferrals}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Приглашено друзей</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <div className="text-5xl mb-2">💰</div>
                  <div className="text-4xl font-bold text-gradient">{referralStats?.totalEarned} ₸</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Заработано бонусов</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
