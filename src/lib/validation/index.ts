/**
 * Validation Schemas Index
 * Central export point for all validation schemas
 */

// Export all user validation schemas
export * from './user-schemas';

// Export all workout validation schemas
export * from './workout-schemas';

// Export all chat validation schemas
export * from './chat-schemas';

// Re-export commonly used schemas for convenience
export {
  // User schemas
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  privacySettingsSchema,
  userPreferencesSchema,
  
  // Workout schemas
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutExerciseSchema,
  exerciseSetSchema,
  startWorkoutSessionSchema,
  completeWorkoutSessionSchema,
  
  // Chat schemas
  chatRequestSchema,
  chatMessageSchema,
  workoutGenerationRequestSchema,
  chatFeedbackSchema,
} from './user-schemas';

// Validation utility functions
import { z } from 'zod';

/**
 * Generic validation function that returns a result object
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Async validation function for use with forms
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Safe parse function that doesn't throw errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  return schema.safeParse(data);
}

/**
 * Validation function that returns only the first error
 */
export function validateWithFirstError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
      return { success: false, error: `${path}${firstError.message}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validation function for form fields that returns field-specific errors
 */
export function validateFormFields<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; fieldErrors: Record<string, string> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach(err => {
        const fieldPath = err.path.join('.');
        if (!fieldErrors[fieldPath]) {
          fieldErrors[fieldPath] = err.message;
        }
      });
      return { success: false, fieldErrors };
    }
    return { success: false, fieldErrors: { _root: 'Unknown validation error' } };
  }
}

/**
 * Partial validation function for updating existing data
 */
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: Partial<T> } | { success: false; errors: string[] } {
  const partialSchema = schema.partial();
  return validateData(partialSchema, data);
}

/**
 * Validation function that strips unknown fields
 */
export function validateAndStrip<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const strictSchema = schema.strict();
  return validateData(strictSchema, data);
}

/**
 * Validation function for arrays
 */
export function validateArray<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T[] } | { success: false; errors: string[] } {
  const arraySchema = z.array(itemSchema);
  return validateData(arraySchema, data);
}

/**
 * Validation function with custom error messages
 */
export function validateWithCustomErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMap: (error: z.ZodError) => string[]
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = errorMap(error);
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Create a validation middleware for API routes
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    const result = validateData(schema, data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors.join(', ')}`);
    }
    return result.data;
  };
}

/**
 * Validation function for environment variables
 */
export function validateEnv<T>(
  schema: z.ZodSchema<T>,
  env: Record<string, string | undefined> = process.env
): T {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
    throw new Error('Unknown environment validation error');
  }
}

/**
 * Type guard function generator
 */
export function createTypeGuard<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): data is T => {
    const result = schema.safeParse(data);
    return result.success;
  };
}

/**
 * Validation function for API responses
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  response: unknown
): T {
  try {
    return schema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('API Response validation failed:', error.errors);
      throw new Error('Invalid API response format');
    }
    throw new Error('Unknown API response validation error');
  }
}

/**
 * Validation function for file uploads
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxNameLength?: number;
  } = {}
): { success: true } | { success: false; error: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxNameLength = 255
  } = options;

  if (file.size > maxSize) {
    return {
      success: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`
    };
  }

  if (file.name.length > maxNameLength) {
    return {
      success: false,
      error: `File name must be less than ${maxNameLength} characters`
    };
  }

  return { success: true };
}

/**
 * Validation function for URLs
 */
export function validateUrl(url: string): { success: true; url: URL } | { success: false; error: string } {
  try {
    const parsedUrl = new URL(url);
    return { success: true, url: parsedUrl };
  } catch {
    return { success: false, error: 'Invalid URL format' };
  }
}

/**
 * Validation function for email addresses
 */
export function validateEmail(email: string): { success: true } | { success: false; error: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  return { success: true };
}

/**
 * Validation function for phone numbers
 */
export function validatePhone(phone: string): { success: true } | { success: false; error: string } {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, error: 'Invalid phone number format' };
  }
  return { success: true };
}

// Export validation result types
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };

export type ValidationFieldResult<T> = 
  | { success: true; data: T }
  | { success: false; fieldErrors: Record<string, string> };

export type ValidationSingleResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Export common validation patterns
export const commonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  username: /^[a-zA-Z0-9_-]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
};
