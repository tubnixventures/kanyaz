import { z } from 'zod';

export const PhoneLoginSchema = z.object({
  phoneNumber: z.string().min(8).max(20).regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterUserSchema = z.object({
  phoneNumber: z.string().min(8).max(20).regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  country: z.string().min(2).max(100),
  county: z.string().min(2).max(100).optional(),
  constituency: z.string().min(2).max(100).optional(),
  ward: z.string().min(2).max(100).optional(),
  region: z.string().min(2).max(100).optional(),
  organizationId: z.string().optional(),
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6),
});

export type PhoneLoginInput = z.infer<typeof PhoneLoginSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
