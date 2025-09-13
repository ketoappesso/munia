'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import {
  ChevronLeft,
  Shield,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Monitor,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';

// Admin phone number
const ADMIN_PHONE = '18874748888';

interface FacegateDevice {
  id: string;
  deviceId: string;
  deviceName?: string;
  location?: string;
  prodType?: string;
  prodName?: string;
  online: boolean;
  lastSeen?: string;
  lastSeenTs?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FacegateSchedule {
  id: string;
  userPhone: string;
  payloadType: string;
  startAt: string;
  endAt?: string;
  status: number;
  targets: string[];
}

export default function BackofficePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'devices' | 'schedules' | 'persons'>('devices');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({ deviceId: '', deviceName: '', location: '' });
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });

  // Check admin permission
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.username !== ADMIN_PHONE) {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['facegate-devices'],
    queryFn: async () => {
      const res = await fetch('/api/facegate/devices');
      if (!res.ok) throw new Error('Failed to fetch devices');
      const data = await res.json();
      return data.items || [];
    },
    enabled: activeTab === 'devices'
  });

  // Fetch schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['facegate-schedules'],
    queryFn: async () => {
      const res = await fetch('/api/facegate/schedules?all=1');
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();
      return data.items || [];
    },
    enabled: activeTab === 'schedules'
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await fetch(`/api/facegate/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facegate-schedules'] });
    }
  });

  // Remote open door mutation
  const openDoorMutation = useMutation({
    mutationFn: async ({ deviceId, devIdx = 0 }: { deviceId: string; devIdx?: number }) => {
      const res = await fetch(`/api/facegate/devices/${deviceId}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devIdx })
      });
      if (!res.ok) throw new Error('Failed to open door');
      return res.json();
    }
  });

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session?.user || session.user.username !== ADMIN_PHONE) {
    return null;
  }

  return (
    <ResponsiveContainer className="mx-auto mb-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-2 my-4">
        <ButtonNaked
          onPress={() => router.back()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="返回">
          <ChevronLeft className="h-6 w-6" />
        </ButtonNaked>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-600" />
          管理后台
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('devices')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'devices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              设备管理
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              派发计划
            </button>
            <button
              onClick={() => setActiveTab('persons')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'persons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              人员管理
            </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'devices' && (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">设备列表</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['facegate-devices'] })}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新
                </button>
                <button
                  onClick={() => setShowAddDevice(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加设备
                </button>
              </div>
            </div>
            {/* Add Device Form */}
            {showAddDevice && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">添加新设备</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="设备ID (例如: DEV001)"
                    value={newDevice.deviceId}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="设备名称"
                    value={newDevice.deviceName}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="安装位置 (可选)"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => {
                      if (!newDevice.deviceId || !newDevice.deviceName) {
                        alert('请填写设备ID和设备名称');
                        return;
                      }
                      try {
                        const res = await fetch('/api/facegate/devices', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newDevice)
                        });
                        if (!res.ok) throw new Error('Failed to add device');
                        queryClient.invalidateQueries({ queryKey: ['facegate-devices'] });
                        setShowAddDevice(false);
                        setNewDevice({ deviceId: '', deviceName: '', location: '' });
                        alert('设备添加成功');
                      } catch (error) {
                        alert('添加失败，请重试');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    确认添加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDevice(false);
                      setNewDevice({ deviceId: '', deviceName: '', location: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    取消
                  </button>
                </div>
              </div>
            )}

            {devicesLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        设备信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        位置
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        最后在线
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {devices.map((device: FacegateDevice) => (
                      <tr key={device.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            {device.online ? (
                              <Wifi className="h-5 w-5 text-green-600" />
                            ) : (
                              <WifiOff className="h-5 w-5 text-gray-400" />
                            )}
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                device.online
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {device.online ? '在线' : '离线'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingDevice === device.id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {device.deviceName || device.deviceId}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {device.deviceId}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {editingDevice === device.id ? (
                            <input
                              type="text"
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              placeholder="位置"
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          ) : (
                            device.location || '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {device.lastSeen || device.lastSeenTs
                            ? new Date(device.lastSeen || device.lastSeenTs || '').toLocaleString('zh-CN')
                            : '从未在线'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {editingDevice === device.id ? (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/facegate/devices/${device.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ deviceName: editForm.name, location: editForm.location })
                                      });
                                      if (!res.ok) throw new Error('Failed to update');
                                      queryClient.invalidateQueries({ queryKey: ['facegate-devices'] });
                                      setEditingDevice(null);
                                    } catch (error) {
                                      alert('更新失败');
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Save className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => setEditingDevice(null)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingDevice(device.id);
                                    setEditForm({ name: device.deviceName || device.deviceId, location: device.location || '' });
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => openDoorMutation.mutate({ deviceId: device.deviceId })}
                                  disabled={!device.online || openDoorMutation.isPending}
                                  className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                                >
                                  开门
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`确定要删除设备 "${device.deviceName || device.deviceId}" 吗？`)) {
                                      try {
                                        const res = await fetch(`/api/facegate/devices/${device.id}`, {
                                          method: 'DELETE'
                                        });
                                        if (!res.ok) throw new Error('Failed to delete');
                                        queryClient.invalidateQueries({ queryKey: ['facegate-devices'] });
                                      } catch (error) {
                                        alert('删除失败');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {devices.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>暂无设备</p>
                    <p className="text-sm text-gray-400 mt-1">点击上方"添加设备"按钮添加您的第一台设备</p>
                  </div>
                )}
              </div>
            )}

            {/* Device Configuration Instructions */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">设备配置说明</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800 dark:text-blue-400">
                <li>在上方添加设备，记录设备ID</li>
                <li>在物理设备上配置WebSocket连接地址：<code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">ws://服务器IP:3002/ws</code></li>
                <li>设备连接后会自动显示在线状态</li>
                <li>用户上传人脸后会自动同步到所有在线设备</li>
              </ol>
            </div>
          </div>
        )}

      {activeTab === 'schedules' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">派发计划</h2>
            {schedulesLoading ? (
              <div>Loading schedules...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        设备
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {schedules.map((schedule: FacegateSchedule) => (
                      <tr key={schedule.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {schedule.id.slice(0, 8)}...
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {schedule.userPhone}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {schedule.payloadType}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(schedule.startAt).toLocaleString('zh-CN')}
                          {schedule.endAt && ` → ${new Date(schedule.endAt).toLocaleString('zh-CN')}`}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {schedule.targets?.join(', ') || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            disabled={deleteScheduleMutation.isPending}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {schedules.length === 0 && (
                  <div className="py-8 text-center text-gray-500">暂无计划</div>
                )}
              </div>
            )}
          </div>
        )}

      {activeTab === 'persons' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">人员管理</h2>
          <p className="text-gray-500">人员管理功能开发中...</p>
        </div>
      )}
    </ResponsiveContainer>
  );
}