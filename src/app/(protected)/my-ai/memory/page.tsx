'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, Database, Plus, Search, Edit, Trash2, Clock, Tag, User, MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

interface Memory {
  id: string;
  type: 'long_term' | 'short_term';
  category: 'personal' | 'preferences' | 'history';
  title: string;
  content: string;
  tags: string[];
  score: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

interface MemoryStats {
  total: number;
  longTerm: number;
  shortTerm: number;
  weekCount: number;
  categories: {
    personal: number;
    preferences: number;
    history: number;
  };
}

export default function MemoryPage() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats>({
    total: 0,
    longTerm: 0,
    shortTerm: 0,
    weekCount: 0,
    categories: {
      personal: 0,
      preferences: 0,
      history: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'long_term' as 'long_term' | 'short_term',
    category: 'personal' as 'personal' | 'preferences' | 'history',
    title: '',
    content: '',
    tags: [] as string[],
    tagInput: ''
  });

  const memoryCategories = [
    { id: 'all', name: '全部' },
    { id: 'personal', name: '个人信息' },
    { id: 'preferences', name: '偏好设置' },
    { id: 'history', name: '对话历史' },
  ];

  const memoryTypes = [
    { id: 'all', name: '全部类型' },
    { id: 'long_term', name: '长期记忆' },
    { id: 'short_term', name: '短期记忆' },
  ];

  // Fetch memories from API
  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/ai/memory?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          alert('AI功能需要PUNK会员资格');
          router.push('/my-ai');
          return;
        }
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      setMemories(data.memories || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
      alert('获取记忆失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedCategory, selectedType, searchQuery]);

  const handleCreateMemory = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    try {
      const response = await fetch('/api/ai/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category,
          title: formData.title,
          content: formData.content,
          tags: formData.tags
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create memory');
      }

      setIsCreating(false);
      setFormData({
        type: 'long_term',
        category: 'personal',
        title: '',
        content: '',
        tags: [],
        tagInput: ''
      });
      fetchMemories();
    } catch (error) {
      console.error('Error creating memory:', error);
      alert('创建记忆失败，请稍后重试');
    }
  };

  const handleUpdateMemory = async () => {
    if (!editingMemory) return;

    try {
      const response = await fetch(`/api/ai/memory?id=${editingMemory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category,
          title: formData.title,
          content: formData.content,
          tags: formData.tags
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update memory');
      }

      setEditingMemory(null);
      setFormData({
        type: 'long_term',
        category: 'personal',
        title: '',
        content: '',
        tags: [],
        tagInput: ''
      });
      fetchMemories();
    } catch (error) {
      console.error('Error updating memory:', error);
      alert('更新记忆失败，请稍后重试');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('确定要删除这个记忆吗？')) return;

    try {
      const response = await fetch(`/api/ai/memory?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      fetchMemories();
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert('删除记忆失败，请稍后重试');
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      type: memory.type,
      category: memory.category,
      title: memory.title,
      content: memory.content,
      tags: memory.tags || [],
      tagInput: ''
    });
    setIsCreating(true);
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const getTypeColor = (type: string) => {
    return type === 'long_term' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
           'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal': return <User className="h-4 w-4" />;
      case 'preferences': return <Tag className="h-4 w-4" />;
      case 'history': return <MessageCircle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return stats.total;
    return stats.categories[category as keyof typeof stats.categories] || 0;
  };

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
          <Database className="h-8 w-8 text-orange-600" />
          记忆管理
        </h1>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <TextInput
                label=""
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索记忆内容..."
                Icon={Search}
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2">
              {memoryCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name} ({getCategoryCount(category.id)})
                </button>
              ))}
            </div>
            
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              {memoryTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>

            {/* Add Memory Button */}
            <Button onPress={() => {
              setEditingMemory(null);
              setFormData({
                type: 'long_term',
                category: 'personal',
                title: '',
                content: '',
                tags: [],
                tagInput: ''
              });
              setIsCreating(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加记忆
            </Button>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总记忆条目</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.longTerm}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">长期记忆</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.shortTerm}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">短期记忆</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.weekCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">本周新增</div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">
              {editingMemory ? '编辑记忆' : '创建新记忆'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'long_term' | 'short_term'})}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <option value="long_term">长期记忆</option>
                  <option value="short_term">短期记忆</option>
                </select>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as 'personal' | 'preferences' | 'history'})}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <option value="personal">个人信息</option>
                  <option value="preferences">偏好设置</option>
                  <option value="history">对话历史</option>
                </select>
              </div>
              <TextInput
                label="标题"
                value={formData.title}
                onChange={(value) => setFormData({...formData, title: value})}
                placeholder="记忆标题..."
              />
              <div>
                <label className="block text-sm font-medium mb-2">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="记忆内容..."
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">标签</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={formData.tagInput}
                    onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="添加标签..."
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                  <Button onPress={addTag}>添加</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onPress={editingMemory ? handleUpdateMemory : handleCreateMemory}>
                  {editingMemory ? '更新' : '创建'}
                </Button>
                <Button 
                  onPress={() => {
                    setIsCreating(false);
                    setEditingMemory(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Memory List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      {getCategoryIcon(memory.category)}
                    </div>
                    <h3 className="font-semibold text-lg">{memory.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(memory.type)}`}>
                      {memory.type === 'long_term' ? '长期' : '短期'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <ButtonNaked
                      onPress={() => startEdit(memory)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="编辑">
                      <Edit className="h-4 w-4" />
                    </ButtonNaked>
                    <ButtonNaked
                      onPress={() => handleDeleteMemory(memory.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                      title="删除">
                      <Trash2 className="h-4 w-4" />
                    </ButtonNaked>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-3">{memory.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {memory.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <Clock className="h-3 w-3" />
                    <span>更新于 {new Date(memory.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && memories.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              没有找到相关记忆
            </h3>
            <p className="text-gray-500 mb-4">
              尝试调整搜索条件或添加新的记忆条目
            </p>
            <Button onPress={() => setIsCreating(true)}>
              添加第一个记忆
            </Button>
          </div>
        )}

        {/* Memory Tips */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
          <h3 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">记忆管理提示</h3>
          <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
            <li>• <strong>长期记忆</strong>：储存重要的个人信息、偏好和持久性知识</li>
            <li>• <strong>短期记忆</strong>：记录最近的对话内容和临时信息</li>
            <li>• <strong>定期整理</strong>：清理过时的短期记忆，更新重要的长期记忆</li>
            <li>• <strong>标签分类</strong>：使用标签帮助AI更好地检索相关记忆</li>
          </ul>
        </div>
      </div>
    </ResponsiveContainer>
  );
}