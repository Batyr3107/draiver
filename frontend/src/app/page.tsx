'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/UI';

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cloud-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="text-center relative z-10 animate-fade-in">
        <div className="mb-8">
          <div className="inline-block p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-glow animate-float">
            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-gradient mb-4">
          Draiver
        </h1>
        <p className="text-xl text-gray-600 mb-8">Ваш райдшеринг сервис в Казахстане</p>
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Загрузка...</p>
      </div>
    </div>
  );
}
