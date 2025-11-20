'use client';

import { useEffect, useState } from 'react';

interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/promo-codes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.data || []);
      }
    } catch (error) {
      console.error('Error loading promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/promo-codes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            code: newPromoCode.code.toUpperCase(),
            discountType: newPromoCode.discountType,
            discountValue: parseFloat(newPromoCode.discountValue),
            maxUses: parseInt(newPromoCode.maxUses),
            expiresAt: new Date(newPromoCode.expiresAt).toISOString(),
          }),
        }
      );

      if (response.ok) {
        loadPromoCodes();
        setShowCreateModal(false);
        setNewPromoCode({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          maxUses: '',
          expiresAt: '',
        });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/promo-codes/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ isActive: !isActive }),
        }
      );

      if (response.ok) {
        loadPromoCodes();
      }
    } catch (error) {
      console.error('Error toggling promo code:', error);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromoCode({ ...newPromoCode, code });
  };

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((p) => p.isActive).length,
    expired: promoCodes.filter((p) => new Date(p.expiresAt) < new Date()).length,
    used: promoCodes.reduce((sum, p) => sum + p.currentUses, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🎁 Управление промокодами</h1>
          <p className="text-gray-600 mt-1">Создавайте и управляйте промокодами</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
        >
          ➕ Создать промокод
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Всего промокодов</div>
          <div className="text-3xl font-bold mt-2">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Активные</div>
          <div className="text-3xl font-bold mt-2">{stats.active}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Истекшие</div>
          <div className="text-3xl font-bold mt-2">{stats.expired}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Использовано</div>
          <div className="text-3xl font-bold mt-2">{stats.used}</div>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promoCodes.map((promo) => {
          const isExpired = new Date(promo.expiresAt) < new Date();
          const usagePercent = (promo.currentUses / promo.maxUses) * 100;

          return (
            <div
              key={promo.id}
              className={`bg-white rounded-2xl shadow-lg p-6 ${
                !promo.isActive || isExpired ? 'opacity-60' : ''
              }`}
            >
              {/* Code */}
              <div className="bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg p-4 mb-4">
                <p className="text-center text-2xl font-bold tracking-wider">{promo.code}</p>
              </div>

              {/* Discount */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-orange-600">
                  {promo.discountType === 'PERCENTAGE'
                    ? `${promo.discountValue}%`
                    : `${promo.discountValue}₸`}
                </p>
                <p className="text-sm text-gray-600">
                  {promo.discountType === 'PERCENTAGE' ? 'скидка' : 'фиксированная'}
                </p>
              </div>

              {/* Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Использовано</span>
                  <span className="font-semibold">
                    {promo.currentUses} / {promo.maxUses}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Expiry */}
              <div className="text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-semibold">Истекает:</span>{' '}
                  {new Date(promo.expiresAt).toLocaleDateString('ru-RU')}
                </p>
                {isExpired && <p className="text-red-600 font-semibold mt-1">❌ Истек</p>}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    promo.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {promo.isActive ? '✅ Активен' : '🚫 Неактивен'}
                </span>

                <button
                  onClick={() => handleToggleActive(promo.id, promo.isActive)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    promo.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {promo.isActive ? 'Деактивировать' : 'Активировать'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {promoCodes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Нет промокодов</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Создать первый промокод
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🎁 Новый промокод</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Код промокода
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPromoCode.code}
                    onChange={(e) =>
                      setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="PROMO2024"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Тип скидки
                </label>
                <select
                  value={newPromoCode.discountType}
                  onChange={(e) =>
                    setNewPromoCode({ ...newPromoCode, discountType: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="PERCENTAGE">Процент (%)</option>
                  <option value="FIXED">Фиксированная сумма (₸)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Размер скидки
                </label>
                <input
                  type="number"
                  value={newPromoCode.discountValue}
                  onChange={(e) =>
                    setNewPromoCode({ ...newPromoCode, discountValue: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={newPromoCode.discountType === 'PERCENTAGE' ? '10' : '500'}
                  required
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Максимум использований
                </label>
                <input
                  type="number"
                  value={newPromoCode.maxUses}
                  onChange={(e) =>
                    setNewPromoCode({ ...newPromoCode, maxUses: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Дата истечения
                </label>
                <input
                  type="datetime-local"
                  value={newPromoCode.expiresAt}
                  onChange={(e) =>
                    setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  ✅ Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
