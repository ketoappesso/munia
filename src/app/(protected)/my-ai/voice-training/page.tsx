'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, Mic, Upload, Play, Pause, Square, Download, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

export default function VoiceTrainingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTextIndex, setSelectedTextIndex] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch voice status on mount
  useEffect(() => {
    fetchVoiceStatus();
  }, []);
  
  const fetchVoiceStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/voice-training/status');
      const data = await response.json();
      
      if (response.ok) {
        setVoiceStatus(data);
      } else {
        setError(data.error || '获取音色状态失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        
        // Create audio element for playback
        const audioUrl = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };
  
  const uploadRecording = async () => {
    if (!recordedBlob) {
      setError('请先录制音频');
      return;
    }
    
    try {
      setUploadProgress(30);
      const formData = new FormData();
      formData.append('file', recordedBlob, 'recording.wav');
      formData.append('text', sampleTexts[selectedTextIndex]);
      formData.append('modelType', '1'); // V2_ICL
      formData.append('language', '0'); // Chinese
      
      setUploadProgress(60);
      const response = await fetch('/api/ai/voice-training/upload-audio', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(90);
      const data = await response.json();
      
      if (response.ok) {
        setUploadProgress(100);
        alert(`上传成功！已上传 ${data.sampleCount} 个样本`);
        setRecordedBlob(null);
        fetchVoiceStatus(); // Refresh status
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploadProgress(0);
    }
  };
  
  const playRecording = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    }
  };

  const sampleTexts = [
    '你好，我是你的AI助理，很高兴为你服务。',
    '今天天气不错，我们可以聊聊你感兴趣的话题。',
    '人工智能的发展正在改变我们的生活方式。',
    '学习新技能需要持续的练习和耐心。',
    '创新思维能够帮助我们解决复杂的问题。',
  ];
  
  // Poll for training status updates
  useEffect(() => {
    if (!voiceStatus?.hasCustomVoice) return;
    
    // Set up polling for active training
    const interval = setInterval(() => {
      if (voiceStatus?.status === 'training' || voiceStatus?.status === 'Training') {
        fetchVoiceStatus();
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [voiceStatus?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'training': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'training': return <Clock className="h-5 w-5" />;
      case 'pending': return <AlertCircle className="h-5 w-5" />;
      case 'failed': return <AlertCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '训练完成';
      case 'training': return '训练中';
      case 'pending': return '等待训练';
      case 'failed': return '训练失败';
      default: return '未知状态';
    }
  };

  return (
    <ResponsiveContainer className="mx-auto mb-4 px-4 md:px-0">
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="flex items-center gap-2 my-4">
        <ButtonNaked
          onPress={() => router.back()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="返回">
          <ChevronLeft className="h-6 w-6" />
        </ButtonNaked>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mic className="h-8 w-8 text-blue-600" />
          语音训练
        </h1>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {/* Voice Status Card */}
      {!isLoading && voiceStatus && voiceStatus.hasCustomVoice && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-800 dark:text-purple-200">
            音色状态
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-purple-600 dark:text-purple-300">音色ID</span>
              <div className="font-semibold">{voiceStatus.speakerId}</div>
            </div>
            <div>
              <span className="text-sm text-purple-600 dark:text-purple-300">状态</span>
              <div className="font-semibold">{voiceStatus.stateText || voiceStatus.status}</div>
            </div>
            <div>
              <span className="text-sm text-purple-600 dark:text-purple-300">版本</span>
              <div className="font-semibold">{voiceStatus.trainingVersion || 'V1'}</div>
            </div>
            <div>
              <span className="text-sm text-purple-600 dark:text-purple-300">剩余训练次数</span>
              <div className="font-semibold text-2xl text-purple-600">
                {voiceStatus.remainingTrainings !== undefined ? voiceStatus.remainingTrainings : '8'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
            开始语音训练
          </h2>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            通过录制语音样本或上传音频文件来训练你的专属语音模型
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              onPress={() => {
                setSelectedTextIndex(0);
                // Scroll to recording section
                document.getElementById('recording-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!voiceStatus?.canTrain}
            >
              <Mic className="h-4 w-4 mr-2" />
              开始录音训练
            </Button>
            <Button 
              mode="secondary"
              onPress={() => document.getElementById('file-upload')?.click()}
              disabled={!voiceStatus?.canTrain}
            >
              <Upload className="h-4 w-4 mr-2" />
              上传音频文件
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('modelType', '1');
                  formData.append('language', '0');
                  
                  try {
                    setUploadProgress(30);
                    const response = await fetch('/api/ai/voice-training/upload-audio', {
                      method: 'POST',
                      body: formData
                    });
                    setUploadProgress(80);
                    const data = await response.json();
                    if (response.ok) {
                      setUploadProgress(100);
                      setTimeout(() => {
                        alert(data.message || '音频上传成功，模型已训练完成！');
                        fetchVoiceStatus();
                        setUploadProgress(0);
                      }, 1000);
                    } else {
                      setError(data.error);
                      setUploadProgress(0);
                    }
                  } catch (err) {
                    setError('上传失败');
                    setUploadProgress(0);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recording Interface */}
        <div id="recording-section" className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">语音录制</h2>
          
          <div className="space-y-6">
            {/* Sample Text Display */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium mb-2">请朗读以下文本:</h3>
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {sampleTexts[selectedTextIndex]}
              </p>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onPress={() => isRecording ? stopRecording() : startRecording()}
                className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-full w-16 h-16 flex items-center justify-center`}
              >
                {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              
              <div className="text-center">
                <div className="text-2xl font-mono">
                  {isRecording ? '录制中...' : recordedBlob ? '已录制' : '00:00'}
                </div>
                <div className="text-xs text-gray-500">录制状态</div>
              </div>

              <Button
                mode="secondary"
                onPress={playRecording}
                className="rounded-full w-12 h-12 flex items-center justify-center"
                disabled={!recordedBlob}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              {recordedBlob && (
                <Button
                  onPress={uploadRecording}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={uploadProgress > 0}
                >
                  {uploadProgress > 0 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上传中 {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      上传录音
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Recording Tips */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">录制提示</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• 在安静的环境中录制，避免背景噪音</li>
                <li>• 保持正常的语调和语速</li>
                <li>• 每段录制建议10-30秒即可</li>
                <li>• 仅需5秒音频即可快速复刻您的声音</li>
                <li>• 训练完成后立即可用，无需等待</li>
              </ul>
            </div>
          </div>
        </div>


        {/* Voice Samples */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">推荐训练文本</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleTexts.map((text, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 mb-3">{text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">样本 {index + 1}</span>
                  <Button 
                    size="sm"
                    mode="secondary"
                    onPress={() => setSelectedTextIndex(index)}
                  >
                    {selectedTextIndex === index ? '已选择' : '使用此文本'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}