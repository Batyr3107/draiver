'use client';

import { useEffect, useState } from 'react';

interface Driver {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    rating: number;
  };
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  vehicleNumber: string;
  licenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
  totalRides: number;
  totalEarnings: number;
  createdAt: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'AVAILABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filter !== 'ALL' && { status: filter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/drivers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (driverId: string, verify: boolean) => {
    if (!confirm(`${verify ? 'Верифицировать' : 'Отклонить верификацию'} этого водителя?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/${driverId}/verify`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ isVerified: verify }),
        }
      );

      if (response.ok) {
        loadDrivers();
        setSelectedDriver(null);
      }
    } catch (error) {
      console.error('Error verifying driver:', error);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.user.firstName.toLowerCase().includes(query) ||
      driver.user.lastName.toLowerCase().includes(query) ||
      driver.user.phone.includes(query) ||
      driver.vehicleNumber.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: drivers.length,
    verified: drivers.filter((d) => d.isVerified).length,
    pending: drivers.filter((d) => !d.isVerified).length,
    available: drivers.filter((d) => d.isAvailable).length,
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">🚗 Управление водителями</h1>
        <p className="text-gray-600 mt-1">Проверка и верификация водителей</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Всего водителей</div>
          <div className="text-3xl font-bold mt-2">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Верифицировано</div>
          <div className="text-3xl font-bold mt-2">{stats.verified}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Ожидают проверки</div>
          <div className="text-3xl font-bold mt-2">{stats.pending}</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Доступны сейчас</div>
          <div className="text-3xl font-bold mt-2">{stats.available}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Поиск по имени, телефону или номеру авто..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadDrivers()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['ALL', 'VERIFIED', 'PENDING', 'AVAILABLE'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === filterOption
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption === 'ALL' && 'Все'}
                {filterOption === 'VERIFIED' && 'Верифицированные'}
                {filterOption === 'PENDING' && 'Ожидают'}
                {filterOption === 'AVAILABLE' && 'Доступны'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
            onClick={() => setSelectedDriver(driver)}
          >
            {/* Driver Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {driver.user.firstName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-800">
                    {driver.user.firstName} {driver.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">⭐ {driver.user.rating.toFixed(1)}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-col gap-1">
                {driver.isVerified ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    ✅ Верифицирован
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                    ⏳ Ожидает
                  </span>
                )}

                {driver.isAvailable && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-semibold">
                    🟢 Онлайн
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-semibold text-gray-800">
                🚗 {driver.vehicleMake} {driver.vehicleModel}
              </p>
              <p className="text-sm text-gray-600">
                {driver.vehicleYear} • {driver.vehicleColor}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-1">{driver.vehicleNumber}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-600">Поездок</p>
                <p className="text-lg font-bold text-gray-800">{driver.totalRides}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Заработано</p>
                <p className="text-lg font-bold text-green-600">
                  {driver.totalEarnings.toLocaleString()}₸
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>📧 {driver.user.email}</p>
              <p>📱 {driver.user.phone}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">Водители не найдены</p>
        </div>
      )}

      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Детали водителя</h2>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Driver Info */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-cyan-50 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedDriver.user.firstName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                    </h3>
                    <p className="text-gray-600">⭐ Рейтинг: {selectedDriver.user.rating.toFixed(1)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Email:</p>
                    <p className="font-semibold">{selectedDriver.user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Телефон:</p>
                    <p className="font-semibold">{selectedDriver.user.phone}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-800 mb-3">🚗 Информация об автомобиле</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Марка:</p>
                    <p className="font-semibold">{selectedDriver.vehicleMake}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Модель:</p>
                    <p className="font-semibold">{selectedDriver.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Год:</p>
                    <p className="font-semibold">{selectedDriver.vehicleYear}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Цвет:</p>
                    <p className="font-semibold">{selectedDriver.vehicleColor}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Номер:</p>
                    <p className="font-semibold text-lg">{selectedDriver.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Тип:</p>
                    <p className="font-semibold">{selectedDriver.vehicleType}</p>
                  </div>
                </div>
              </div>

              {/* License Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-800 mb-3">📄 Документы</h4>
                <p className="text-sm">
                  <span className="text-gray-600">Номер лицензии:</span>
                  <span className="font-semibold ml-2">{selectedDriver.licenseNumber}</span>
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Поездок</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedDriver.totalRides}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Заработано</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(selectedDriver.totalEarnings / 1000).toFixed(0)}K₸
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Рейтинг</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedDriver.user.rating.toFixed(1)}⭐
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!selectedDriver.isVerified && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifyDriver(selectedDriver.id, true)}
                    className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                  >
                    ✅ Верифицировать
                  </button>
                  <button
                    onClick={() => handleVerifyDriver(selectedDriver.id, false)}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                  >
                    ❌ Отклонить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
