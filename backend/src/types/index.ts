import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  phoneNumber: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface RegisterDTO {
  phoneNumber: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginDTO {
  phoneNumber: string;
  password: string;
}

export interface CreateRideDTO {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  suggestedPrice?: number;
  passengerNotes?: string;
}

export interface CreateBidDTO {
  rideId: string;
  price: number;
  message?: string;
  estimatedArrival?: number;
}

export interface UpdateDriverLocationDTO {
  latitude: number;
  longitude: number;
}

export interface DriverProfileDTO {
  licenseNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePlate: string;
  vehiclePhoto?: string;
}
