import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'firebase/storage';
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
import { storage, db } from '@/lib/firebase';

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
  metadata?: {
    camera?: string;
    location?: string;
    filters?: string[];
  };
}

export class ProfilePictureService {
  private static readonly COLLECTION_NAME = 'profile_pictures';
  private static readonly STORAGE_PATH = 'profile-pictures';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  static async uploadProfilePicture(
    userId: string,
    originalFile: File,
    croppedBlob: Blob
  ): Promise<ProfilePicture> {
    // Validate file
    this.validateFile(originalFile);

    const pictureId = `${userId}_${Date.now()}`;
    
    try {
      // Upload original and cropped versions
      const [originalUrl, croppedUrl] = await Promise.all([
        this.uploadFile(originalFile, `${this.STORAGE_PATH}/${userId}/original/${pictureId}`),
        this.uploadFile(croppedBlob, `${this.STORAGE_PATH}/${userId}/cropped/${pictureId}`)
      ]);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(croppedBlob);

      // Create profile picture record
      const profilePicture: ProfilePicture = {
        id: pictureId,
        userId,
        url: croppedUrl,
        thumbnailUrl: croppedUrl, // For now, using same URL
        originalFilename: originalFile.name,
        fileSize: originalFile.size,
        dimensions,
        isActive: false, // Will be set to active separately
        uploadedAt: Timestamp.now(),
        metadata: {
          camera: this.extractCameraInfo(originalFile),
          filters: []
        }
      };

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
      // Get all user's profile pictures
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
        await updateDoc(doc(db, 'user_profiles', userId), {
          profilePicture: activeProfile.url,
          updatedAt: Timestamp.now()
        });
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

      // Delete from storage
      const originalRef = ref(storage, `${this.STORAGE_PATH}/${profilePicture.userId}/original/${pictureId}`);
      const croppedRef = ref(storage, `${this.STORAGE_PATH}/${profilePicture.userId}/cropped/${pictureId}`);
      
      await Promise.all([
        deleteObject(originalRef).catch(() => {}), // Ignore errors if file doesn't exist
        deleteObject(croppedRef).catch(() => {})
      ]);

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

  private static async uploadFile(file: File | Blob, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  private static validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please upload an image smaller than 5MB.');
    }
  }

  private static async getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private static extractCameraInfo(file: File): string | undefined {
    // This would require EXIF data parsing
    // For now, return undefined
    return undefined;
  }
}
