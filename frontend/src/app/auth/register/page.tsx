'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';
import { Input, Button, Card, Select } from '../../../components/UI';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.PASSENGER,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Декоративные элементы */}
      <div className="absolute top-10 left-20 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cloud-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }} />

      <Card gradient className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-glow mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gradient mb-2">
            Регистрация
          </h1>
          <p className="text-gray-600">Создайте свой аккаунт в Draiver</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-scale-in">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Имя"
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Иван"
              required
            />

            <Input
              label="Фамилия"
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Иванов"
              required
            />
          </div>

          <Input
            label="Номер телефона"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="+77001234567"
            required
          />

          <Input
            label="Email (необязательно)"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="example@mail.com"
          />

          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Минимум 6 символов"
            required
          />

          <Select
            label="Роль"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as UserRole })
            }
          >
            <option value={UserRole.PASSENGER}>🚗 Пассажир</option>
            <option value={UserRole.DRIVER}>👨‍✈️ Водитель</option>
          </Select>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full mt-6"
            variant="primary"
          >
            Зарегистрироваться
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Уже есть аккаунт?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-gradient-sky hover:underline"
            >
              Войти
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-sky-100">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>🇰🇿 Сделано в Казахстане</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
