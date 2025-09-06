export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'app_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  mail: {
    fromEmail: process.env.FROM_EMAIL ?? 'noreply@example.com',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  app: {
    name: process.env.APP_NAME,
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    emailVerificationExpiresIn: parseInt(
      process.env.EMAIL_VERIFICATION_EXPIRES_IN ?? '86400000',
      10,
    ),
    passwordResetExpiresIn: parseInt(
      process.env.PASSWORD_RESET_EXPIRES_IN ?? '3600000',
      10,
    ),
  },
  aws: {
    region: process.env.AWS_REGION ?? 'eu-north-1',
    keyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secret: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.AWS_S3_BUCKET ?? 'tattarabucket',
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING ?? '',
    container: process.env.AZURE_BLOB_CONTAINER ?? 'tattara-container',
  },
});
