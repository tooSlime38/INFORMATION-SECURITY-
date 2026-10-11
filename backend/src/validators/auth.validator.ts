import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters long')
      .max(30, 'Username must not exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verify2faSchema = z.object({
  tempToken: z.string().min(1, 'Temporary 2FA token is required'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(15, 'Code is invalid format'),
  isRecoveryCode: z.boolean().optional().default(false),
});

export const enable2faSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'TOTP code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'TOTP code must contain only digits'),
});

export const disable2faSchema = z.object({
  password: z.string().min(1, 'Current password is required to disable 2FA'),
  code: z.string().trim().min(1, 'TOTP code or recovery code is required'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['GUEST', 'USER', 'ADMIN']),
});

export const changeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});
