'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  isBlocked: boolean;
  totalRides: number;
  rating: number;
  loyaltyTier: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, filterRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(filterRole !== 'ALL' && { role: filterRole }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Вы уверены, что хотите ${currentStatus ? 'разблокировать' : 'заблокировать'} этого пользователя?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/block`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ isBlocked: !currentStatus }),
        }
      );

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Изменить роль пользователя на ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      DRIVER: 'bg-green-100 text-green-700',
      PASSENGER: 'bg-blue-100 text-blue-700',
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  const getLoyaltyColor = (tier: string) => {
    const colors: Record<string, string> = {
      PLATINUM: 'text-gray-700',
      GOLD: 'text-yellow-600',
      SILVER: 'text-gray-500',
      BRONZE: 'text-orange-600',
    };
    return colors[tier] || 'text-gray-600';
  };

  const filteredUsers = users.filter((user) =>
    searchQuery
      ? user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      : true
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Управление пользователями</h1>
          <p className="text-gray-600 mt-1">Всего пользователей: {users.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Поиск по имени, email или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">Все роли</option>
              <option value="PASSENGER">Пассажиры</option>
              <option value="DRIVER">Водители</option>
              <option value="ADMIN">Админы</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadUsers}
          className="mt-4 bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition font-semibold"
        >
          🔍 Поиск
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Пользователь</th>
                <th className="px-6 py-4 text-left">Контакты</th>
                <th className="px-6 py-4 text-center">Роль</th>
                <th className="px-6 py-4 text-center">Статистика</th>
                <th className="px-6 py-4 text-center">Лояльность</th>
                <th className="px-6 py-4 text-center">Статус</th>
                <th className="px-6 py-4 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {user.firstName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">{user.email}</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.totalRides} поездок
                    </p>
                    <p className="text-sm text-gray-600">
                      ⭐ {user.rating.toFixed(1)}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${getLoyaltyColor(user.loyaltyTier)}`}>
                      💎 {user.loyaltyTier}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {user.isBlocked ? (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        🚫 Заблокирован
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        ✅ Активен
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Block/Unblock */}
                      <button
                        onClick={() => handleBlockUser(user.id, user.isBlocked)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          user.isBlocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isBlocked ? '✅ Разблокировать' : '🚫 Заблокировать'}
                      </button>

                      {/* Change Role Dropdown */}
                      <select
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                        value=""
                      >
                        <option value="">Изменить роль</option>
                        {user.role !== 'PASSENGER' && <option value="PASSENGER">→ Пассажир</option>}
                        {user.role !== 'DRIVER' && <option value="DRIVER">→ Водитель</option>}
                        {user.role !== 'ADMIN' && <option value="ADMIN">→ Админ</option>}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Пользователи не найдены</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>

          <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
            Страница {currentPage} из {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
}
