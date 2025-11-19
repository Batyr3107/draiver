import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(user, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): AuthUser => {
  return jwt.verify(token, config.jwtSecret) as AuthUser;
};
