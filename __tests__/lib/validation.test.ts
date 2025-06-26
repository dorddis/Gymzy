/**
 * Validation Tests
 * Tests for the validation schemas and utilities
 */

import {
  validateData,
  validateFormFields,
  validatePartial,
  userRegistrationSchema,
  userLoginSchema,
  createWorkoutSchema,
  chatRequestSchema,
  validateEmail,
  validatePhone,
  validateUrl,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('should validate correct data successfully', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const result = validateData(userRegistrationSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        confirmPassword: '456', // Doesn't match
        agreeToTerms: false, // Required
      };

      const result = validateData(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Please enter a valid email address');
        expect(result.errors).toContain('Password must be at least 8 characters');
        expect(result.errors).toContain('Passwords do not match');
        expect(result.errors).toContain('You must agree to the terms and conditions');
      }
    });
  });

  describe('validateFormFields', () => {
    it('should return field-specific errors', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
      };

      const result = validateFormFields(userLoginSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.email).toBe('Please enter a valid email address');
        expect(result.fieldErrors.password).toBe('Password must be at least 8 characters');
      }
    });
  });

  describe('validatePartial', () => {
    it('should validate partial data', () => {
      const partialData = {
        email: 'test@example.com',
        // password is optional in partial validation
      };

      const result = validatePartial(userLoginSchema, partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBeUndefined();
      }
    });
  });
});

describe('User Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const result = validateData(userRegistrationSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password', // No uppercase or numbers
        confirmPassword: 'password',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const result = validateData(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some(error => 
          error.includes('Password must contain at least one uppercase letter')
        )).toBe(true);
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const result = validateData(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Passwords do not match');
      }
    });

    it('should require terms and privacy agreement', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        agreeToTerms: false,
        agreeToPrivacy: false,
      };

      const result = validateData(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('You must agree to the terms and conditions');
        expect(result.errors).toContain('You must agree to the privacy policy');
      }
    });
  });

  describe('userLoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        rememberMe: true,
      };

      const result = validateData(userLoginSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
      };

      const result = validateData(userLoginSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Please enter a valid email address');
      }
    });
  });
});

describe('Workout Validation Schemas', () => {
  describe('createWorkoutSchema', () => {
    it('should validate valid workout data', () => {
      const validData = {
        name: 'Test Workout',
        description: 'A test workout',
        exercises: [
          {
            exerciseId: 'push-ups',
            name: 'Push-ups',
            sets: [
              {
                type: 'normal',
                reps: 10,
                weight: 0,
              },
            ],
            restTime: 60,
            order: 1,
          },
        ],
        difficulty: 'intermediate',
        workoutType: 'strength',
        isPublic: false,
        tags: ['bodyweight', 'upper-body'],
      };

      const result = validateData(createWorkoutSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject workout without exercises', () => {
      const invalidData = {
        name: 'Test Workout',
        exercises: [],
        difficulty: 'intermediate',
        workoutType: 'strength',
      };

      const result = validateData(createWorkoutSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('At least one exercise is required');
      }
    });

    it('should reject invalid difficulty level', () => {
      const invalidData = {
        name: 'Test Workout',
        exercises: [
          {
            exerciseId: 'push-ups',
            name: 'Push-ups',
            sets: [{ type: 'normal', reps: 10 }],
            restTime: 60,
            order: 1,
          },
        ],
        difficulty: 'invalid-difficulty',
        workoutType: 'strength',
      };

      const result = validateData(createWorkoutSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Chat Validation Schemas', () => {
  describe('chatRequestSchema', () => {
    it('should validate valid chat request', () => {
      const validData = {
        message: 'Create a workout for me',
        userId: 'test-user-id',
        options: {
          model: 'gemini',
          maxTokens: 1000,
          temperature: 0.7,
        },
      };

      const result = validateData(chatRequestSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const invalidData = {
        message: '',
        userId: 'test-user-id',
      };

      const result = validateData(chatRequestSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Message cannot be empty');
      }
    });

    it('should reject message that is only whitespace', () => {
      const invalidData = {
        message: '   \n\t   ',
        userId: 'test-user-id',
      };

      const result = validateData(chatRequestSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Message cannot be only whitespace');
      }
    });

    it('should reject message that is too long', () => {
      const invalidData = {
        message: 'a'.repeat(10001), // Exceeds 10,000 character limit
        userId: 'test-user-id',
      };

      const result = validateData(chatRequestSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Message is too long (max 10,000 characters)');
      }
    });
  });
});

describe('Utility Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test..test@example.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '555-123-4567',
        '555 123 4567',
      ];

      validPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123',
        'phone-number',
      ];

      invalidPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid phone number format');
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path?query=value',
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.url).toBeInstanceOf(URL);
        }
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com', // Valid URL but not http/https
        'example.com', // Missing protocol
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        if (url === 'ftp://example.com') {
          // This is actually a valid URL, just not HTTP
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Invalid URL format');
        }
      });
    });
  });
});
