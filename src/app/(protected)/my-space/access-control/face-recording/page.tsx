'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import Button from '@/components/ui/Button';
import { 
  ChevronLeft, 
  Camera, 
  RotateCcw,
  Upload,
  Check,
  X,
  AlertCircle,
  Info
} from 'lucide-react';

export default function FaceRecordingPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const steps = [
    { label: '正面', instruction: '请正对摄像头，保持面部清晰' },
    { label: '左侧', instruction: '请将头部稍微向左转' },
    { label: '右侧', instruction: '请将头部稍微向右转' },
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Update captured images
    const newImages = [...capturedImages];
    newImages[currentStep] = imageData;
    setCapturedImages(newImages);

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCapturing(false);
    }
  }, [currentStep, capturedImages]);

  const retakeImage = (index: number) => {
    const newImages = [...capturedImages];
    newImages[index] = '';
    setCapturedImages(newImages);
    setCurrentStep(index);
    setIsCapturing(true);
  };

  const uploadImages = async () => {
    setUploadStatus('uploading');
    
    // Simulate API call
    setTimeout(() => {
      // Mock success
      setUploadStatus('success');
      setTimeout(() => {
        router.push('/my-space');
      }, 2000);
    }, 2000);
  };

  const allImagesCapture = capturedImages.filter(img => img).length === steps.length;

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
          <Camera className="h-8 w-8 text-indigo-600" />
          人脸录入
        </h1>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">录入须知</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>请确保光线充足，面部清晰可见</li>
              <li>请摘下口罩、墨镜等遮挡物</li>
              <li>需要拍摄3个角度的照片</li>
              <li>录入成功后即可使用人脸识别通行</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                capturedImages[index] 
                  ? 'bg-green-500 text-white' 
                  : index === currentStep 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {capturedImages[index] ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              <span className={`text-sm mt-2 ${
                index === currentStep ? 'text-indigo-600 font-semibold' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 ${
                capturedImages[index] ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Camera View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Camera */}
        <div>
          <h3 className="text-lg font-semibold mb-3">摄像头预览</h3>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isCapturing && (
              <div className="absolute top-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
                <p className="text-sm font-semibold">{steps[currentStep].instruction}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            {!isCapturing ? (
              <Button
                onPress={() => setIsCapturing(true)}
                className="flex-1"
                disabled={allImagesCapture}>
                <Camera className="h-5 w-5 mr-2" />
                开始录入
              </Button>
            ) : (
              <Button
                onPress={captureImage}
                className="flex-1 bg-green-600 hover:bg-green-700">
                <Camera className="h-5 w-5 mr-2" />
                拍摄{steps[currentStep].label}
              </Button>
            )}
          </div>
        </div>

        {/* Captured Images */}
        <div>
          <h3 className="text-lg font-semibold mb-3">已拍摄照片</h3>
          <div className="grid grid-cols-3 gap-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {capturedImages[index] ? (
                    <>
                      <img
                        src={capturedImages[index]}
                        alt={step.label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => retakeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="h-8 w-8 mb-2" />
                      <span className="text-xs">{step.label}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allImagesCapture && (
            <div className="mt-6">
              {uploadStatus === 'idle' && (
                <Button
                  onPress={uploadImages}
                  className="w-full bg-green-600 hover:bg-green-700">
                  <Upload className="h-5 w-5 mr-2" />
                  上传人脸数据
                </Button>
              )}
              
              {uploadStatus === 'uploading' && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">正在上传...</p>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                    <Check className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">录入成功！</p>
                      <p className="text-sm">人脸数据已同步到门禁系统</p>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                    <X className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">上传失败</p>
                      <p className="text-sm">请检查网络连接后重试</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </ResponsiveContainer>
  );
}