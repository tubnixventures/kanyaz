import { z } from 'zod';

export const CreateInstitutionSchema = z.object({
  name: z.string().min(3).max(200),
  code: z.string().min(2).max(20).regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric and hyphens'),
  domainSuffix: z.string().default('lively.edu'),
  country: z.string().min(2).max(100),
  registrationNumber: z.string().min(2).max(100),
  primaryContactEmail: z.string().email(),
  branches: z.array(z.string()).default(['main']),
});

export const AddBranchSchema = z.object({
  branchCode: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  branchName: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
});

export const CreateStaffLecturerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().min(8).max(20).regex(/^\+?[1-9]\d{7,14}$/),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  staffRole: z.enum(['lecturer', 'invigilator', 'moderator', 'head_of_department', 'dean']),
  branchCode: z.string().default('main'),
  department: z.string().min(2).max(100),
});

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type AddBranchInput = z.infer<typeof AddBranchSchema>;
export type CreateStaffLecturerInput = z.infer<typeof CreateStaffLecturerSchema>;
