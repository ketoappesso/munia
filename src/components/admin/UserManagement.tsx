'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Edit,
  Save,
  X,
  Trash2,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Hash,
  Volume2,
  UserPlus,
  UserX,
  Key,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserData {
  id: string;
  phoneNumber: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  ttsVoiceId: string | null;
  ttsRemainingTrainings: number | null;
  punked: boolean;
  profilePhoto: string | null;
  walletCreatedAt: string | null;
}

interface UserManagementProps {
  className?: string;
}

export default function UserManagement({ className = '' }: UserManagementProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'withVoice' | 'withoutVoice'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    voiceId: '',
    remainingTrainings: 5,
    name: '',
    email: ''
  });
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    phoneNumber: '',
    password: '',
    name: '',
    email: '',
    voiceId: ''
  });

  // Fetch users
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', searchTerm, filterMode, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterMode !== 'all' && { hasVoice: filterMode === 'withVoice' ? 'true' : 'false' })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setNewUser({
        phoneNumber: '',
        password: '',
        name: '',
        email: '',
        voiceId: ''
      });
      alert('用户创建成功！');
    },
    onError: (error: Error) => {
      alert(`创建失败: ${error.message}`);
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleUpdate = (userId: string) => {
    updateUserMutation.mutate({
      userId,
      data: editForm
    });
  };

  const handleDelete = (userId: string) => {
    if (confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-6 w-6" />
            用户管理
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              账户增
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索手机号、姓名或音色ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterMode('withVoice')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterMode === 'withVoice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                已配置
              </button>
              <button
                onClick={() => setFilterMode('withoutVoice')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterMode === 'withoutVoice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                未配置
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          加载失败，请重试
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    用户
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    手机号
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-4 w-4" />
                    音色配置
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    剩余次数
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.users?.map((user: UserData) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || user.username || '未设置'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editForm.voiceId}
                        onChange={(e) => setEditForm({ ...editForm, voiceId: e.target.value })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900"
                        placeholder="音色ID"
                      />
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.ttsVoiceId
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.ttsVoiceId || '未配置'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <input
                        type="number"
                        value={editForm.remainingTrainings}
                        onChange={(e) => setEditForm({ ...editForm, remainingTrainings: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.ttsRemainingTrainings} 次
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.punked && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3" />
                        PUNK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(user.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setEditForm({
                                voiceId: user.ttsVoiceId || '',
                                remainingTrainings: user.ttsRemainingTrainings || 5,
                                name: user.name || '',
                                email: user.email || ''
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              显示 {(page - 1) * 50 + 1} - {Math.min(page * 50, data.pagination.totalCount)} 共 {data.pagination.totalCount} 条
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">创建新用户</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  手机号 *
                </label>
                <input
                  type="text"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Key className="inline h-4 w-4 mr-1" />
                  密码 *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="请输入密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  姓名
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  邮箱
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Volume2 className="inline h-4 w-4 mr-1" />
                  音色ID
                </label>
                <input
                  type="text"
                  value={newUser.voiceId}
                  onChange={(e) => setNewUser({ ...newUser, voiceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="音色ID (可选，如: S_xxxxx)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!newUser.phoneNumber || !newUser.password}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}