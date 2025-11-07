import { compressMedia } from '@/lib/image-compression';

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

interface UploadProgress {
  fileIndex: number;
  progress: number;
}

interface UploadResult {
  result?: CloudinaryResponse;
  error?: Error;
  index: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_CONCURRENT_UPLOADS = 3; // Limit concurrent uploads

export async function uploadMedia(
  file: File,
  userId: string,
  workoutId: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryResponse> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Compress the file before upload
      const compressedFile = await compressMedia(file);

      // Create form data
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', 'gymzy_workouts');
      // Note: cloud_name is in the URL, not in form data (causes 400 error if included)
      formData.append('folder', `users/${userId}/workouts/${workoutId}`);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }

      // Create a promise that resolves when the upload is complete
      const uploadPromise = new Promise<CloudinaryResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              secure_url: data.secure_url,
              public_id: data.public_id,
              format: data.format,
              resource_type: data.resource_type,
              bytes: data.bytes,
              created_at: data.created_at,
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
      });

      // Start the upload
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`);
      xhr.send(formData);

      // Wait for the upload to complete
      return await uploadPromise;
    } catch (error) {
      retries++;
      if (retries === MAX_RETRIES) {
        throw new Error(`Failed to upload after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
    }
  }

  throw new Error('Upload failed after all retries');
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
  let completedFiles = 0;

  // Create a queue of files to upload
  const queue = files.map((file, index) => ({ file, index }));
  
  // Process files in chunks to limit concurrent uploads
  while (queue.length > 0) {
    const chunk = queue.splice(0, MAX_CONCURRENT_UPLOADS);
    const uploadPromises = chunk.map(({ file, index }) => 
      uploadMedia(
        file,
        userId,
        workoutId,
        (fileProgress) => {
          // Calculate overall progress including this file
          const overallProgress = Math.round(
            ((completedFiles + (fileProgress / 100)) / totalFiles) * 100
          );
          if (onProgress) {
            onProgress(overallProgress);
          }
        }
      )
      .then(result => {
        completedFiles++;
        return { result, index } as UploadResult;
      })
      .catch(error => {
        completedFiles++;
        errors.push(error);
        return { error, index } as UploadResult;
      })
    );

    // Wait for all uploads in the chunk to complete
    const chunkResults = await Promise.all(uploadPromises);
    
    // Process results
    chunkResults.forEach(({ result, error, index }) => {
      if (result) {
        results[index] = result;
      }
    });
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