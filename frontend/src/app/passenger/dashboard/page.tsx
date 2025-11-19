'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { rideAPI, bidAPI } from '../../../services/api';
import { Ride, Bid, RideStatus } from '../../../types';
import socketService from '../../../services/socket';

export default function PassengerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newRide, setNewRide] = useState({
    pickupAddress: '',
    pickupLatitude: 51.1694,
    pickupLongitude: 71.4491, // Астана координаты по умолчанию
    dropoffAddress: '',
    dropoffLatitude: 51.1283,
    dropoffLongitude: 71.4302,
    suggestedPrice: '',
    passengerNotes: '',
  });

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role === 'DRIVER') {
      router.push('/driver/dashboard');
      return;
    }

    loadMyRides();
    setupWebSocket();

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated, user, router]);

  const loadMyRides = async () => {
    try {
      const res = await rideAPI.getMyRides();
      setMyRides(res.data);
    } catch (error) {
      console.error('Ошибка загрузки поездок:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    socketService.connect();
    if (user) {
      socketService.joinRoom(user.id);
    }

    socketService.onNewBid((bid) => {
      alert('Новое предложение от водителя!');
      if (selectedRide) {
        loadBidsForRide(selectedRide.id);
      }
      loadMyRides();
    });
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await rideAPI.createRide({
        ...newRide,
        suggestedPrice: newRide.suggestedPrice ? parseFloat(newRide.suggestedPrice) : undefined,
      });

      alert('Заказ создан! Ожидайте предложений от водителей.');
      setShowCreateRide(false);
      setNewRide({
        pickupAddress: '',
        pickupLatitude: 51.1694,
        pickupLongitude: 71.4491,
        dropoffAddress: '',
        dropoffLatitude: 51.1283,
        dropoffLongitude: 71.4302,
        suggestedPrice: '',
        passengerNotes: '',
      });
      loadMyRides();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка создания заказа');
    }
  };

  const loadBidsForRide = async (rideId: string) => {
    try {
      const res = await bidAPI.getBidsForRide(rideId);
      setBids(res.data);
    } catch (error) {
      console.error('Ошибка загрузки предложений:', error);
    }
  };

  const handleSelectRide = async (ride: Ride) => {
    setSelectedRide(ride);
    await loadBidsForRide(ride.id);
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await bidAPI.acceptBid(bidId);
      alert('Предложение принято! Водитель скоро свяжется с вами.');
      setSelectedRide(null);
      setBids([]);
      loadMyRides();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка принятия предложения');
    }
  };

  const handleCancelRide = async (rideId: string) => {
    if (!confirm('Вы уверены, что хотите отменить поездку?')) {
      return;
    }

    try {
      await rideAPI.cancelRide(rideId);
      alert('Поездка отменена');
      loadMyRides();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка отмены поездки');
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
              Панель пассажира
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateRide(!showCreateRide)}
                className="btn btn-primary"
              >
                + Новый заказ
              </button>
              <span className="text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Форма создания заказа */}
        {showCreateRide && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-4">Новый заказ</h2>
            <form onSubmit={handleCreateRide} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Адрес подачи
                  </label>
                  <input
                    type="text"
                    value={newRide.pickupAddress}
                    onChange={(e) =>
                      setNewRide({ ...newRide, pickupAddress: e.target.value })
                    }
                    className="input"
                    placeholder="ул. Абая, 10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Адрес назначения
                  </label>
                  <input
                    type="text"
                    value={newRide.dropoffAddress}
                    onChange={(e) =>
                      setNewRide({ ...newRide, dropoffAddress: e.target.value })
                    }
                    className="input"
                    placeholder="пр. Республики, 25"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Предложенная цена (необязательно)
                </label>
                <input
                  type="number"
                  value={newRide.suggestedPrice}
                  onChange={(e) =>
                    setNewRide({ ...newRide, suggestedPrice: e.target.value })
                  }
                  className="input"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Примечание (необязательно)
                </label>
                <textarea
                  value={newRide.passengerNotes}
                  onChange={(e) =>
                    setNewRide({ ...newRide, passengerNotes: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Дополнительная информация..."
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Создать заказ
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRide(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Мои поездки */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Мои поездки</h2>
          {myRides.length > 0 ? (
            <div className="space-y-4">
              {myRides.map((ride) => (
                <div key={ride.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">
                        {ride.pickupAddress} → {ride.dropoffAddress}
                      </p>
                      <p className="text-sm text-gray-600">
                        Статус: {ride.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ride.status === RideStatus.REQUESTED || ride.status === RideStatus.BIDDING
                          ? `Предложенная цена: ${ride.suggestedPrice} ₸`
                          : `Цена: ${ride.finalPrice} ₸`}
                      </p>
                      {ride.bids && ride.bids.length > 0 && (
                        <p className="text-sm text-primary-600 mt-1">
                          Предложений: {ride.bids.length}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(ride.status === RideStatus.REQUESTED || ride.status === RideStatus.BIDDING) && (
                        <>
                          <button
                            onClick={() => handleSelectRide(ride)}
                            className="btn btn-primary"
                          >
                            Посмотреть предложения
                          </button>
                          <button
                            onClick={() => handleCancelRide(ride.id)}
                            className="btn btn-danger"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">У вас пока нет поездок</p>
          )}
        </div>

        {/* Модальное окно с предложениями */}
        {selectedRide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  Предложения для поездки
                </h2>
                <button
                  onClick={() => {
                    setSelectedRide(null);
                    setBids([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="font-medium">
                  {selectedRide.pickupAddress} → {selectedRide.dropoffAddress}
                </p>
                <p className="text-sm text-gray-600">
                  Ваша предложенная цена: {selectedRide.suggestedPrice} ₸
                </p>
              </div>

              {bids.length > 0 ? (
                <div className="space-y-3">
                  {bids.map((bid) => (
                    <div key={bid.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {bid.driver?.firstName} {bid.driver?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Рейтинг: {bid.driver?.rating || 5}⭐
                          </p>
                          {bid.driver?.driverProfile && (
                            <p className="text-sm text-gray-600">
                              {bid.driver.driverProfile.vehicleBrand}{' '}
                              {bid.driver.driverProfile.vehicleModel} (
                              {bid.driver.driverProfile.vehiclePlate})
                            </p>
                          )}
                          <p className="text-lg font-bold text-primary-600 mt-2">
                            {bid.price} ₸
                          </p>
                          {bid.message && (
                            <p className="text-sm text-gray-600 mt-1">
                              {bid.message}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAcceptBid(bid.id)}
                          className="btn btn-primary"
                        >
                          Принять
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Пока нет предложений от водителей
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
