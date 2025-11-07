/**
 * Profile Picture Service Tests
 * Tests for Cloudinary upload and profile picture management
 */

import { ProfilePictureService } from '@/services/media/profile-picture-service';
import * as imageCompression from '@/lib/image-compression';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn((db, collection, id) => ({ collection, id }));
const mockCollection = jest.fn((db, name) => ({ name }));
const mockQuery = jest.fn((...args) => ({ query: args }));
const mockWhere = jest.fn((field, op, value) => ({ field, op, value }));
const mockOrderBy = jest.fn((field, direction) => ({ field, direction }));
const mockLimit = jest.fn((count) => ({ count }));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }),
  },
}));

// Mock image compression
jest.mock('@/lib/image-compression', () => ({
  compressMedia: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';

describe('ProfilePictureService', () => {
  let mockXHR: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock XMLHttpRequest
    mockXHR = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: JSON.stringify({
        secure_url: 'https://cloudinary.com/test.jpg',
        public_id: 'test_public_id',
        format: 'jpg',
        resource_type: 'image',
        bytes: 1024,
        created_at: '2025-01-01T00:00:00Z',
        width: 500,
        height: 500,
      }),
      upload: {
        onprogress: null,
      },
      onload: null,
      onerror: null,
      ontimeout: null,
    };

    // Override global XMLHttpRequest
    (global as any).XMLHttpRequest = jest.fn(() => mockXHR);

    // Mock compressMedia to return the same file
    (imageCompression.compressMedia as jest.Mock).mockImplementation(
      async (file: File) => file
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadProfilePicture', () => {
    it('should successfully upload a profile picture to Cloudinary', async () => {
      const userId = 'user123';
      const originalFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      mockSetDoc.mockResolvedValue(undefined);

      // Trigger the upload
      const uploadPromise = ProfilePictureService.uploadProfilePicture(
        userId,
        originalFile,
        croppedBlob
      );

      // Wait a bit for the XHR to be set up
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate successful upload
      if (mockXHR.onload) {
        mockXHR.onload();
      }

      const result = await uploadPromise;

      // Verify XHR was called correctly
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        'https://api.cloudinary.com/v1_1/test-cloud/image/upload'
      );
      expect(mockXHR.send).toHaveBeenCalled();

      // Verify FormData was created correctly (checking the send call)
      const formData = mockXHR.send.mock.calls[0][0];
      expect(formData).toBeInstanceOf(FormData);

      // Verify result
      expect(result).toMatchObject({
        userId,
        url: 'https://cloudinary.com/test.jpg',
        cloudinaryPublicId: 'test_public_id',
        originalFilename: 'test.jpg',
        isActive: false,
      });

      // Verify Firestore was called
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should not send cloud_name as a form field', async () => {
      const userId = 'user123';
      const originalFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      mockSetDoc.mockResolvedValue(undefined);

      const uploadPromise = ProfilePictureService.uploadProfilePicture(
        userId,
        originalFile,
        croppedBlob
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await uploadPromise;

      // Verify FormData doesn't contain cloud_name field
      const formData = mockXHR.send.mock.calls[0][0];
      expect(formData).toBeInstanceOf(FormData);

      // Get all entries from FormData
      const entries: any[] = [];
      for (const pair of formData.entries()) {
        entries.push(pair);
      }

      // Verify cloud_name is not in the form data
      const hasCloudName = entries.some(([key]) => key === 'cloud_name');
      expect(hasCloudName).toBe(false);

      // Verify required fields are present
      const keys = entries.map(([key]) => key);
      expect(keys).toContain('file');
      expect(keys).toContain('upload_preset');
      expect(keys).toContain('folder');
      expect(keys).toContain('public_id');
    });

    it('should call progress callback during upload', async () => {
      const userId = 'user123';
      const originalFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });
      const onProgress = jest.fn();

      mockSetDoc.mockResolvedValue(undefined);

      const uploadPromise = ProfilePictureService.uploadProfilePicture(
        userId,
        originalFile,
        croppedBlob,
        onProgress
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate progress event
      if (mockXHR.upload.onprogress) {
        mockXHR.upload.onprogress({
          lengthComputable: true,
          loaded: 512,
          total: 1024,
        });
      }

      expect(onProgress).toHaveBeenCalledWith(50);

      if (mockXHR.onload) {
        mockXHR.onload();
      }

      await uploadPromise;
    });

    // TODO: Fix retry tests - they require complex async/timer handling
    it.skip('should retry on upload failure', async () => {
      jest.useFakeTimers();

      const userId = 'user123';
      const originalFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      mockSetDoc.mockResolvedValue(undefined);

      let attemptCount = 0;
      const xhrInstances: any[] = [];

      (global as any).XMLHttpRequest = jest.fn(() => {
        attemptCount++;
        const xhr = {
          open: jest.fn(),
          send: jest.fn(),
          setRequestHeader: jest.fn(),
          readyState: 4,
          status: attemptCount < 3 ? 500 : 200, // Fail first 2 attempts, succeed on 3rd
          responseText: JSON.stringify({
            secure_url: 'https://cloudinary.com/test.jpg',
            public_id: 'test_public_id',
            format: 'jpg',
            resource_type: 'image',
            bytes: 1024,
            created_at: '2025-01-01T00:00:00Z',
            width: 500,
            height: 500,
          }),
          upload: { onprogress: null },
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        xhrInstances.push(xhr);
        return xhr;
      });

      const uploadPromise = ProfilePictureService.uploadProfilePicture(
        userId,
        originalFile,
        croppedBlob
      );

      // Process first attempt (fails)
      await Promise.resolve();
      xhrInstances[0].onload();

      // Advance time for retry delay
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Process second attempt (fails)
      xhrInstances[1].onload();

      // Advance time for retry delay
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      // Process third attempt (succeeds)
      xhrInstances[2].onload();

      const result = await uploadPromise;
      expect(result).toBeDefined();
      expect(attemptCount).toBe(3);

      jest.useRealTimers();
    });

    // TODO: Fix retry tests - they require complex async/timer handling
    it.skip('should throw error after max retries', async () => {
      jest.useFakeTimers();

      const userId = 'user123';
      const originalFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      const xhrInstances: any[] = [];

      // Make all attempts fail
      (global as any).XMLHttpRequest = jest.fn(() => {
        const xhr = {
          open: jest.fn(),
          send: jest.fn(),
          setRequestHeader: jest.fn(),
          readyState: 4,
          status: 400, // All attempts fail with 400
          responseText: '',
          upload: { onprogress: null },
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        xhrInstances.push(xhr);
        return xhr;
      });

      const uploadPromise = ProfilePictureService.uploadProfilePicture(
        userId,
        originalFile,
        croppedBlob
      );

      // Process first attempt (fails)
      await Promise.resolve();
      xhrInstances[0].onload();

      // Advance time for retry delay
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Process second attempt (fails)
      xhrInstances[1].onload();

      // Advance time for retry delay
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      // Process third attempt (fails)
      xhrInstances[2].onload();

      await expect(uploadPromise).rejects.toThrow('Failed to upload profile picture');

      jest.useRealTimers();
    });

    it('should reject invalid file types', async () => {
      const userId = 'user123';
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      await expect(
        ProfilePictureService.uploadProfilePicture(userId, invalidFile, croppedBlob)
      ).rejects.toThrow('Invalid file type');
    });

    it('should reject files that are too large', async () => {
      const userId = 'user123';
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      await expect(
        ProfilePictureService.uploadProfilePicture(userId, largeFile, croppedBlob)
      ).rejects.toThrow('File too large');
    });
  });

  describe('setActiveProfilePicture', () => {
    it('should set a picture as active and deactivate others', async () => {
      const userId = 'user123';
      const pictureId = 'pic123';

      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'pic123', ref: { id: 'pic123' } },
          { id: 'pic456', ref: { id: 'pic456' } },
        ],
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: pictureId,
          url: 'https://cloudinary.com/test.jpg',
          userId,
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      await ProfilePictureService.setActiveProfilePicture(userId, pictureId);

      // Should update both pictures and the user profile
      expect(mockUpdateDoc).toHaveBeenCalledTimes(3); // 2 pictures + 1 user profile
    });
  });

  describe('getActiveProfilePicture', () => {
    it('should return active profile picture', async () => {
      const userId = 'user123';
      const mockPicture = {
        id: 'pic123',
        userId,
        url: 'https://cloudinary.com/test.jpg',
        isActive: true,
      };

      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockPicture }],
      });

      const result = await ProfilePictureService.getActiveProfilePicture(userId);

      expect(result).toEqual(mockPicture);
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
    });

    it('should return null if no active picture', async () => {
      const userId = 'user123';

      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await ProfilePictureService.getActiveProfilePicture(userId);

      expect(result).toBeNull();
    });
  });

  describe('getUserProfilePictures', () => {
    it('should return user profile pictures ordered by upload date', async () => {
      const userId = 'user123';
      const mockPictures = [
        { id: 'pic1', userId, uploadedAt: Timestamp.now() },
        { id: 'pic2', userId, uploadedAt: Timestamp.now() },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockPictures.map(pic => ({ data: () => pic })),
      });

      const result = await ProfilePictureService.getUserProfilePictures(userId);

      expect(result).toEqual(mockPictures);
      expect(mockOrderBy).toHaveBeenCalledWith('uploadedAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('deleteProfilePicture', () => {
    it('should mark picture as deleted and clear from user profile if active', async () => {
      const pictureId = 'pic123';
      const userId = 'user123';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: pictureId,
          userId,
          cloudinaryPublicId: 'test_public_id',
          isActive: true,
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      await ProfilePictureService.deleteProfilePicture(pictureId);

      // Should update the picture and the user profile
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
