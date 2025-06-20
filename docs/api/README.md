# 🔌 Gymzy API Documentation

## Overview

The Gymzy API provides secure, server-side endpoints for all external integrations and sensitive operations. All API routes are located under `/api/` and follow RESTful conventions.

## Base URL

```
Development: http://localhost:9001/api
Production: https://your-domain.com/api
```

## Authentication

Most API endpoints require authentication. The application uses Firebase Authentication with JWT tokens.

### Authentication Headers

```http
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json
```

## API Structure

### Internal APIs (`/api/internal/`)

Secure server-side APIs that handle external service integrations.

#### AI Services

##### `POST /api/internal/ai`
Generate AI responses using the optimal model.

**Request:**
```json
{
  "prompt": "Create a workout for building muscle",
  "model": "gemini" | "groq" | "auto",
  "maxTokens": 1000,
  "temperature": 0.7,
  "userId": "user-id-here"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Here's a muscle-building workout...",
  "model": "groq",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "tokensUsed": 150,
    "responseTime": 1200
  }
}
```

##### `POST /api/internal/ai/stream`
Stream AI responses for real-time chat experience.

**Request:**
```json
{
  "prompt": "Create a workout for building muscle",
  "model": "gemini" | "groq" | "auto",
  "maxTokens": 1000,
  "temperature": 0.7,
  "userId": "user-id-here"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"content": "Here's"}
data: {"content": " a muscle"}
data: {"content": "-building workout..."}
data: {"done": true}
```

##### `GET /api/internal/ai/health`
Check AI service health status.

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "services": {
    "gemini": true,
    "groq": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Public APIs (`/api/`)

#### Chat APIs

##### `POST /api/chat/send`
Send a chat message and get AI response.

**Request:**
```json
{
  "message": "Create a workout for me",
  "sessionId": "optional-session-id",
  "context": {
    "userPreferences": {
      "fitnessLevel": "intermediate",
      "workoutStyle": ["strength", "cardio"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "message-id",
    "role": "assistant",
    "content": "I'll create a workout for you...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "sessionId": "session-id"
}
```

##### `GET /api/chat/history?sessionId=<id>&limit=<number>`
Get chat history for a session.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message-1",
      "role": "user",
      "content": "Create a workout",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "message-2",
      "role": "assistant",
      "content": "Here's your workout...",
      "timestamp": "2024-01-01T00:01:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

##### `POST /api/chat/sessions`
Create a new chat session.

**Request:**
```json
{
  "title": "Workout Planning Session",
  "initialMessage": "Help me plan my workouts"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "new-session-id",
  "session": {
    "id": "new-session-id",
    "title": "Workout Planning Session",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
}
```

#### Workout APIs

##### `POST /api/workouts`
Create a new workout.

**Request:**
```json
{
  "name": "Upper Body Strength",
  "description": "Focus on chest, back, and arms",
  "exercises": [
    {
      "exerciseId": "push-ups",
      "name": "Push-ups",
      "sets": [
        {
          "type": "normal",
          "reps": 10,
          "weight": 0
        }
      ],
      "restTime": 60,
      "order": 1
    }
  ],
  "difficulty": "intermediate",
  "workoutType": "strength",
  "isPublic": false,
  "tags": ["upper-body", "strength"]
}
```

**Response:**
```json
{
  "success": true,
  "workout": {
    "id": "workout-id",
    "name": "Upper Body Strength",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "createdBy": "user-id"
  }
}
```

##### `GET /api/workouts?page=<number>&limit=<number>&filter=<type>`
Get user's workouts with pagination.

**Response:**
```json
{
  "success": true,
  "workouts": [
    {
      "id": "workout-1",
      "name": "Upper Body Strength",
      "description": "Focus on chest, back, and arms",
      "difficulty": "intermediate",
      "duration": 45,
      "exerciseCount": 6,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

##### `GET /api/workouts/[id]`
Get a specific workout by ID.

**Response:**
```json
{
  "success": true,
  "workout": {
    "id": "workout-id",
    "name": "Upper Body Strength",
    "description": "Focus on chest, back, and arms",
    "exercises": [...],
    "difficulty": "intermediate",
    "workoutType": "strength",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "createdBy": "user-id"
  }
}
```

##### `PUT /api/workouts/[id]`
Update a workout.

**Request:** Same as POST with updated fields

**Response:**
```json
{
  "success": true,
  "workout": {
    "id": "workout-id",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

##### `DELETE /api/workouts/[id]`
Delete a workout.

**Response:**
```json
{
  "success": true,
  "message": "Workout deleted successfully"
}
```

#### User APIs

##### `GET /api/user/profile`
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "fitnessLevel": "intermediate",
      "fitnessGoals": ["muscle_gain", "strength"],
      "activityLevel": "moderately_active"
    },
    "preferences": {
      "theme": "light",
      "language": "en",
      "units": "metric"
    }
  }
}
```

##### `PUT /api/user/profile`
Update user profile.

**Request:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "fitnessLevel": "advanced",
    "fitnessGoals": ["muscle_gain", "strength", "endurance"]
  },
  "preferences": {
    "theme": "dark",
    "units": "imperial"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required or invalid
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - External service unavailable

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Chat APIs**: 60 requests per minute per user
- **Workout APIs**: 100 requests per minute per user
- **User APIs**: 30 requests per minute per user
- **AI APIs**: 20 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Validation

All API endpoints use Zod schemas for input validation. See the [validation schemas](../development/validation.md) for detailed information.

## Testing

Use the provided test utilities to test API endpoints:

```typescript
import { testApiEndpoint } from '@/lib/test-utils';

const response = await testApiEndpoint('/api/workouts', {
  method: 'POST',
  body: workoutData,
  headers: { Authorization: `Bearer ${token}` }
});
```

## Examples

See the [API Examples](./examples.md) for complete request/response examples and common use cases.
