'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Badge, Modal } from './UI';

// 🏠 Компонент избранных адресов
export function SavedLocations({ locations, onAdd, onDelete }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'HOME',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0
  });

  const locationIcons: any = {
    HOME: '🏠',
    WORK: '💼',
    FAVORITE: '⭐'
  };

  const locationNames: any = {
    HOME: 'Дом',
    WORK: 'Работа',
    FAVORITE: 'Избранное'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradient">Избранные адреса</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Добавить</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations?.map((location: any) => (
          <Card key={location.id} hoverable className="relative">
            <div className="text-4xl mb-2">{locationIcons[location.type]}</div>
            <h3 className="font-semibold text-lg">{location.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
            <button
              onClick={() => onDelete(location.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Добавить адрес"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Тип</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="HOME">🏠 Дом</option>
              <option value="WORK">💼 Работа</option>
              <option value="FAVORITE">⭐ Избранное</option>
            </select>
          </div>
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Адрес"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Button onClick={() => {
            onAdd(formData);
            setIsModalOpen(false);
          }}>
            Сохранить
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// 🎫 Компонент промокодов
export function PromoCodeInput({ onApply }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState<any>(null);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (data.valid) {
        setDiscount(data.promoCode);
        onApply(data.promoCode);
      }
    } catch (error) {
      console.error('Ошибка проверки промокода:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card gradient>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🎫</span>
        Промокод
      </h3>
      <div className="flex gap-2">
        <Input
          placeholder="Введите промокод"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={handleValidate} loading={loading}>
          Применить
        </Button>
      </div>
      {discount && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-green-800 dark:text-green-100 font-medium">
            Скидка {discount.discountType === 'PERCENTAGE' ? `${discount.discountValue}%` : `${discount.discountValue} ₸`}
          </p>
        </div>
      )}
    </Card>
  );
}

// 💰 Компонент чаевых
export function TipSelector({ onSelectTip }: any) {
  const [customTip, setCustomTip] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const tipOptions = [50, 100, 200, 300];

  const handleTipSelect = (amount: number) => {
    setSelectedTip(amount);
    setCustomTip('');
    onSelectTip(amount);
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    setSelectedTip(null);
    onSelectTip(Number(value));
  };

  return (
    <Card gradient>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">💰</span>
        Чаевые водителю
      </h3>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {tipOptions.map((tip) => (
          <button
            key={tip}
            onClick={() => handleTipSelect(tip)}
            className={`p-3 rounded-xl border-2 font-semibold transition-all ${
              selectedTip === tip
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            {tip} ₸
          </button>
        ))}
      </div>
      <Input
        placeholder="Другая сумма"
        type="number"
        value={customTip}
        onChange={(e) => handleCustomTip(e.target.value)}
      />
    </Card>
  );
}

// 🏆 Компонент достижений
export function Achievements({ achievements }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gradient">Мои достижения</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements?.unlocked?.map((item: any) => (
          <Card key={item.id} gradient className="text-center">
            <div className="text-5xl mb-2">{item.achievement.icon}</div>
            <h4 className="font-semibold text-sm">{item.achievement.name}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {item.achievement.description}
            </p>
            <Badge className="mt-2">+{item.achievement.points} pts</Badge>
          </Card>
        ))}

        {achievements?.locked?.map((achievement: any) => (
          <Card key={achievement.id} className="text-center opacity-50 grayscale">
            <div className="text-5xl mb-2">{achievement.icon}</div>
            <h4 className="font-semibold text-sm">{achievement.name}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {achievement.description}
            </p>
            <Badge className="mt-2">🔒 Заблокировано</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 💎 Компонент программы лояльности
export function LoyaltyCard({ loyalty }: any) {
  const tierColors: any = {
    BRONZE: 'from-orange-400 to-orange-600',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-purple-400 to-purple-600'
  };

  const tierIcons: any = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎'
  };

  return (
    <Card gradient className={`bg-gradient-to-br ${tierColors[loyalty?.currentTier?.tier]}`}>
      <div className="text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Уровень лояльности</p>
            <h2 className="text-3xl font-bold">{loyalty?.currentTier?.name}</h2>
          </div>
          <div className="text-6xl">{tierIcons[loyalty?.currentTier?.tier]}</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Баллы</span>
            <span className="font-bold">{loyalty?.points}</span>
          </div>

          {loyalty?.nextTier && (
            <>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${(loyalty.points / loyalty.nextTier.points) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs opacity-90">
                Еще {loyalty.pointsToNext} баллов до {loyalty.nextTier.tier}
              </p>
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/30">
          <p className="text-xs font-semibold mb-2">Преимущества:</p>
          <ul className="text-xs space-y-1">
            {loyalty?.currentTier?.benefits?.map((benefit: string, i: number) => (
              <li key={i}>✓ {benefit}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

// 🔔 Компонент уведомлений
export function NotificationsList({ notifications, onMarkAsRead }: any) {
  const typeIcons: any = {
    RIDE_REQUEST: '🚗',
    BID_RECEIVED: '💵',
    BID_ACCEPTED: '✅',
    RIDE_STARTED: '🚀',
    RIDE_COMPLETED: '🏁',
    PAYMENT_RECEIVED: '💰',
    PROMO_CODE: '🎫',
    ACHIEVEMENT: '🏆',
    MESSAGE: '💬',
    SYSTEM: '⚙️'
  };

  return (
    <div className="space-y-3">
      {notifications?.notifications?.map((notification: any) => (
        <Card
          key={notification.id}
          hoverable
          className={`cursor-pointer ${notification.isRead ? 'opacity-60' : 'border-l-4 border-l-primary-500'}`}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{typeIcons[notification.type]}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 💬 Компонент чата
export function ChatBox({ messages, onSendMessage, currentUserId }: any) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages?.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.senderId === currentUserId
                  ? 'bg-primary-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Введите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>Отправить</Button>
      </div>
    </Card>
  );
}

// 🚨 SOS кнопка
export function SOSButton({ onPress }: any) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handlePress = () => {
    setIsPressed(true);
    let count = 5;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        onPress();
        setIsPressed(false);
        setCountdown(5);
      }
    }, 1000);
  };

  return (
    <button
      onClick={handlePress}
      disabled={isPressed}
      className={`w-full p-6 rounded-2xl font-bold text-xl transition-all shadow-2xl ${
        isPressed
          ? 'bg-red-600 animate-pulse'
          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
      } text-white`}
    >
      {isPressed ? (
        <div className="space-y-2">
          <div className="text-4xl">🚨</div>
          <div>Отправка SOS через {countdown}...</div>
          <div className="text-sm">Нажмите еще раз, чтобы отменить</div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-4xl">🆘</div>
          <div>Нажмите для экстренной помощи</div>
        </div>
      )}
    </button>
  );
}

// 📊 Статистика водителя
export function DriverStats({ stats }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card gradient className="text-center">
        <div className="text-4xl mb-2">🚗</div>
        <div className="text-3xl font-bold text-gradient">{stats?.totalRides || 0}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Поездок</p>
      </Card>

      <Card gradient className="text-center">
        <div className="text-4xl mb-2">⭐</div>
        <div className="text-3xl font-bold text-gradient">{stats?.rating || 5.0}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Рейтинг</p>
      </Card>

      <Card gradient className="text-center">
        <div className="text-4xl mb-2">💰</div>
        <div className="text-3xl font-bold text-gradient">{stats?.totalEarnings || 0} ₸</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Заработано</p>
      </Card>

      <Card gradient className="text-center">
        <div className="text-4xl mb-2">🎁</div>
        <div className="text-3xl font-bold text-gradient">{stats?.totalTips || 0} ₸</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Чаевые</p>
      </Card>
    </div>
  );
}
