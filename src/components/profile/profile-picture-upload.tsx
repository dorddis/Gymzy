"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Camera, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  Download,
  Trash2,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onUpload: (file: File, croppedBlob: Blob, onProgress?: (progress: number) => void) => Promise<void>;
  onRemove?: () => Promise<void>;
  isLoading?: boolean;
}

export function ProfilePictureUpload({
  currentPicture,
  onUpload,
  onRemove,
  isLoading = false
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Debug: Log when currentPicture changes
  React.useEffect(() => {
    console.log('ProfilePictureUpload: currentPicture changed to:', currentPicture);
  }, [currentPicture]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    rotation: 0,
    flipHorizontal: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Load image to get actual dimensions
      const img = new Image();
      img.onload = () => {
        // Use the full image dimensions for crop
        const size = Math.min(img.width, img.height);
        setCropData({
          x: 0,
          y: 0,
          width: size,
          height: size,
          rotation: 0,
          flipHorizontal: false
        });
        console.log('Image loaded:', {
          actualWidth: img.width,
          actualHeight: img.height,
          cropSize: size
        });
        setIsEditing(true);
      };
      img.src = url;
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const getCroppedImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const image = new Image();

      if (!canvas || !previewUrl) {
        reject(new Error('Canvas or preview not available'));
        return;
      }

      image.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        console.log('Creating cropped image:', {
          imageWidth: image.width,
          imageHeight: image.height,
          cropData
        });

        // Set canvas to output size (200x200 for profile pictures)
        const outputSize = 200;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Calculate crop area (center crop to square)
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;

        console.log('Crop calculation:', {
          sourceX,
          sourceY,
          sourceSize,
          outputSize
        });

        // Clear canvas and apply transformations
        ctx.save();
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.rotate((cropData.rotation * Math.PI) / 180);
        if (cropData.flipHorizontal) {
          ctx.scale(-1, 1);
        }

        // Draw cropped and scaled image
        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          -outputSize / 2,
          -outputSize / 2,
          outputSize,
          outputSize
        );

        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Cropped blob created:', {
              size: blob.size,
              type: blob.type
            });
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.95);
      };

      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = previewUrl;
    });
  }, [previewUrl, cropData]);

  const handleSave = async () => {
    if (!selectedFile || !previewUrl) return;

    try {
      const croppedBlob = await getCroppedImage();
      setUploadProgress(0);

      await onUpload(selectedFile, croppedBlob, (progress) => {
        setUploadProgress(progress);
      });

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error saving profile picture:', error);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isEditing && previewUrl) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Edit Profile Picture</h3>
            
            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-full border-4 border-gray-200"
                  style={{
                    transform: `rotate(${cropData.rotation}deg) scaleX(${cropData.flipHorizontal ? -1 : 1})`
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Editing Controls */}
            <div className="space-y-3">
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCropData(prev => ({ ...prev, rotation: prev.rotation + 90 }))}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCropData(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading || uploadProgress > 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || uploadProgress > 0}
                >
                  {isLoading || uploadProgress > 0 ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Profile Picture</h3>
          
          {/* Current Picture */}
          <div className="flex flex-col items-center gap-2">
            {/* Debug URL Display */}
            <div className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all max-w-md">
              <strong>URL:</strong> {currentPicture || 'None'}
            </div>

            <Avatar className="w-32 h-32">
              <AvatarImage src={currentPicture} alt="Profile" />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials(user?.profile?.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Supports JPEG, PNG, WebP (max 5MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            {currentPicture && onRemove && (
              <Button
                variant="destructive"
                onClick={onRemove}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
