'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../components/UI';
import ThemeToggle from '../../components/ThemeToggle';
import { useRouter } from 'next/navigation';

// Типы
interface Location {
  address: string;
  coordinates: [number, number]; // [lat, lng]
}

interface RouteInfo {
  distance: number; // в км
  duration: number; // в минутах
  price: number; // в тенге
}

export default function RidePage() {
  const router = useRouter();
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => {
            setMapLoaded(true);
            initMap();
          });
        }
      };
      document.head.appendChild(script);
    } else if (window.ymaps) {
      window.ymaps.ready(() => {
        setMapLoaded(true);
        initMap();
      });
    }
  }, []);

  // Инициализация карты
  const initMap = () => {
    if (!window.ymaps) return;

    const map = new window.ymaps.Map('map', {
      center: [43.238949, 76.889709], // Алматы, Казахстан
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl']
    });

    // Сохраняем map в window для доступа из других функций
    (window as any).drariverMap = map;

    // Получить текущую геолокацию
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        map.setCenter(coords, 14);
      });
    }
  };

  // Поиск адреса через Yandex Geocoder
  const searchAddress = async (query: string, isPickup: boolean) => {
    if (!query || !window.ymaps) return;

    try {
      const geocoder = await window.ymaps.geocode(query, { results: 1 });
      const firstGeoObject = geocoder.geoObjects.get(0);

      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        const address = firstGeoObject.getAddressLine();

        const location: Location = {
          address,
          coordinates: coords
        };

        if (isPickup) {
          setPickup(location);
          addMarker(coords, 'A', '#4facfe');
        } else {
          setDropoff(location);
          addMarker(coords, 'B', '#00f2fe');
        }

        // Если оба адреса заполнены, строим маршрут
        if (isPickup && dropoff) {
          buildRoute(coords, dropoff.coordinates);
        } else if (!isPickup && pickup) {
          buildRoute(pickup.coordinates, coords);
        }

        // Центрируем карту
        const map = (window as any).drariverMap;
        if (map) {
          map.setCenter(coords, 14);
        }
      }
    } catch (error) {
      console.error('Ошибка поиска адреса:', error);
    }
  };

  // Добавление маркера на карту
  const addMarker = (coords: [number, number], label: string, color: string) => {
    const map = (window as any).drariverMap;
    if (!map || !window.ymaps) return;

    // Удаляем старые маркеры с таким же label
    map.geoObjects.each((geoObject: any) => {
      if (geoObject.properties && geoObject.properties.get('iconContent') === label) {
        map.geoObjects.remove(geoObject);
      }
    });

    const placemark = new window.ymaps.Placemark(coords, {
      iconContent: label
    }, {
      preset: 'islands#blueStretchyIcon',
      iconColor: color
    });

    map.geoObjects.add(placemark);
  };

  // Построение маршрута
  const buildRoute = async (from: [number, number], to: [number, number]) => {
    const map = (window as any).drariverMap;
    if (!map || !window.ymaps) return;

    try {
      // Удаляем старый маршрут
      map.geoObjects.each((geoObject: any) => {
        if (geoObject.getOverlay) {
          map.geoObjects.remove(geoObject);
        }
      });

      // Восстанавливаем маркеры
      if (pickup) addMarker(pickup.coordinates, 'A', '#4facfe');
      if (dropoff) addMarker(dropoff.coordinates, 'B', '#00f2fe');

      // Строим маршрут
      const multiRoute = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [from, to],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true,
        wayPointStartIconColor: '#4facfe',
        wayPointFinishIconColor: '#00f2fe',
        routeActiveStrokeColor: '#4facfe',
        routeActiveStrokeWidth: 6
      });

      map.geoObjects.add(multiRoute);

      // Получаем информацию о маршруте
      multiRoute.model.events.add('requestsuccess', () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const distance = activeRoute.properties.get('distance').value / 1000; // в км
          const duration = Math.ceil(activeRoute.properties.get('duration').value / 60); // в минутах
          const price = calculatePrice(distance);

          setRouteInfo({ distance, duration, price });
        }
      });
    } catch (error) {
      console.error('Ошибка построения маршрута:', error);
    }
  };

  // Расчет стоимости поездки
  const calculatePrice = (distance: number): number => {
    const basePrice = 500; // Базовая цена
    const pricePerKm = 150; // Цена за км
    return Math.round(basePrice + (distance * pricePerKm));
  };

  // Создание заказа
  const handleBookRide = async () => {
    if (!pickup || !dropoff || !routeInfo) {
      alert('Пожалуйста, укажите адреса отправления и назначения');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pickupAddress: pickup.address,
          pickupLatitude: pickup.coordinates[0],
          pickupLongitude: pickup.coordinates[1],
          dropoffAddress: dropoff.address,
          dropoffLatitude: dropoff.coordinates[0],
          dropoffLongitude: dropoff.coordinates[1],
          distance: routeInfo.distance,
          duration: routeInfo.duration,
          suggestedPrice: routeInfo.price
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Перенаправляем на страницу поиска водителя
        router.push(`/ride/${data.data.id}/search`);
      } else {
        alert('Ошибка при создании заказа');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gradient">Draiver</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar с формой */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 shadow-xl p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Заказать поездку</h2>

          <div className="space-y-4">
            {/* Откуда */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <span className="text-2xl mr-2">🔵</span>
                Откуда
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите адрес отправления"
                  value={pickupInput}
                  onChange={(e) => setPickupInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchAddress(pickupInput, true);
                    }
                  }}
                />
                <Button
                  onClick={() => searchAddress(pickupInput, true)}
                  disabled={!pickupInput}
                >
                  🔍
                </Button>
              </div>
              {pickup && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ✓ {pickup.address}
                </p>
              )}
            </div>

            {/* Куда */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <span className="text-2xl mr-2">🟢</span>
                Куда
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите адрес назначения"
                  value={dropoffInput}
                  onChange={(e) => setDropoffInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchAddress(dropoffInput, false);
                    }
                  }}
                />
                <Button
                  onClick={() => searchAddress(dropoffInput, false)}
                  disabled={!dropoffInput}
                >
                  🔍
                </Button>
              </div>
              {dropoff && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ✓ {dropoff.address}
                </p>
              )}
            </div>

            {/* Информация о маршруте */}
            {routeInfo && (
              <Card gradient className="animate-scale-in">
                <h3 className="font-semibold mb-3">Информация о маршруте</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Расстояние:</span>
                    <span className="font-semibold">{routeInfo.distance.toFixed(1)} км</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Время в пути:</span>
                    <span className="font-semibold">~{routeInfo.duration} мин</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600 dark:text-gray-400">Стоимость:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {routeInfo.price} ₸
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Кнопка заказа */}
            <Button
              onClick={handleBookRide}
              loading={loading}
              disabled={!pickup || !dropoff || !routeInfo}
              className="w-full"
            >
              {loading ? 'Создание заказа...' : 'Заказать поездку'}
            </Button>

            {/* Быстрые адреса */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Быстрый доступ</h3>
              <div className="space-y-2">
                <button className="w-full p-3 text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-xl mr-2">🏠</span>
                  Дом
                </button>
                <button className="w-full p-3 text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-xl mr-2">💼</span>
                  Работа
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Карта */}
        <div className="flex-1 relative">
          <div id="map" className="w-full h-full min-h-[400px] md:min-h-full"></div>

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Загрузка карты...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TypeScript декларация для Yandex Maps
declare global {
  interface Window {
    ymaps: any;
    drariverMap: any;
  }
}
