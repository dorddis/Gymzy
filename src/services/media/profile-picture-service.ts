import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { compressMedia } from '@/lib/image-compression';

export interface ProfilePicture {
  id: string;
  userId: string;
  url: string;
  thumbnailUrl: string;
  originalFilename: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  isActive: boolean;
  uploadedAt: Timestamp;
  cloudinaryPublicId: string;
  cloudinaryOriginalId?: string;
  metadata?: {
    camera?: string;
    location?: string;
    filters?: string[];
  };
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  width: number;
  height: number;
}

export class ProfilePictureService {
  private static readonly COLLECTION_NAME = 'profile_pictures';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  static async uploadProfilePicture(
    userId: string,
    originalFile: File,
    croppedBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<ProfilePicture> {
    // Validate file
    this.validateFile(originalFile);

    const pictureId = `${userId}_${Date.now()}`;

    try {
      // Upload cropped version to Cloudinary
      const croppedFile = new File([croppedBlob], `profile_${pictureId}.jpg`, {
        type: 'image/jpeg'
      });

      const cloudinaryResponse = await this.uploadToCloudinary(
        croppedFile,
        userId,
        pictureId,
        onProgress
      );

      // Create profile picture record
      const cameraInfo = this.extractCameraInfo(originalFile);
      const metadata: ProfilePicture['metadata'] = {
        filters: []
      };

      // Only include camera info if it exists (Firestore doesn't allow undefined)
      if (cameraInfo) {
        metadata.camera = cameraInfo;
      }

      // Log Cloudinary response for debugging
      console.log('Cloudinary upload successful:', {
        url: cloudinaryResponse.secure_url,
        public_id: cloudinaryResponse.public_id,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        format: cloudinaryResponse.format
      });

      const profilePicture: ProfilePicture = {
        id: pictureId,
        userId,
        url: cloudinaryResponse.secure_url,
        thumbnailUrl: this.generateThumbnailUrl(cloudinaryResponse.secure_url),
        originalFilename: originalFile.name,
        fileSize: originalFile.size,
        dimensions: {
          width: cloudinaryResponse.width,
          height: cloudinaryResponse.height
        },
        isActive: false, // Will be set to active separately
        uploadedAt: Timestamp.now(),
        cloudinaryPublicId: cloudinaryResponse.public_id,
        metadata
      };

      console.log('Profile picture record created:');
      console.log('  ID:', profilePicture.id);
      console.log('  URL:', profilePicture.url);
      console.log('  Thumbnail:', profilePicture.thumbnailUrl);

      // Save to Firestore
      await setDoc(
        doc(db, this.COLLECTION_NAME, pictureId),
        profilePicture
      );

      return profilePicture;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
    }
  }

  static async setActiveProfilePicture(
    userId: string,
    pictureId: string
  ): Promise<void> {
    try {
      // Get all user&apos;s profile pictures
      const userPicturesQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(userPicturesQuery);
      
      // Update all pictures to inactive, then set the selected one to active
      const batch = snapshot.docs.map(async (docSnapshot) => {
        const isActive = docSnapshot.id === pictureId;
        await updateDoc(docSnapshot.ref, { isActive });
      });

      await Promise.all(batch);

      // Update user profile with new picture URL
      const activeProfile = await this.getProfilePicture(pictureId);
      if (activeProfile) {
        console.log('Updating user_profiles with new picture:');
        console.log('  User ID:', userId);
        console.log('  Picture ID:', pictureId);
        console.log('  New URL:', activeProfile.url);
        await updateDoc(doc(db, 'user_profiles', userId), {
          profilePicture: activeProfile.url,
          updatedAt: Timestamp.now()
        });
        console.log('✅ user_profiles updated successfully');
      } else {
        console.error('❌ Failed to get active profile picture for ID:', pictureId);
      }
    } catch (error) {
      console.error('Error setting active profile picture:', error);
      throw new Error('Failed to set active profile picture');
    }
  }

  static async getProfilePicture(pictureId: string): Promise<ProfilePicture | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, pictureId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as ProfilePicture;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile picture:', error);
      return null;
    }
  }

  static async getUserProfilePictures(
    userId: string,
    limitCount: number = 10
  ): Promise<ProfilePicture[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ProfilePicture);
    } catch (error) {
      console.error('Error getting user profile pictures:', error);
      return [];
    }
  }

  static async getActiveProfilePicture(userId: string): Promise<ProfilePicture | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as ProfilePicture;
    } catch (error) {
      console.error('Error getting active profile picture:', error);
      return null;
    }
  }

  static async deleteProfilePicture(pictureId: string): Promise<void> {
    try {
      const profilePicture = await this.getProfilePicture(pictureId);
      if (!profilePicture) {
        throw new Error('Profile picture not found');
      }

      // Delete from Cloudinary
      if (profilePicture.cloudinaryPublicId) {
        await this.deleteFromCloudinary(profilePicture.cloudinaryPublicId);
      }

      // Delete from Firestore
      await updateDoc(doc(db, this.COLLECTION_NAME, pictureId), {
        isActive: false,
        deletedAt: Timestamp.now()
      });

      // If this was the active picture, clear it from user profile
      if (profilePicture.isActive) {
        await updateDoc(doc(db, 'user_profiles', profilePicture.userId), {
          profilePicture: null,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw new Error('Failed to delete profile picture');
    }
  }

  private static async uploadToCloudinary(
    file: File,
    userId: string,
    pictureId: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryResponse> {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        // Compress the file before upload
        const compressedFile = await compressMedia(file);

        // Create form data
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('upload_preset', 'gymzy_profiles'); // Different preset for profiles
        // Note: cloud_name is in the URL, not in form data

        // Only add folder and public_id if the upload preset allows them
        // If your preset doesn't allow these, comment them out or configure the preset
        // to allow "folder" and "public_id" overrides
        formData.append('folder', `users/${userId}/profile`);
        formData.append('public_id', pictureId);

        // Log what we're sending for debugging
        console.log('Cloudinary upload attempt:', {
          preset: 'gymzy_profiles',
          folder: `users/${userId}/profile`,
          public_id: pictureId,
          fileSize: compressedFile.size,
          fileType: compressedFile.type
        });

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

        // Create promise for upload
        const uploadPromise = new Promise<CloudinaryResponse>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid response from Cloudinary'));
              }
            } else {
              // Log detailed error information
              console.error('Cloudinary upload failed:', {
                status: xhr.status,
                statusText: xhr.statusText,
                response: xhr.responseText,
                headers: xhr.getAllResponseHeaders()
              });
              let errorMessage = `Upload failed with status ${xhr.status}`;
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.error?.message) {
                  errorMessage += `: ${errorResponse.error.message}`;
                }
              } catch (e) {
                // Response not JSON, use status text
                if (xhr.statusText) {
                  errorMessage += `: ${xhr.statusText}`;
                }
              }
              reject(new Error(errorMessage));
            }
          };

          xhr.onerror = () => {
            reject(new Error('Network error during upload'));
          };

          xhr.ontimeout = () => {
            reject(new Error('Upload timeout'));
          };
        });

        // Start the upload
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`);
        xhr.send(formData);

        // Wait for the upload to complete
        return await uploadPromise;
      } catch (error) {
        retries++;
        if (retries === this.MAX_RETRIES) {
          throw new Error(`Failed to upload after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
      }
    }

    throw new Error('Upload failed after all retries');
  }

  private static async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      // Note: Deleting from Cloudinary requires server-side implementation
      // For now, we&apos;ll just mark as deleted in our database
      // In production, you'd want to implement a server endpoint for deletion
      console.log(`Would delete Cloudinary image: ${publicId}`);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      // Don&apos;t throw error as this is not critical
    }
  }

  private static generateThumbnailUrl(originalUrl: string): string {
    // Use Cloudinary&apos;s transformation API to generate thumbnail
    // Replace /upload/ with /upload/w_150,h_150,c_fill/
    return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
  }

  private static validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please upload an image smaller than 5MB.');
    }
  }

  private static extractCameraInfo(file: File): string | undefined {
    // This would require EXIF data parsing
    // For now, return undefined
    return undefined;
  }
}
