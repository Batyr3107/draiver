'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.role === 'DRIVER') {
          router.push('/driver/dashboard');
        } else {
          router.push('/passenger/dashboard');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">Draiver</h1>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  );
}
