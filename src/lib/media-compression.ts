const MAX_IMAGE_WIDTH = 2048;
const MAX_IMAGE_HEIGHT = 2048;
const IMAGE_QUALITY = 0.85;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface CompressedFile {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compress an image file using canvas API (client-side safe)
 */
export async function compressImage(file: File): Promise<CompressedFile> {
  const originalSize = file.size;

  // If image is already small enough, return as-is
  if (originalSize <= MAX_IMAGE_SIZE / 2) { // Aim for smaller files
    return {
      file,
      wasCompressed: false,
      originalSize,
      compressedSize: originalSize
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            file,
            wasCompressed: false,
            originalSize,
            compressedSize: originalSize
          });
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                wasCompressed: false,
                originalSize,
                compressedSize: originalSize
              });
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );

            resolve({
              file: compressedFile,
              wasCompressed: true,
              originalSize,
              compressedSize: compressedFile.size
            });
          },
          'image/jpeg',
          IMAGE_QUALITY
        );
      };

      img.onerror = () => {
        resolve({
          file,
          wasCompressed: false,
          originalSize,
          compressedSize: originalSize
        });
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      resolve({
        file,
        wasCompressed: false,
        originalSize,
        compressedSize: originalSize
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if a video file size is within acceptable limits
 */
export function validateVideoSize(file: File): {
  valid: boolean;
  error?: string;
  sizeInMB: number;
} {
  const sizeInMB = file.size / (1024 * 1024);

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `视频大小 (${sizeInMB.toFixed(1)}MB) 超过最大允许的 100MB。请先压缩视频再上传。`,
      sizeInMB
    };
  }

  return {
    valid: true,
    sizeInMB
  };
}

/**
 * Process media files before upload
 * - Compress images
 * - Validate video sizes
 */
export async function processMediaFiles(files: File[]): Promise<{
  processedFiles: File[];
  errors: string[];
  compressionInfo: {
    totalOriginalSize: number;
    totalCompressedSize: number;
    compressionRatio: number;
  };
}> {
  const processedFiles: File[] = [];
  const errors: string[] = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (const file of files) {
    totalOriginalSize += file.size;

    if (file.type.startsWith('image/')) {
      // Process image
      try {
        const compressed = await compressImage(file);
        processedFiles.push(compressed.file);
        totalCompressedSize += compressed.compressedSize;

        if (compressed.wasCompressed) {
          const savedMB = ((compressed.originalSize - compressed.compressedSize) / (1024 * 1024)).toFixed(1);
          console.log(`Compressed ${file.name}: saved ${savedMB}MB`);
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        // If compression fails, use original
        processedFiles.push(file);
        totalCompressedSize += file.size;
      }
    } else if (file.type.startsWith('video/')) {
      // Validate video
      const validation = validateVideoSize(file);

      if (validation.valid) {
        processedFiles.push(file);
        totalCompressedSize += file.size;
      } else {
        errors.push(validation.error || 'Video validation failed');
      }
    } else {
      // Unknown file type, add as-is
      processedFiles.push(file);
      totalCompressedSize += file.size;
    }
  }

  const compressionRatio = totalOriginalSize > 0
    ? (totalOriginalSize - totalCompressedSize) / totalOriginalSize
    : 0;

  return {
    processedFiles,
    errors,
    compressionInfo: {
      totalOriginalSize,
      totalCompressedSize,
      compressionRatio
    }
  };
}