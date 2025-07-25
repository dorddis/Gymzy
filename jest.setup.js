/**
 * Jest Setup File
 * Global test setup and configuration
 */

import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with accessibility testing
expect.extend(toHaveNoViolations);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY = 'test-google-ai-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress specific warnings/errors that are expected in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('Warning: ReactDOM.render is deprecated') ||
        message.includes('Warning: An invalid form control') ||
        message.includes('Firebase: No Firebase App') ||
        message.includes('ResizeObserver loop limit exceeded')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('componentWillReceiveProps') ||
        message.includes('componentWillUpdate') ||
        message.includes('componentWillMount')
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock performance.now
Object.defineProperty(performance, 'now', {
  writable: true,
  value: jest.fn(() => Date.now()),
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  writable: true,
  value: jest.fn(() => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9)),
});

// Mock File constructor
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks;
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }
  
  readAsDataURL() {
    this.readyState = 2;
    this.result = 'data:image/png;base64,mocked-base64-data';
    if (this.onload) this.onload();
  }
  
  readAsText() {
    this.readyState = 2;
    this.result = 'mocked-text-content';
    if (this.onload) this.onload();
  }
};

// Mock Blob
global.Blob = class Blob {
  constructor(chunks = [], options = {}) {
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
  }
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock HTMLCanvasElement.toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mocked-canvas-data');

// Global test utilities
global.testUtils = {
  // Helper to create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      fitnessLevel: 'intermediate',
      fitnessGoals: ['general_fitness'],
      activityLevel: 'moderately_active',
    },
    preferences: {
      theme: 'light',
      language: 'en',
      units: 'metric',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  // Helper to create mock workout
  createMockWorkout: (overrides = {}) => ({
    id: 'test-workout-id',
    name: 'Test Workout',
    description: 'A test workout',
    exercises: [
      {
        id: 'exercise-1',
        exerciseId: 'push-ups',
        name: 'Push-ups',
        sets: [
          { id: 'set-1', type: 'normal', reps: 10, weight: 0 },
        ],
        restTime: 60,
        order: 1,
        muscleGroups: ['chest', 'triceps'],
        equipment: ['bodyweight'],
      },
    ],
    duration: 30,
    difficulty: 'intermediate',
    targetMuscles: ['chest', 'triceps'],
    equipment: ['bodyweight'],
    workoutType: 'strength',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'test-user-id',
    isPublic: false,
    isTemplate: false,
    ...overrides,
  }),

  // Helper to create mock chat message
  createMockChatMessage: (overrides = {}) => ({
    id: 'test-message-id',
    role: 'user',
    content: 'Test message',
    timestamp: new Date('2024-01-01'),
    userId: 'test-user-id',
    ...overrides,
  }),

  // Helper to wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock API response
  createMockApiResponse: (data, success = true) => ({
    success,
    data: success ? data : undefined,
    error: success ? undefined : { code: 'TEST_ERROR', message: 'Test error' },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: 'test-request-id',
      version: '1.0.0',
    },
  }),
};

// Setup and teardown for each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
});

afterEach(() => {
  // Clean up any timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
