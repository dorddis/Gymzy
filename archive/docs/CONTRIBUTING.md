# Contributing to Gymzy

Thank you for your interest in contributing to Gymzy! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### 1. Fork and Clone

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/gymzy.git
cd gymzy
```

### 2. Setup Development Environment

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

### 3. Development Guidelines

#### Code Style
- Follow the existing code style
- Use TypeScript for type safety
- Follow the component structure in `src/components`
- Use Tailwind CSS for styling
- Write meaningful commit messages

#### Component Structure
```
src/
├── components/
│   ├── ui/          # Base UI components
│   ├── layout/      # Layout components
│   └── feature/     # Feature-specific components
```

#### Testing
- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve test coverage

### 4. Making Changes

1. Make your changes
2. Run tests:
```bash
npm run test
# or
yarn test
```

3. Check for linting errors:
```bash
npm run lint
# or
yarn lint
```

4. Commit your changes:
```bash
git commit -m "feat: add new feature"
```

5. Push to your fork:
```bash
git push origin feature/your-feature-name
```

### 5. Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation if you&apos;re changing functionality
3. The PR will be merged once you have the sign-off of at least one other developer

### 6. Feature Requests

We love feature requests! Please use the issue tracker to suggest new features.

### 7. Bug Reports

Please use the issue tracker to report bugs. Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

## Development Workflow

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or modifying tests

### Commit Message Format
```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

## Getting Help

- Check the [documentation](docs/)
- Open an issue for bugs or feature requests
- Join our community chat (if available)

## License

By contributing to Gymzy, you agree that your contributions will be licensed under the project&apos;s MIT License. 