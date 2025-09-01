# Tattara API

> AI-Powered Data Collection Backend for DHIS2 and Generic Database Integration

Tattara is a NestJS-based API that powers an AI-driven data collection platform designed to streamline and enhance data entry, validation, and integration using voice recognition and OCR capabilities. The system supports both DHIS2 integration and standalone database operations.

## 🚀 Features

### Core Functionality

- **Voice Integration**: Speech-to-text input for data fields with multi-language support
- **OCR Integration**: Handwritten form capture and text extraction
- **Dual Mode Support**:
  - **DHIS2 Mode**: Direct integration with DHIS2 instances via API
  - **Generic DB Mode**: Configurable connectors for PostgreSQL and other databases
- **AI-Powered Validation**: Automated data validation and anomaly detection
- **Offline Capability**: Data caching with automatic sync when connectivity is restored

### User Management

- **Role-based Access Control**: Admin and Data Collector roles
- **User Onboarding**: Individual and bulk user creation via CSV upload
- **Pipeline Management**: Admins can create and manage data collection workflows
- **Email Integration**: User notifications and verification system

### Data Management

- **Real-time Data Processing**: AI-assisted data entry and validation
- **Export Capabilities**: Multiple format support for data export
- **Dashboard Analytics**: Data visualization and monitoring
- **Audit Trails**: Complete logging of data collection activities

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Resend API
- **Testing**: Jest with NestJS Testing utilities
- **Code Quality**: ESLint, Prettier, Husky, CommitLint
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v17 or higher)
- pnpm package manager

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tattara-api
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=tattara_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com
RESEND_API_KEY=your_resend_api_key

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Token Expiration
EMAIL_VERIFICATION_EXPIRES_IN=24h
PASSWORD_RESET_EXPIRES_IN=1h

# Environment
NODE_ENV=development
```

### 4. Database Setup

```bash
# Create database
createdb tattara_db

# Run migrations (if applicable)
pnpm run migration:run
```

### 5. Start the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the application is running, you can access:

- **API Documentation**: `http://localhost:3000/api` (Swagger UI)
- **Health Check**: `http://localhost:3000/health`

## 🧪 Testing

```bash
# Run unit tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:cov

# Run tests in watch mode
pnpm run test:watch
```

## 🏗️ Project Structure

```
src/
├── modules/       # All modules
├── common/            # Shared utilities and decorators
├── config/            # Configuration files
├── database/            # Database modules
└── main.ts           # Application entry point
```

## 🔧 Available Scripts

```bash
pnpm run start          # Start the application
pnpm run start:dev      # Start in development mode
pnpm run start:debug    # Start in debug mode
pnpm run start:prod     # Start in production mode
pnpm run build          # Build the application
pnpm run lint           # Run ESLint
pnpm run lint:fix       # Fix ESLint issues
pnpm run format         # Format code with Prettier
pnpm run format:check   # Check code formatting
pnpm run test           # Run unit tests
pnpm run test:e2e       # Run end-to-end tests
pnpm run test:cov       # Run tests with coverage
```

## 🌍 Environment Variables

| Variable                        | Description                     | Required | Default     |
| ------------------------------- | ------------------------------- | -------- | ----------- |
| `DATABASE_HOST`                 | PostgreSQL host                 | Yes      | -           |
| `DATABASE_PORT`                 | PostgreSQL port                 | Yes      | 5432        |
| `DATABASE_USERNAME`             | Database username               | Yes      | -           |
| `DATABASE_PASSWORD`             | Database password               | Yes      | -           |
| `DATABASE_NAME`                 | Database name                   | Yes      | -           |
| `JWT_SECRET`                    | JWT signing secret              | Yes      | -           |
| `JWT_EXPIRES_IN`                | JWT expiration time             | No       | 7d          |
| `FROM_EMAIL`                    | Sender email address            | Yes      | -           |
| `RESEND_API_KEY`                | Resend service API key          | Yes      | -           |
| `FRONTEND_URL`                  | Frontend application URL        | Yes      | -           |
| `EMAIL_VERIFICATION_EXPIRES_IN` | Email verification token expiry | No       | 24h         |
| `PASSWORD_RESET_EXPIRES_IN`     | Password reset token expiry     | No       | 1h          |
| `NODE_ENV`                      | Environment mode                | No       | development |

## 🚀 Deployment

### Development

```bash
pnpm run start:dev
```

### Production

```bash
pnpm run build
pnpm run start:prod
```

### Health Checks

```bash
curl http://localhost:3000/health
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes following our coding standards
4. Ensure tests pass: `pnpm run test`
5. Commit with conventional commits: `feat: add new feature`
6. Push and create a Pull Request

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by CommitLint:

```
type(optional-scope): description

Examples:
feat(auth): add JWT token validation
fix(database): resolve connection pool issues
docs(api): update swagger documentation
test(users): add unit tests for user service
```

**Available types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

### Code Standards

- **ESLint**: Automatic linting on pre-commit
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking required
- **Testing**: Write tests for new features
- **Documentation**: Update docs for API changes

### Pull Request Process

1. Ensure your branch is up to date with main
2. Run the full test suite
3. Update documentation if needed
4. Request review from maintainers
5. Address feedback and re-request review

## 🔍 Monitoring & Logging

The application includes comprehensive logging for:

- Authentication attempts
- Data entry submissions
- AI processing results
- Error tracking and debugging
- Performance metrics

## 📞 Support

For technical issues or questions:

- Create an issue in the repository
- Contact the development team
- Review the API documentation at `/api`

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Inspired by AI-powered data entry solutions
- Designed for healthcare and development sector efficiency

---

**Version**: v1.0  
**Last Updated**: September 2025
