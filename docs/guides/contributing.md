# 🤝 Contributing to Gymzy

## Welcome Contributors!

Thank you for your interest in contributing to Gymzy! This guide will help you get started with contributing to our fitness application.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/gymzy.git
cd gymzy
```

### 2. Set Up Development Environment

Follow the [Development Setup Guide](../development/setup.md) to configure your local environment.

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Branch Naming Convention

- **Features**: `feature/feature-name`
- **Bug fixes**: `fix/bug-description`
- **Documentation**: `docs/documentation-update`
- **Refactoring**: `refactor/component-name`
- **Tests**: `test/test-description`

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(chat): add streaming AI responses
fix(workout): resolve exercise validation error
docs(api): update authentication documentation
test(validation): add user schema tests
```

### Code Quality Standards

#### TypeScript
- Use TypeScript strict mode
- Define proper types for all functions and variables
- Avoid `any` type unless absolutely necessary
- Use shared types from `/src/types/`

#### Code Style
- Use Prettier for formatting (configured in `.prettierrc`)
- Follow ESLint rules (configured in `.eslintrc.json`)
- Use meaningful variable and function names
- Keep functions small and focused

#### Testing
- Write unit tests for all new services
- Write component tests for UI components
- Maintain >80% test coverage for critical paths
- Use the provided test utilities and mocks

#### Validation
- Use Zod schemas for all user inputs
- Validate data at API boundaries
- Handle validation errors gracefully
- Follow existing validation patterns

### Service Development

#### Creating New Services

1. **Choose the correct directory:**
   - `src/services/core/` - Core business logic
   - `src/services/ai/` - AI-related functionality
   - `src/services/data/` - Data management
   - `src/services/media/` - Media handling
   - `src/services/social/` - Social features
   - `src/services/infrastructure/` - Supporting services

2. **Follow the service pattern:**
```typescript
/**
 * Service Name
 * Description of what this service does
 */

import { logger } from '@/lib/logger';
import { validateData } from '@/lib/validation';
import { serviceSchema } from '@/lib/validation/service-schemas';

const serviceLogger = logger.createServiceLogger('ServiceName');

export async function serviceFunction(input: InputType): Promise<OutputType> {
  try {
    // Validate input
    const validation = validateData(serviceSchema, input);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Business logic
    serviceLogger.info('Processing request', { input });
    
    // Return result
    return result;
  } catch (error) {
    serviceLogger.error('Service error', error);
    throw error;
  }
}
```

3. **Write tests:**
```typescript
import { serviceFunction } from '@/services/core/service-name';

describe('ServiceName', () => {
  it('should process valid input', async () => {
    const result = await serviceFunction(validInput);
    expect(result).toMatchObject(expectedOutput);
  });

  it('should handle invalid input', async () => {
    await expect(serviceFunction(invalidInput)).rejects.toThrow();
  });
});
```

### Component Development

#### Creating New Components

1. **Use TypeScript and proper typing:**
```typescript
interface ComponentProps {
  title: string;
  onAction: (data: ActionData) => void;
  isLoading?: boolean;
}

export function Component({ title, onAction, isLoading = false }: ComponentProps) {
  // Component implementation
}
```

2. **Follow the component structure:**
```
components/
├── ui/                    # Reusable UI components
├── forms/                 # Form components
├── chat/                  # Chat-specific components
├── workout/               # Workout-specific components
└── error-boundaries/      # Error boundary components
```

3. **Use proper error handling:**
```typescript
import { FeatureErrorBoundary } from '@/components/error-boundaries/FeatureErrorBoundary';

export function FeatureComponent() {
  return (
    <FeatureErrorBoundary>
      {/* Component content */}
    </FeatureErrorBoundary>
  );
}
```

### API Development

#### Creating New API Routes

1. **Follow the API structure:**
```
app/api/
├── internal/              # Secure internal APIs
│   └── ai/               # AI service APIs
├── chat/                 # Chat APIs
├── workouts/             # Workout APIs
└── user/                 # User APIs
```

2. **Use proper validation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateData } from '@/lib/validation';
import { apiSchema } from '@/lib/validation/api-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateData(apiSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Process request
    const result = await processRequest(validation.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- validation.test.ts
```

### Writing Tests

#### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Test both success and error cases
- Use descriptive test names

#### Integration Tests
- Test service interactions
- Test API endpoints
- Test database operations
- Use realistic test data

#### Component Tests
- Test component rendering
- Test user interactions
- Test prop handling
- Test error states

### Test Utilities

Use the provided test utilities:

```typescript
import { testUtils } from 'jest.setup.js';

// Create mock data
const mockUser = testUtils.createMockUser();
const mockWorkout = testUtils.createMockWorkout();
const mockChatMessage = testUtils.createMockChatMessage();

// Create API responses
const apiResponse = testUtils.createMockApiResponse(data);
```

## Pull Request Process

### Before Submitting

1. **Run quality checks:**
```bash
npm run test
npm run typecheck
npm run lint
```

2. **Update documentation if needed**
3. **Add tests for new functionality**
4. **Ensure all tests pass**

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Test improvements

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** - CI/CD pipeline runs tests and quality checks
2. **Code review** - Team members review the code
3. **Testing** - Manual testing if needed
4. **Approval** - At least one approval required
5. **Merge** - Squash and merge to main branch

## Common Issues & Solutions

### TypeScript Errors
- Check import paths are correct
- Ensure types are properly defined
- Use shared types from `/src/types/`

### Test Failures
- Check mock configurations
- Ensure async operations are awaited
- Verify test data matches schemas

### Build Errors
- Run `npm run typecheck` to identify issues
- Check environment variables are set
- Ensure all dependencies are installed

### Linting Errors
- Run `npm run lint` to see issues
- Use `npm run lint -- --fix` to auto-fix
- Follow the established code style

## Getting Help

- **Documentation**: Check the [docs](../development/) folder
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help in pull request comments

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for major features

Thank you for contributing to Gymzy! 🏋️‍♂️
