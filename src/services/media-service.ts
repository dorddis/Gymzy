import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadMedia(file: File, userId: string, workoutId: string): Promise<string> {
  // Create a unique file name using timestamp and original name
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `users/${userId}/workouts/${workoutId}/${fileName}`;
  
  // Create a reference to the file location
  const storageRef = ref(storage, path);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

export async function uploadMultipleMedia(
  files: File[],
  userId: string,
  workoutId: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadMedia(file, userId, workoutId));
  return Promise.all(uploadPromises);
} 