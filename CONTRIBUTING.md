# Contributing to BigCommerce to HubSpot Integration

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/bigcommerce2hubspot.git
cd bigcommerce2hubspot
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file for local testing:
```bash
cp .env.example .env
# Edit .env with your test credentials
```

## Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the code style guidelines

3. Add tests for new functionality

4. Run tests and linting:
```bash
npm test
npm run lint
```

5. Commit your changes with a descriptive message:
```bash
git commit -m "Add feature: description of changes"
```

6. Push to your fork:
```bash
git push origin feature/your-feature-name
```

7. Create a pull request

## Code Style Guidelines

- Use ES6+ features
- Follow the existing code structure
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Handle errors appropriately

## Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for high code coverage
- Test error cases and edge cases

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Linting

We use ESLint for code quality. Run the linter before committing:

```bash
npm run lint
```

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

## Project Structure

```
src/
├── clients/        # API clients (BigCommerce, HubSpot)
├── config/         # Configuration management
├── handlers/       # Webhook handlers
├── services/       # Business logic (sync, mapping)
├── utils/          # Utilities (logging, retry)
└── index.js        # Express server setup
```

## Adding New Features

### Adding a New Webhook Handler

1. Add handler function in `src/handlers/webhook.js`
2. Add route in `src/index.js`
3. Add corresponding sync logic in `src/services/sync.js`
4. Add tests

### Adding a New API Client Method

1. Add method to appropriate client in `src/clients/`
2. Add error handling and retry logic
3. Update mapper if needed
4. Add tests

## Commit Message Guidelines

Follow conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Examples:
```
feat: add support for product sync
fix: handle missing customer email gracefully
docs: update API credentials section
test: add tests for cart mapping
```

## Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Update documentation if needed
- Add tests for new functionality
- Ensure all tests pass
- Update README if adding new features
- Provide clear description of changes

## Bug Reports

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Node version, OS, etc.)
- Relevant logs or error messages

## Feature Requests

When suggesting features, please include:

- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Any examples or mockups

## Questions?

- Open an issue for questions
- Check existing issues first
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
