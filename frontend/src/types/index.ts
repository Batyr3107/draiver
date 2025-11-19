export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  BIDDING = 'BIDDING',
  ACCEPTED = 'ACCEPTED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  rating?: number;
  totalRides: number;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePlate: string;
  vehiclePhoto?: string;
  isAvailable: boolean;
  isVerified: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  user?: User;
}

export interface Ride {
  id: string;
  passengerId: string;
  passenger?: User;
  driverId?: string;
  driver?: DriverProfile;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  suggestedPrice?: number;
  finalPrice?: number;
  distance?: number;
  duration?: number;
  status: RideStatus;
  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  passengerNotes?: string;
  driverNotes?: string;
  bids?: Bid[];
  payment?: Payment;
  review?: Review;
}

export interface Bid {
  id: string;
  rideId: string;
  driverId: string;
  driver?: User & { driverProfile?: DriverProfile };
  price: number;
  message?: string;
  estimatedArrival?: number;
  isAccepted: boolean;
  isRejected: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

export interface Review {
  id: string;
  rideId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RegisterData {
  phoneNumber: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginData {
  phoneNumber: string;
  password: string;
}

export interface CreateRideData {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  suggestedPrice?: number;
  passengerNotes?: string;
}

export interface CreateBidData {
  rideId: string;
  price: number;
  message?: string;
  estimatedArrival?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}
