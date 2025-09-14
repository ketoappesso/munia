'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Edit,
  Save,
  X,
  Trash2,
  AlertCircle,
  Mic,
  RefreshCw,
  User,
  Phone,
  Hash,
  Volume2,
  UserCheck
} from 'lucide-react';

interface UserVoiceMapping {
  id: string;
  phoneNumber: string | null;
  username: string | null;
  name: string | null;
  ttsVoiceId: string | null;
  ttsRemainingTrainings: number | null;
  punked: boolean;
  profilePhoto: string | null;
  walletCreatedAt: string | null;
}

interface VoiceManagementProps {
  className?: string;
}

export default function VoiceManagement({ className = '' }: VoiceManagementProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'withVoice' | 'withoutVoice'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ voiceId: '', remainingTrainings: 5 });
  const [page, setPage] = useState(1);
  const [newVoiceId, setNewVoiceId] = useState('');
  const [searchResults, setSearchResults] = useState<UserVoiceMapping[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for specific user by phone
  const searchUserByPhone = async () => {
    if (!phoneSearch) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/voice-mappings?search=${encodeURIComponent(phoneSearch)}&hasVoice=false`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch users with voice mappings
  const { data, isLoading, error } = useQuery({
    queryKey: ['voice-mappings', searchTerm, filterMode, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (filterMode === 'withVoice') {
        params.append('hasVoice', 'true');
      } else if (filterMode === 'withoutVoice') {
        params.append('hasVoice', 'false');
      }

      const res = await fetch(`/api/admin/voice-mappings?${params}`);
      if (!res.ok) throw new Error('Failed to fetch voice mappings');
      return res.json();
    },
  });

  // Update voice mapping mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, voiceId, remainingTrainings }: {
      userId: string;
      voiceId: string;
      remainingTrainings?: number
    }) => {
      const res = await fetch(`/api/admin/voice-mappings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, remainingTrainings }),
      });
      if (!res.ok) throw new Error('Failed to update voice mapping');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-mappings'] });
      setEditingUser(null);
    },
  });

  // Delete voice mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/voice-mappings/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete voice mapping');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-mappings'] });
    },
  });

  const handleEdit = (user: UserVoiceMapping) => {
    setEditingUser(user.id);
    setEditForm({
      voiceId: user.ttsVoiceId || '',
      remainingTrainings: user.ttsRemainingTrainings || 5,
    });
  };

  const handleSave = async (userId: string) => {
    await updateMutation.mutateAsync({
      userId,
      voiceId: editForm.voiceId,
      remainingTrainings: editForm.remainingTrainings,
    });
  };

  const handleDelete = async (user: UserVoiceMapping) => {
    if (confirm(`确定要清除 ${user.name || user.phoneNumber} 的音色配置吗？`)) {
      await deleteMutation.mutateAsync(user.id);
    }
  };

  const getVoiceDisplay = (voiceId: string | null) => {
    if (!voiceId) return '未配置';
    if (voiceId.startsWith('S_')) return `自定义音色 (${voiceId})`;
    const standardVoices: Record<string, string> = {
      'BV001': '标准女声',
      'BV002': '温柔女声',
      'BV003': '标准男声',
      'BV004': '活力女声',
      'BV005': '沉稳男声',
    };
    return standardVoices[voiceId] || voiceId;
  };

  return (
    <div className={`${className}`}>
      {/* Header and Search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">音色映射管理</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['voice-mappings'] })}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          {/* Main Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索手机号、姓名或音色ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

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

          {/* Quick Add Section for Users Without Voice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  搜索无音色用户并快速分配
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入手机号搜索用户"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUserByPhone()}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={searchUserByPhone}
                    disabled={isSearching || !phoneSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    搜索无音色用户
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    搜索结果 ({searchResults.length} 个用户)
                  </div>
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name || user.username || '未设置'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.phoneNumber || '无手机号'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="音色ID"
                            value={newVoiceId}
                            onChange={(e) => setNewVoiceId(e.target.value)}
                            className="px-2 py-1 w-32 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <button
                            onClick={() => handleUpdate(user.id, newVoiceId, user.ttsRemainingTrainings || 5)}
                            disabled={!newVoiceId}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            分配
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {data?.users?.map((user: UserVoiceMapping) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.name || 'User'}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.name || user.username || '未设置'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {user.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editForm.voiceId}
                        onChange={(e) => setEditForm({ ...editForm, voiceId: e.target.value })}
                        placeholder="S_xxxxx 或 BV001-BV005"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="text-sm">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.ttsVoiceId
                            ? user.ttsVoiceId.startsWith('S_')
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {getVoiceDisplay(user.ttsVoiceId)}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <input
                        type="number"
                        value={editForm.remainingTrainings}
                        onChange={(e) => setEditForm({ ...editForm, remainingTrainings: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.ttsRemainingTrainings ?? 5} 次
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.punked && (
                      <div className="flex items-center gap-1 text-xs">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 dark:text-green-400 font-medium">PUNK</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={updateMutation.isPending}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          {user.ttsVoiceId && (
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data?.users?.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Mic className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p>暂无匹配的用户</p>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-900">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                第 {data.pagination.page} 页，共 {data.pagination.totalPages} 页（{data.pagination.totalCount} 条记录）
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">音色配置说明</h3>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-400">
          <li>自定义音色ID格式：S_开头（如 S_r3YGBCoB1）</li>
          <li>标准音色选项：BV001-BV005（标准男女声）</li>
          <li>配置自定义音色后，用户将自动获得PUNK标识</li>
          <li>剩余训练次数控制用户上传语音的限制</li>
          <li>清除音色配置将重置训练次数为5次</li>
        </ul>
      </div>
    </div>
  );
}