import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Trash2, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  onFilesChange: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  preview?: string;
}

export function MediaUpload({ onFilesChange, onUploadProgress, isUploading, disabled }: MediaUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported. Please upload images (JPEG, PNG, GIF) or videos (MP4, MOV).`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 10MB limit. Please choose a smaller file.`
      };
    }

    return { isValid: true };
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For videos, we'll use a placeholder
        resolve('/video-placeholder.png');
      }
    });
  };

  const processFiles = async (selectedFiles: File[]) => {
    // Validate each file
    const validationResults = selectedFiles.map(file => ({
      file,
      ...validateFile(file)
    }));

    // Separate valid and invalid files
    const validFiles = validationResults.filter(result => result.isValid);
    const invalidFiles = validationResults.filter(result => !result.isValid);

    // Show error messages for invalid files
    invalidFiles.forEach(result => {
      toast({
        title: "Invalid file",
        description: result.error,
        variant: "destructive",
      });
    });

    // Create previews for valid files
    const filesWithPreviews = await Promise.all(
      validFiles.map(async ({ file }) => ({
        file,
        status: 'pending' as const,
        preview: await createFilePreview(file)
      }))
    );

    // Add valid files to state
    if (filesWithPreviews.length > 0) {
      setFiles(prev => [...prev, ...filesWithPreviews]);
      onFilesChange(filesWithPreviews.map(f => f.file));
      
      // Show success message if any files were added
      if (filesWithPreviews.length === selectedFiles.length) {
        toast({
          title: "Files added",
          description: `Added ${filesWithPreviews.length} file(s) to upload.`,
        });
      } else {
        toast({
          title: "Partial success",
          description: `Added ${filesWithPreviews.length} of ${selectedFiles.length} files. Some files were invalid.`,
          variant: "warning",
        });
      }
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    processFiles(selectedFiles);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  }, [onFilesChange, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [onFilesChange, toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      onFilesChange(newFiles.map(f => f.file));
      return newFiles;
    });
  }, [onFilesChange]);

  const updateFileStatus = useCallback((index: number, status: FileWithStatus['status'], progress?: number, error?: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, status, progress, error } : file
    ));
  }, []);

  const getFileIcon = (file: FileWithStatus) => {
    switch (file.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <ImageIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="media-upload"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <label
          htmlFor="media-upload"
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer",
            (disabled || isUploading) && "cursor-not-allowed"
          )}
        >
          <Camera className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            {isUploading ? 'Uploading...' : 'Drag and drop or tap to upload'}
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {files.map((fileWithStatus, index) => (
            <div
              key={index}
              className="relative bg-gray-50 rounded-lg overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-square relative">
                {fileWithStatus.preview && (
                  <img
                    src={fileWithStatus.preview}
                    alt={fileWithStatus.file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Status overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  {getFileIcon(fileWithStatus)}
                </div>
              </div>

              {/* File info and controls */}
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{fileWithStatus.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8"
                    disabled={isUploading}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                {fileWithStatus.status === 'uploading' && fileWithStatus.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={fileWithStatus.progress} className="w-full" />
                    <span className="text-xs text-gray-500 mt-1 block">
                      {fileWithStatus.progress}%
                    </span>
                  </div>
                )}
                
                {fileWithStatus.status === 'error' && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {fileWithStatus.error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 