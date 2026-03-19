export const ENV = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  adminEmail: process.env.ADMIN_EMAIL,
  resendApiKey: process.env.RESEND_API_KEY,
  appUrl: process.env.APP_URL || 'http://localhost:5001',
  isProduction: process.env.NODE_ENV === "production",
};
