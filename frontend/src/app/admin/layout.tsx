'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        setUser(data.data);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const menuItems = [
    {
      name: 'Главная',
      icon: '📊',
      path: '/admin/dashboard',
    },
    {
      name: 'Пользователи',
      icon: '👥',
      path: '/admin/users',
    },
    {
      name: 'Водители',
      icon: '🚗',
      path: '/admin/drivers',
    },
    {
      name: 'Поездки',
      icon: '🗺️',
      path: '/admin/rides',
    },
    {
      name: 'Промокоды',
      icon: '🎁',
      path: '/admin/promocodes',
    },
    {
      name: 'Поддержка',
      icon: '💬',
      path: '/admin/support',
    },
    {
      name: 'Настройки',
      icon: '⚙️',
      path: '/admin/settings',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-purple-900 to-purple-700 text-white transition-all duration-300 z-50 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-600">
          {isSidebarOpen && (
            <h1 className="text-2xl font-bold">👑 Admin</h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-purple-600 transition"
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition ${
                  isActive
                    ? 'bg-white text-purple-900 font-semibold shadow-lg'
                    : 'hover:bg-purple-600'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {isSidebarOpen && user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-600">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                {user.firstName[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs opacity-75 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              Выйти
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-md px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Панель администратора
              </h2>
              <p className="text-sm text-gray-600">
                Добро пожаловать, {user?.firstName}!
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="text-2xl">🔔</span>
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
