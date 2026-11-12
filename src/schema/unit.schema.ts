import { z } from 'zod';

export const CreateUnitSchema = z.object({
  unitCode: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, 'Unit code must be uppercase alphanumeric'),
  unitName: z.string().min(3).max(150),
  department: z.string().min(2).max(100),
  institutionCode: z.string().min(2).max(50),
  credits: z.number().int().min(1).max(30).default(3),
  semester: z.string().min(1).max(50).default('Semester 1 - 2026'),
});

export const RegisterUnitSchema = z.object({
  studentId: z.string().min(1),
  unitCode: z.string().min(2).max(30),
  semester: z.string().min(1).max(50).default('Semester 1 - 2026'),
  academicYear: z.string().min(4).max(10).default('2026'),
});

export const MapStudentAccountSchema = z.object({
  studentId: z.string().min(1),
  fullName: z.string().min(2).max(100),
  institutionCode: z.string().min(2).max(50),
  branchCode: z.string().min(2).max(50).default('main'),
  registrationNumber: z.string().min(3).max(50),
  email: z.string().email().optional(),
});

export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type RegisterUnitInput = z.infer<typeof RegisterUnitSchema>;
export type MapStudentAccountInput = z.infer<typeof MapStudentAccountSchema>;
