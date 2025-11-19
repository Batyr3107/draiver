import axios from 'axios';
import type {
  User,
  Ride,
  Bid,
  DriverProfile,
  RegisterData,
  LoginData,
  CreateRideData,
  CreateBidData,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: RegisterData) =>
    api.post<{ user: User; token: string }>('/auth/register', data),

  login: (data: LoginData) =>
    api.post<{ user: User; token: string }>('/auth/login', data),

  getProfile: () =>
    api.get<User>('/auth/profile'),
};

// Ride API
export const rideAPI = {
  createRide: (data: CreateRideData) =>
    api.post<Ride>('/rides', data),

  getActiveRides: () =>
    api.get<Ride[]>('/rides/active'),

  getMyRides: () =>
    api.get<Ride[]>('/rides/my-rides'),

  getRideById: (id: string) =>
    api.get<Ride>(`/rides/${id}`),

  updateRideStatus: (id: string, status: string) =>
    api.patch<Ride>(`/rides/${id}/status`, { status }),

  cancelRide: (id: string) =>
    api.patch<Ride>(`/rides/${id}/cancel`),
};

// Bid API
export const bidAPI = {
  createBid: (data: CreateBidData) =>
    api.post<Bid>('/bids', data),

  acceptBid: (bidId: string) =>
    api.post<{ bid: Bid; ride: Ride }>(`/bids/${bidId}/accept`),

  getBidsForRide: (rideId: string) =>
    api.get<Bid[]>(`/bids/ride/${rideId}`),

  deleteBid: (bidId: string) =>
    api.delete(`/bids/${bidId}`),
};

// Driver API
export const driverAPI = {
  createProfile: (data: Partial<DriverProfile>) =>
    api.post<DriverProfile>('/drivers/profile', data),

  getProfile: () =>
    api.get<DriverProfile>('/drivers/profile'),

  updateProfile: (data: Partial<DriverProfile>) =>
    api.patch<DriverProfile>('/drivers/profile', data),

  toggleAvailability: () =>
    api.patch<DriverProfile>('/drivers/availability'),

  updateLocation: (latitude: number, longitude: number) =>
    api.patch<DriverProfile>('/drivers/location', { latitude, longitude }),

  getNearbyDrivers: (latitude: number, longitude: number, radius?: number) =>
    api.get<DriverProfile[]>('/drivers/nearby', {
      params: { latitude, longitude, radius },
    }),
};

export default api;
