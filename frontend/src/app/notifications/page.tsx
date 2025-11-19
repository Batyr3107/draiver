'use client';

import { useState, useEffect } from 'react';
import { NotificationsList } from '../../components/PremiumComponents';
import ThemeToggle from '../../components/ThemeToggle';
import { Button } from '../../components/UI';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    // API запрос
    setNotifications({
      notifications: [
        {
          id: '1',
          type: 'RIDE_REQUEST',
          title: 'Новый запрос на поездку',
          message: 'Пассажир запрашивает поездку из ул. Абая в ТРЦ Mega',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'BID_ACCEPTED',
          title: 'Ваше предложение принято',
          message: 'Пассажир принял ваше предложение на 1500 ₸',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          type: 'PAYMENT_RECEIVED',
          title: 'Получены чаевые',
          message: 'Вы получили чаевые в размере 200 ₸',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          type: 'ACHIEVEMENT',
          title: 'Новое достижение',
          message: 'Вы разблокировали достижение "50 поездок"!',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      unreadCount: 2
    });
  };

  const handleMarkAsRead = async (id: string) => {
    // API запрос
    console.log('Mark as read:', id);
  };

  const handleMarkAllAsRead = async () => {
    // API запрос
    console.log('Mark all as read');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Уведомления</h1>
            {notifications?.unreadCount > 0 && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {notifications.unreadCount} непрочитанных
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 hover:shadow-md'
                }`}
              >
                {f === 'all' && 'Все'}
                {f === 'unread' && 'Непрочитанные'}
              </button>
            ))}
          </div>

          {notifications?.unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
              ✓ Прочитать все
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <NotificationsList
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
        />

        {notifications?.notifications?.length === 0 && (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2">Нет уведомлений</h3>
            <p className="text-gray-600 dark:text-gray-400">
              У вас нет новых уведомлений
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
