'use client';

import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleNumber: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
    rating: number;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: string;
  price: number;
  distance?: number;
  estimatedDuration?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  driver?: Driver;
}

interface RideBid {
  id: string;
  rideId: string;
  driverId: string;
  proposedPrice: number;
  estimatedArrival: number;
  message?: string;
  driver: Driver;
}

interface UseRideUpdatesOptions {
  socket: Socket | null;
  rideId: string | null;
  onStatusChange?: (status: string, ride: Ride) => void;
  onNewBid?: (bid: RideBid) => void;
  onDriverLocation?: (location: { latitude: number; longitude: number }) => void;
}

/**
 * Hook для отслеживания обновлений поездки в реальном времени
 */
export function useRideUpdates({
  socket,
  rideId,
  onStatusChange,
  onNewBid,
  onDriverLocation
}: UseRideUpdatesOptions) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [bids, setBids] = useState<RideBid[]>([]);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Присоединение к комнате поездки
  useEffect(() => {
    if (!socket || !rideId) return;

    console.log(`🚗 Joining ride room: ${rideId}`);
    socket.emit('ride:join', rideId);

    // Обработчик присоединения к комнате
    socket.on('ride:joined', (data: { rideId: string }) => {
      console.log(`✅ Joined ride room: ${data.rideId}`);
      loadRide();
    });

    // Обработчик обновления статуса поездки
    socket.on('ride:status', (data: { rideId: string; status: string; ride: Ride }) => {
      console.log(`🚗 Ride status updated: ${data.status}`);
      setRide(data.ride);
      onStatusChange?.(data.status, data.ride);
    });

    // Обработчик новой ставки от водителя
    socket.on('ride:new_bid', (bid: RideBid) => {
      console.log('💰 New bid received:', bid);
      setBids((prev) => [...prev, bid]);
      onNewBid?.(bid);
    });

    // Обработчик принятия ставки
    socket.on('ride:bid_accepted', (data: { rideId: string; ride: Ride }) => {
      console.log('✅ Bid accepted, driver assigned');
      setRide(data.ride);
      setBids([]); // Очищаем список ставок после принятия
    });

    // Обработчик обновления локации водителя
    socket.on('driver:location_update', (location: { latitude: number; longitude: number }) => {
      console.log('📍 Driver location updated:', location);
      setDriverLocation(location);
      onDriverLocation?.(location);
    });

    return () => {
      socket.off('ride:joined');
      socket.off('ride:status');
      socket.off('ride:new_bid');
      socket.off('ride:bid_accepted');
      socket.off('driver:location_update');
    };
  }, [socket, rideId, onStatusChange, onNewBid, onDriverLocation]);

  // Загрузка данных о поездке
  const loadRide = useCallback(async () => {
    if (!rideId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRide(data.data);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Загрузка ставок для поездки
  const loadBids = useCallback(async () => {
    if (!rideId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}/bids`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBids(data.data || []);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  }, [rideId]);

  // Принятие ставки водителя
  const acceptBid = useCallback(async (bidId: string) => {
    if (!rideId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}/bids/${bidId}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRide(data.data);
        setBids([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error accepting bid:', error);
      return false;
    }
  }, [rideId]);

  // Отмена поездки
  const cancelRide = useCallback(async (reason?: string) => {
    if (!rideId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRide(data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      return false;
    }
  }, [rideId]);

  return {
    ride,
    bids,
    driverLocation,
    loading,
    loadRide,
    loadBids,
    acceptBid,
    cancelRide
  };
}

export default useRideUpdates;
