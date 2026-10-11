import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load .env from backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Security Pepper: Minimum 32 characters to prevent offline brute-force attacks
  ARGON2_PEPPER: z
    .string()
    .min(32, { message: 'ARGON2_PEPPER must be at least 32 characters long' }),

  // AES-256-GCM Key: Exactly 32 bytes (64 hex characters)
  AES_ENCRYPTION_KEY: z
    .string()
    .length(64, { message: 'AES_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)' }),

  // JWT Secrets
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' }),
  JWT_2FA_SECRET: z
    .string()
    .min(32, { message: 'JWT_2FA_SECRET must be at least 32 characters' }),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_2FA_EXPIRES_IN: z.string().default('5m'),

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional().default('./serviceAccountKey.json'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,http://localhost:8081'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid or missing environment configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
