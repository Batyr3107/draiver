'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { rideAPI, bidAPI, driverAPI } from '../../../services/api';
import { Ride, Bid, DriverProfile } from '../../../types';
import socketService from '../../../services/socket';

export default function DriverDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'DRIVER') {
      router.push('/passenger/dashboard');
      return;
    }

    loadData();
    setupWebSocket();

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      const [ridesRes, myRidesRes, profileRes] = await Promise.all([
        rideAPI.getActiveRides(),
        rideAPI.getMyRides(),
        driverAPI.getProfile(),
      ]);

      setActiveRides(ridesRes.data);
      setMyRides(myRidesRes.data);
      setDriverProfile(profileRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    socketService.connect();
    if (user) {
      socketService.joinRoom(user.id);
    }

    socketService.onBidAccepted((ride) => {
      alert(`Ваше предложение принято для поездки ${ride.id}!`);
      loadData();
    });
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await driverAPI.toggleAvailability();
      setDriverProfile(res.data);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleCreateBid = async (rideId: string) => {
    if (!bidPrice) {
      alert('Укажите цену');
      return;
    }

    try {
      await bidAPI.createBid({
        rideId,
        price: parseFloat(bidPrice),
        message: bidMessage,
      });

      alert('Предложение отправлено!');
      setBidPrice('');
      setBidMessage('');
      setSelectedRide(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка отправки предложения');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Панель водителя
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleAvailability}
                className={`btn ${
                  driverProfile?.isAvailable ? 'btn-danger' : 'btn-primary'
                }`}
              >
                {driverProfile?.isAvailable ? 'Недоступен' : 'Доступен'}
              </button>
              <span className="text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Профиль водителя */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Ваш профиль</h2>
          {driverProfile ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Автомобиль</p>
                <p className="font-medium">
                  {driverProfile.vehicleBrand} {driverProfile.vehicleModel} ({driverProfile.vehicleYear})
                </p>
              </div>
              <div>
                <p className="text-gray-600">Номер</p>
                <p className="font-medium">{driverProfile.vehiclePlate}</p>
              </div>
              <div>
                <p className="text-gray-600">Статус</p>
                <p className="font-medium">
                  {driverProfile.isAvailable ? '✅ Доступен' : '❌ Недоступен'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Верификация</p>
                <p className="font-medium">
                  {driverProfile.isVerified ? '✅ Подтвержден' : '⏳ Ожидает проверки'}
                </p>
              </div>
            </div>
          ) : (
            <p>Профиль не создан</p>
          )}
        </div>

        {/* Доступные заказы */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Доступные заказы</h2>
          {activeRides.length > 0 ? (
            <div className="space-y-4">
              {activeRides.map((ride) => (
                <div key={ride.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {ride.pickupAddress} → {ride.dropoffAddress}
                      </p>
                      <p className="text-sm text-gray-600">
                        Расстояние: {ride.distance?.toFixed(1)} км
                      </p>
                      <p className="text-sm text-gray-600">
                        Предложенная цена: {ride.suggestedPrice} ₸
                      </p>
                      {ride.passengerNotes && (
                        <p className="text-sm text-gray-600 mt-2">
                          Примечание: {ride.passengerNotes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRide(ride)}
                      className="btn btn-primary"
                    >
                      Сделать предложение
                    </button>
                  </div>

                  {selectedRide?.id === ride.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium mb-2">Ваше предложение</h3>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          placeholder="Ваша цена"
                          className="input flex-1"
                        />
                        <input
                          type="text"
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          placeholder="Сообщение (необязательно)"
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleCreateBid(ride.id)}
                          className="btn btn-primary"
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Нет доступных заказов</p>
          )}
        </div>

        {/* Мои поездки */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Мои поездки</h2>
          {myRides.length > 0 ? (
            <div className="space-y-4">
              {myRides.map((ride) => (
                <div key={ride.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {ride.pickupAddress} → {ride.dropoffAddress}
                      </p>
                      <p className="text-sm text-gray-600">
                        Статус: {ride.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        Цена: {ride.finalPrice} ₸
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        ride.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ride.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">У вас пока нет поездок</p>
          )}
        </div>
      </main>
    </div>
  );
}
