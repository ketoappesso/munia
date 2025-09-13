'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Shield,
  Camera,
  Users,
  MapPin,
  History,
  Scan,
  Crown,
  Clock,
  Coins,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';

interface MemberStatus {
  isValid: boolean;
  level: string;
  expiryDate: string | null;
  balance: number;
  points: number;
  isApeLord: boolean;
  customerUid: number | null;
  name: string | null;
  discount: number;
  daysRemaining: number | null;
}

export default function MySpacePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch member info using React Query - use existing Pospal API
  const { data: memberStatus, isLoading: loading } = useQuery({
    queryKey: ['member-info'],
    queryFn: async () => {
      const res = await fetch('/api/pospal/member-info');
      if (!res.ok) throw new Error('Failed to fetch member info');
      return res.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch current face image
  const { data: currentImage } = useQuery({
    queryKey: ['face-image'],
    queryFn: async () => {
      const res = await fetch('/api/facegate/person-image');
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch image');
      return res.json();
    }
  });

  // Upload face image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/facegate/person-image', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-image'] });
      setSelectedFile(null);
      setPreviewUrl(null);
      alert('头像已上传并同步到所有设备');
    },
    onError: (error: Error) => {
      alert(`上传失败: ${error.message}`);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('只支持 JPG 和 PNG 格式');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const getMemberLevelColor = (level: string) => {
    if (level.includes('猿佬')) return 'from-purple-500 to-indigo-500';
    if (level.includes('钻石')) return 'from-cyan-500 to-blue-500';
    if (level.includes('白金')) return 'from-gray-400 to-gray-600';
    if (level.includes('金')) return 'from-yellow-400 to-orange-500';
    if (level.includes('银')) return 'from-gray-300 to-gray-500';
    return 'from-gray-200 to-gray-400';
  };

  const getMemberLevelIcon = (level: string) => {
    if (level.includes('猿佬')) return '👑';
    if (level.includes('钻石')) return '💎';
    if (level.includes('白金')) return '✨';
    if (level.includes('金')) return '🏆';
    if (level.includes('银')) return '🥈';
    return '🎯';
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
          <Shield className="h-8 w-8 text-indigo-600" />
          我的空间
        </h1>
      </div>

      {/* Member Status Card */}
      {loading ? (
        <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-48 rounded-xl mb-6"></div>
      ) : memberStatus ? (
        // Check if user is an Ape Lord member
        memberStatus.isApeLord ? (
          // Ape Lord Member Card
          <div 
            className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${getMemberLevelColor(memberStatus.level)} text-white mb-6 cursor-pointer hover:shadow-xl transition-shadow`}
            onClick={() => router.push('/my-space/member-benefits')}
            data-testid="membership-card">
          <div className="absolute top-0 right-0 text-6xl opacity-20">
            {getMemberLevelIcon(memberStatus.level)}
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div data-testid="member-status">
                <h2 className="text-2xl font-bold" data-testid="member-level">
                  {memberStatus.level}
                </h2>
                <p className="text-white/80 mt-1">
                  {memberStatus.name || session?.user?.name || '会员'}
                </p>
              </div>
              {memberStatus.isApeLord && (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-semibold">猿佬特权</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div data-testid="member-balance">
                <p className="text-white/60 text-sm">余额</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <Coins className="h-5 w-5" />
                  ¥{memberStatus.balance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">积分</p>
                <p className="text-xl font-bold">{memberStatus.points}</p>
              </div>
            </div>

            {memberStatus.expiryDate && (
              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/80" />
                    <span className="text-sm text-white/80" data-testid="expiry-date">
                      有效期至: {new Date(memberStatus.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  {memberStatus.daysRemaining !== null && (
                    <span className={`text-lg font-bold ${
                      memberStatus.daysRemaining > 30 ? 'text-green-200' : 
                      memberStatus.daysRemaining > 7 ? 'text-yellow-200' : 'text-red-200'
                    }`}>
                      剩余 {memberStatus.daysRemaining} 天
                    </span>
                  )}
                </div>
              </div>
            )}

            {!memberStatus.isValid && (
              <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-300/50">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">会员已过期</span>
                </div>
                <button 
                  onClick={() => router.push('/membership/renew')}
                  className="mt-2 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  立即续费
                </button>
              </div>
            )}
          </div>
        </div>
        ) : (
          // Non-Ape Lord Member Card
          <div 
            className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 mb-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
            onClick={() => router.push('/membership/upgrade')}
            data-testid="non-apelord-card">
            <div className="absolute top-0 right-0 text-6xl opacity-10">
              🐵
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-300 dark:bg-gray-600 rounded-full">
                    <Crown className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      还不是猿佬会员
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {memberStatus.name || session?.user?.name || '普通会员'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  升级成为猿佬会员，即可享受：
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>人脸识别快速通行</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>专属折扣优惠</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>积分双倍累积</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-colors flex items-center justify-center gap-2">
                <Crown className="h-5 w-5" />
                立即升级成为猿佬会员
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-6 w-6" />
            <span>暂无会员信息</span>
          </div>
        </div>
      )}

      {/* Face Upload Section for Ape Lord members */}
      {memberStatus?.isApeLord && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700" data-testid="face-upload-section">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-600" />
            人脸录入
          </h2>

          <div className="space-y-4">
            {/* Current Image */}
            {currentImage && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">当前头像</p>
                <div className="relative inline-block">
                  <img
                    src={currentImage.imageUrl}
                    alt="Current face"
                    className="h-32 w-32 rounded-lg border object-cover"
                  />
                  {currentImage.syncStatus === 1 && (
                    <CheckCircle className="absolute -right-2 -top-2 h-6 w-6 text-green-500" />
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  更新于: {new Date(currentImage.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            )}

            {/* Upload Section */}
            <div>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">上传新头像</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-start space-x-4">
                {/* Preview */}
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg border object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">选择图片</span>
                  </button>
                )}

                {/* Upload Button */}
                {selectedFile && (
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploadMutation.isPending ? '上传中...' : '上传头像'}
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      文件大小: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <p className="text-sm text-indigo-800 dark:text-indigo-300">
                  <strong>提示：</strong>
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-indigo-700 dark:text-indigo-400">
                  <li>请上传清晰的正面照片</li>
                  <li>支持 JPG、PNG 格式，最大 5MB</li>
                  <li>图片会自动压缩为设备所需的 JPG 格式</li>
                  <li>上传后会自动同步到所有在线设备</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Control Features */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">门禁管理</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Face Recording - Now handled above */}
          <button
            onClick={() => memberStatus?.isApeLord ? document.getElementById('face-upload-section')?.scrollIntoView({ behavior: 'smooth' }) : null}
            disabled={!memberStatus?.isApeLord}
            className={`p-4 rounded-xl border transition-all ${
              memberStatus?.isApeLord 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                memberStatus?.isApeLord 
                  ? 'bg-indigo-100 dark:bg-indigo-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Camera className={`h-6 w-6 ${
                  memberStatus?.isApeLord 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  人脸录入
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {memberStatus?.isApeLord 
                    ? '录入人脸信息，开启刷脸通行'
                    : '仅猿佬会员可用'}
                </p>
                {memberStatus?.isApeLord && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">可用</span>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Device Management */}
          <button
            onClick={() => memberStatus?.isApeLord ? router.push('/my-space/access-control/devices') : null}
            disabled={!memberStatus?.isApeLord}
            className={`p-4 rounded-xl border transition-all ${
              memberStatus?.isApeLord 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                memberStatus?.isApeLord 
                  ? 'bg-blue-100 dark:bg-blue-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Scan className={`h-6 w-6 ${
                  memberStatus?.isApeLord 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  设备同步
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  同步并管理门禁设备
                </p>
              </div>
            </div>
          </button>

          {/* Area Management */}
          <button
            onClick={() => memberStatus?.isApeLord ? router.push('/my-space/access-control/areas') : null}
            disabled={!memberStatus?.isApeLord}
            className={`p-4 rounded-xl border transition-all ${
              memberStatus?.isApeLord 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                memberStatus?.isApeLord 
                  ? 'bg-green-100 dark:bg-green-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <MapPin className={`h-6 w-6 ${
                  memberStatus?.isApeLord 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  区域管理
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  配置门禁区域和权限
                </p>
              </div>
            </div>
          </button>

          {/* Access History */}
          <button
            onClick={() => router.push('/my-space/access-control/history')}
            className="p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  通行记录
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  查看历史通行记录
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Upgrade Prompt for Non-Ape Lord Members */}
      {memberStatus && !memberStatus.isApeLord && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                升级到猿佬会员
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                解锁人脸识别门禁、设备管理等高级功能，享受更多专属特权。
              </p>
              <button
                onClick={() => router.push('/membership/upgrade')}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-colors font-semibold">
                立即升级
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsiveContainer>
  );
}