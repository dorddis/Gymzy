/**
 * Firebase Mock
 * Mock implementation of Firebase services for testing
 */

// Mock Firebase App
const mockApp = {
  name: 'test-app',
  options: {
    projectId: 'test-project',
    apiKey: 'test-api-key',
  },
};

// Mock Firestore
const mockFirestore = {
  collection: jest.fn(() => mockFirestore),
  doc: jest.fn(() => mockFirestore),
  get: jest.fn(() => Promise.resolve({
    exists: true,
    data: () => ({ id: 'test-doc', name: 'Test Document' }),
    id: 'test-doc',
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  add: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  where: jest.fn(() => mockFirestore),
  orderBy: jest.fn(() => mockFirestore),
  limit: jest.fn(() => mockFirestore),
  onSnapshot: jest.fn((callback) => {
    // Simulate real-time updates
    setTimeout(() => {
      callback({
        docs: [
          {
            id: 'test-doc',
            data: () => ({ id: 'test-doc', name: 'Test Document' }),
          },
        ],
        forEach: jest.fn(),
      });
    }, 100);
    // Return unsubscribe function
    return jest.fn();
  }),
};

// Mock Auth
const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
  },
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: mockAuth.currentUser,
  })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: mockAuth.currentUser,
  })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback) => {
    // Simulate auth state change
    setTimeout(() => callback(mockAuth.currentUser), 100);
    // Return unsubscribe function
    return jest.fn();
  }),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
};

// Mock Storage
const mockStorage = {
  ref: jest.fn(() => mockStorage),
  child: jest.fn(() => mockStorage),
  put: jest.fn(() => Promise.resolve({
    ref: mockStorage,
    metadata: {
      name: 'test-file.jpg',
      size: 1024,
      contentType: 'image/jpeg',
    },
  })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/test-file.jpg')),
  delete: jest.fn(() => Promise.resolve()),
  listAll: jest.fn(() => Promise.resolve({
    items: [mockStorage],
    prefixes: [],
  })),
};

// Firebase SDK exports
export const initializeApp = jest.fn(() => mockApp);
export const getApps = jest.fn(() => [mockApp]);
export const getApp = jest.fn(() => mockApp);

// Firestore exports
export const getFirestore = jest.fn(() => mockFirestore);
export const collection = jest.fn(() => mockFirestore);
export const doc = jest.fn(() => mockFirestore);
export const getDoc = jest.fn(() => Promise.resolve({
  exists: () => true,
  data: () => ({ id: 'test-doc', name: 'Test Document' }),
  id: 'test-doc',
}));
export const getDocs = jest.fn(() => Promise.resolve({
  docs: [
    {
      id: 'test-doc',
      data: () => ({ id: 'test-doc', name: 'Test Document' }),
    },
  ],
  forEach: jest.fn(),
}));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve({ id: 'new-doc-id' }));
export const query = jest.fn(() => mockFirestore);
export const where = jest.fn(() => mockFirestore);
export const orderBy = jest.fn(() => mockFirestore);
export const limit = jest.fn(() => mockFirestore);
export const onSnapshot = jest.fn((query, callback) => {
  setTimeout(() => {
    callback({
      docs: [
        {
          id: 'test-doc',
          data: () => ({ id: 'test-doc', name: 'Test Document' }),
        },
      ],
      forEach: jest.fn(),
    });
  }, 100);
  return jest.fn();
});

// Auth exports
export const getAuth = jest.fn(() => mockAuth);
export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({
  user: mockAuth.currentUser,
}));
export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({
  user: mockAuth.currentUser,
}));
export const signOut = jest.fn(() => Promise.resolve());
export const onAuthStateChanged = jest.fn((auth, callback) => {
  setTimeout(() => callback(mockAuth.currentUser), 100);
  return jest.fn();
});
export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());
export const updatePassword = jest.fn(() => Promise.resolve());
export const updateProfile = jest.fn(() => Promise.resolve());

// Storage exports
export const getStorage = jest.fn(() => mockStorage);
export const ref = jest.fn(() => mockStorage);
export const uploadBytes = jest.fn(() => Promise.resolve({
  ref: mockStorage,
  metadata: {
    name: 'test-file.jpg',
    size: 1024,
    contentType: 'image/jpeg',
  },
}));
export const getDownloadURL = jest.fn(() => Promise.resolve('https://example.com/test-file.jpg'));
export const deleteObject = jest.fn(() => Promise.resolve());
export const listAll = jest.fn(() => Promise.resolve({
  items: [mockStorage],
  prefixes: [],
}));

// Default export
export default {
  initializeApp,
  getApps,
  getApp,
  getFirestore,
  getAuth,
  getStorage,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
};
