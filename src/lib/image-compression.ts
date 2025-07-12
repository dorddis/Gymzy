interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg'
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > opts.maxWidth!) {
        height = Math.round((height * opts.maxWidth!) / width);
        width = opts.maxWidth!;
      }

      if (height > opts.maxHeight!) {
        width = Math.round((width * opts.maxHeight!) / height);
        height = opts.maxHeight!;
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw image with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create new file from blob
          const compressedFile = new File([blob], file.name, {
            type: opts.mimeType,
            lastModified: file.lastModified,
          });

          // Clean up
          URL.revokeObjectURL(img.src);
          resolve(compressedFile);
        },
        opts.mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
}

export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Skip compression for non-video files
  if (!file.type.startsWith('video/')) {
    return file;
  }

  // For now, we&apos;ll just return the original file
  // Video compression would require a more complex solution
  // like using WebCodecs API or a server-side solution
  return file;
}

export async function compressMedia(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (file.type.startsWith('image/')) {
    return compressImage(file, options);
  } else if (file.type.startsWith('video/')) {
    return compressVideo(file, options);
  }
  return file;
} 