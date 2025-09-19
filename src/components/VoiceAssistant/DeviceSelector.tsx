'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { VoiceServiceGateway, DeviceInfo } from '@/lib/voice/api-gateway';

interface DeviceSelectorProps {
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
  userId: string;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  selectedDevice,
  onSelectDevice,
  userId
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apiGateway = new VoiceServiceGateway();

  // Fetch devices
  const fetchDevices = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const deviceList = await apiGateway.getDevices(userId);
      setDevices(deviceList);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError('无法加载设备列表');
    } finally {
      setLoading(false);
    }
  };

  // Add new device
  const handleAddDevice = async () => {
    if (!newDeviceName.trim() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const newDevice = await apiGateway.createDevice(userId, {
        deviceName: newDeviceName.trim(),
        deviceId: `device_${Date.now()}`,
        type: 'web'
      });

      setDevices([...devices, newDevice]);
      setNewDeviceName('');
      setShowAddDevice(false);
      onSelectDevice(newDevice.deviceId);
    } catch (err) {
      console.error('Failed to add device:', err);
      setError('添加设备失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete device
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('确定要删除此设备吗？')) return;

    setLoading(true);
    setError(null);

    try {
      await apiGateway.deleteDevice(deviceId);
      setDevices(devices.filter(d => d.deviceId !== deviceId));

      if (selectedDevice === deviceId) {
        onSelectDevice('');
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
      setError('删除设备失败');
    } finally {
      setLoading(false);
    }
  };

  // Load devices on mount
  useEffect(() => {
    if (userId) {
      fetchDevices();
    }
  }, [userId]);

  // Get selected device info
  const selectedDeviceInfo = devices.find(d => d.deviceId === selectedDevice);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        选择设备
      </label>

      <div className="relative">
        {/* Device Selector Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <span className="text-sm">
              {selectedDeviceInfo ? selectedDeviceInfo.deviceName : '选择设备'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedDeviceInfo && (
              <span className={`w-2 h-2 rounded-full ${
                selectedDeviceInfo.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
            )}
            <ChevronDown size={16} className={`transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full mt-1 w-full bg-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
            {/* Device List */}
            {devices.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-600 transition-colors"
                  >
                    <button
                      onClick={() => {
                        onSelectDevice(device.deviceId);
                        setShowDropdown(false);
                      }}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <Smartphone size={14} />
                      <span className="text-sm">{device.deviceName}</span>
                      {device.type && (
                        <span className="text-xs text-gray-400">({device.type})</span>
                      )}
                      {device.status === 'online' ? (
                        <Wifi size={14} className="text-green-400" />
                      ) : (
                        <WifiOff size={14} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDevice(device.deviceId);
                      }}
                      className="p-1 hover:bg-red-600/20 rounded transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                暂无设备
              </div>
            )}

            {/* Add Device Section */}
            <div className="border-t border-gray-600">
              {!showAddDevice ? (
                <button
                  onClick={() => setShowAddDevice(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-600 transition-colors"
                >
                  <Plus size={14} />
                  <span className="text-sm">添加新设备</span>
                </button>
              ) : (
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="设备名称"
                    className="w-full px-2 py-1 bg-gray-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDevice();
                      } else if (e.key === 'Escape') {
                        setShowAddDevice(false);
                        setNewDeviceName('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDevice}
                      disabled={!newDeviceName.trim() || loading}
                      className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs transition-colors"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDevice(false);
                        setNewDeviceName('');
                      }}
                      className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}

      {/* Device Info */}
      {selectedDeviceInfo && (
        <div className="mt-2 p-2 bg-gray-800 rounded text-xs space-y-1">
          {selectedDeviceInfo.ip && (
            <div className="flex justify-between">
              <span className="text-gray-400">IP地址:</span>
              <span>{selectedDeviceInfo.ip}</span>
            </div>
          )}
          {selectedDeviceInfo.wifiName && (
            <div className="flex justify-between">
              <span className="text-gray-400">WiFi:</span>
              <span>{selectedDeviceInfo.wifiName}</span>
            </div>
          )}
          {selectedDeviceInfo.version && (
            <div className="flex justify-between">
              <span className="text-gray-400">版本:</span>
              <span>{selectedDeviceInfo.version}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;