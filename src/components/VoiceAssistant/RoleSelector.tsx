'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot, Sparkles, ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { VoiceServiceGateway, VoiceRole } from '@/lib/voice/api-gateway';

interface RoleSelectorProps {
  selectedRole: number | null;
  onSelectRole: (roleId: number) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole
}) => {
  const [roles, setRoles] = useState<VoiceRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRole, setEditingRole] = useState<VoiceRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apiGateway = new VoiceServiceGateway();

  // Default roles
  const defaultRoles: VoiceRole[] = [
    {
      roleId: 1,
      roleName: '智能助手',
      roleDesc: '默认的AI助手，可以回答各种问题',
      avatar: '🤖',
      systemPrompt: '你是一个友好、专业的AI助手。'
    },
    {
      roleId: 2,
      roleName: 'AI老师',
      roleDesc: '专业的教育辅导助手',
      avatar: '👩‍🏫',
      systemPrompt: '你是一位经验丰富的老师，善于用简单易懂的方式解释复杂概念。'
    },
    {
      roleId: 3,
      roleName: '智能管家',
      roleDesc: '智能家居控制助手',
      avatar: '🏠',
      systemPrompt: '你是一个智能家居管家，负责控制和管理家中的智能设备。'
    },
    {
      roleId: 4,
      roleName: '健康顾问',
      roleDesc: '提供健康建议和生活指导',
      avatar: '💊',
      systemPrompt: '你是一位专业的健康顾问，提供科学的健康建议和生活方式指导。'
    },
    {
      roleId: 5,
      roleName: '陪伴好友',
      roleDesc: '温暖贴心的聊天伙伴',
      avatar: '🤗',
      systemPrompt: '你是一个温暖、贴心的朋友，善于倾听和提供情感支持。'
    }
  ];

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const roleList = await apiGateway.getRoles();
      setRoles(roleList.length > 0 ? roleList : defaultRoles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      // Use default roles if API fails
      setRoles(defaultRoles);
    } finally {
      setLoading(false);
    }
  };

  // Add or update role
  const handleSaveRole = async () => {
    if (!roleName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const roleData: Partial<VoiceRole> = {
        roleName: roleName.trim(),
        roleDesc: roleDesc.trim(),
        systemPrompt: systemPrompt.trim() || undefined
      };

      if (editingRole) {
        // Update existing role
        const updatedRole = await apiGateway.updateRole(editingRole.roleId, roleData);
        setRoles(roles.map(r => r.roleId === editingRole.roleId ? updatedRole : r));
      } else {
        // Add new role
        const newRole = await apiGateway.createRole(roleData);
        setRoles([...roles, newRole]);
      }

      // Reset form
      setRoleName('');
      setRoleDesc('');
      setSystemPrompt('');
      setEditingRole(null);
      setShowAddRole(false);
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('保存角色失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete role
  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('确定要删除此角色吗？')) return;

    setLoading(true);
    setError(null);

    try {
      await apiGateway.deleteRole(roleId);
      setRoles(roles.filter(r => r.roleId !== roleId));

      if (selectedRole === roleId) {
        onSelectRole(1); // Reset to default role
      }
    } catch (err) {
      console.error('Failed to delete role:', err);
      setError('删除角色失败');
    } finally {
      setLoading(false);
    }
  };

  // Edit role
  const handleEditRole = (role: VoiceRole) => {
    setEditingRole(role);
    setRoleName(role.roleName);
    setRoleDesc(role.roleDesc || '');
    setSystemPrompt(role.systemPrompt || '');
    setShowAddRole(true);
  };

  // Load roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Get selected role info
  const selectedRoleInfo = roles.find(r => r.roleId === selectedRole);

  // Get role icon
  const getRoleIcon = (role: VoiceRole) => {
    if (role.avatar && role.avatar.length <= 2) {
      return <span className="text-lg">{role.avatar}</span>;
    }
    switch (role.roleId) {
      case 1: return <Bot size={16} />;
      case 2: return <User size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        选择角色
      </label>

      <div className="relative">
        {/* Role Selector Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            {selectedRoleInfo && getRoleIcon(selectedRoleInfo)}
            <span className="text-sm">
              {selectedRoleInfo ? selectedRoleInfo.roleName : '选择角色'}
            </span>
          </div>
          <ChevronDown size={16} className={`transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full mt-1 w-full bg-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
            {/* Role List */}
            <div className="max-h-64 overflow-y-auto">
              {roles.map((role) => (
                <div
                  key={role.roleId}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-600 transition-colors"
                >
                  <button
                    onClick={() => {
                      onSelectRole(role.roleId);
                      setShowDropdown(false);
                    }}
                    className="flex-1 flex items-start gap-2 text-left"
                  >
                    <div className="mt-0.5">
                      {getRoleIcon(role)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{role.roleName}</div>
                      {role.roleDesc && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {role.roleDesc}
                        </div>
                      )}
                    </div>
                  </button>
                  {role.roleId > 5 && ( // Only custom roles can be edited/deleted
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                          setShowDropdown(false);
                        }}
                        className="p-1 hover:bg-blue-600/20 rounded transition-colors"
                      >
                        <Edit2 size={14} className="text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.roleId);
                        }}
                        className="p-1 hover:bg-red-600/20 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Role Button */}
            <div className="border-t border-gray-600">
              <button
                onClick={() => {
                  setShowAddRole(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-600 transition-colors"
              >
                <Plus size={14} />
                <span className="text-sm">创建自定义角色</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Role Form */}
      {showAddRole && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-3">
          <h4 className="text-sm font-medium">
            {editingRole ? '编辑角色' : '创建角色'}
          </h4>

          <div className="space-y-2">
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="角色名称"
              className="w-full px-2 py-1.5 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="角色描述（可选）"
              rows={2}
              className="w-full px-2 py-1.5 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="系统提示词（可选）- 定义角色的行为和性格"
              rows={3}
              className="w-full px-2 py-1.5 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveRole}
              disabled={!roleName.trim() || loading}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
            >
              {editingRole ? '更新' : '创建'}
            </button>
            <button
              onClick={() => {
                setShowAddRole(false);
                setEditingRole(null);
                setRoleName('');
                setRoleDesc('');
                setSystemPrompt('');
              }}
              className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}

      {/* Selected Role Info */}
      {selectedRoleInfo && selectedRoleInfo.systemPrompt && (
        <div className="mt-2 p-2 bg-gray-800 rounded">
          <p className="text-xs text-gray-400 mb-1">系统提示词:</p>
          <p className="text-xs text-gray-300 line-clamp-3">
            {selectedRoleInfo.systemPrompt}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;