declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export async function uploadMedia(file: File, userId: string, workoutId: string): Promise<CloudinaryResponse> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gymzy_workouts');
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);
    formData.append('folder', `users/${userId}/workouts/${workoutId}`);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      format: data.format,
      resource_type: data.resource_type,
      bytes: data.bytes,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload media file');
  }
}

export async function uploadMultipleMedia(
  files: File[],
  userId: string,
  workoutId: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryResponse[]> {
  const results: CloudinaryResponse[] = [];
  const errors: Error[] = [];
  const totalFiles = files.length;

  // Process files sequentially
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const result = await uploadMedia(file, userId, workoutId);
      results.push(result);
      
      // Calculate and report progress
      if (onProgress) {
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        onProgress(progress);
      }
    } catch (error) {
      console.error(`Failed to upload file ${files[i].name}:`, error);
      errors.push(error as Error);
    }
  }

  // If any files failed to upload, throw an error with details
  if (errors.length > 0) {
    throw new Error(
      `Failed to upload ${errors.length} of ${files.length} files. ` +
      `Successfully uploaded: ${results.length} files. ` +
      `Errors: ${errors.map(e => e.message).join(', ')}`
    );
  }

  return results;
} 