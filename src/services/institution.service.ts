import { CreateInstitutionInput, AddBranchInput, CreateStaffLecturerInput } from '../schema/institution.schema.ts';
import { AuthService } from './auth.service.ts';
import { ConflictError, NotFoundError } from '../utils/errors.ts';

export interface BranchRecord {
  code: string;
  name: string;
  location: string;
  officialEmail: string;
}

export interface InstitutionRecord {
  name: string;
  code: string;
  domainSuffix: string;
  officialHqEmail: string;
  registrationNumber: string;
  primaryContactEmail: string;
  branches: Map<string, BranchRecord>;
  staffCount: number;
}

export class InstitutionService {
  private static institutions = new Map<string, InstitutionRecord>();
  private static staff = new Map<string, {
    id: string;
    fullName: string;
    officialStaffEmail: string;
    phoneNumber: string;
    role: string;
    institutionCode: string;
    branchCode: string;
    department: string;
  }>();

  static registerInstitution(input: CreateInstitutionInput): InstitutionRecord {
    if (this.institutions.has(input.code)) throw new ConflictError('Institution code already registered');
    const domain = input.domainSuffix || 'lively.edu';
    const hqEmail = `${input.code}@${domain}`;
    const branchesMap = new Map<string, BranchRecord>();

    input.branches.forEach((b) => {
      branchesMap.set(b, { code: b, name: `${b.toUpperCase()} Campus`, location: 'Main', officialEmail: `${b}.${input.code}@${domain}` });
    });

    const record: InstitutionRecord = { ...input, domainSuffix: domain, officialHqEmail: hqEmail, branches: branchesMap, staffCount: 0 };
    this.institutions.set(input.code, record);
    return record;
  }

  static addBranch(institutionCode: string, input: AddBranchInput): BranchRecord {
    const inst = this.institutions.get(institutionCode);
    if (!inst) throw new NotFoundError('Institution not found');
    const branchEmail = `${input.branchCode}.${inst.code}@${inst.domainSuffix}`;
    const branch: BranchRecord = { code: input.branchCode, name: input.branchName, location: input.location, officialEmail: branchEmail };
    inst.branches.set(input.branchCode, branch);
    return branch;
  }

  static async createStaffLecturer(institutionCode: string, input: CreateStaffLecturerInput) {
    const inst = this.institutions.get(institutionCode);
    if (!inst) throw new NotFoundError('Institution not found');
    const staffSlug = input.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const officialStaffEmail = `${staffSlug}@${input.branchCode}.${inst.code}.${inst.domainSuffix}`;
    const passwordHash = await AuthService.hashPassword(input.password);
    const user = AuthService.registerUser({ phoneNumber: input.phoneNumber, passwordHash, fullName: input.fullName, email: officialStaffEmail, country: 'Kenya', organizationId: institutionCode });

    const staffMember = { id: user.id, fullName: input.fullName, officialStaffEmail, phoneNumber: input.phoneNumber, role: input.staffRole, institutionCode, branchCode: input.branchCode, department: input.department };
    this.staff.set(user.id, staffMember);
    inst.staffCount += 1;
    return staffMember;
  }

  static getInstitution(code: string) {
    const inst = this.institutions.get(code);
    if (!inst) return null;
    return { ...inst, branches: Array.from(inst.branches.values()) };
  }

  static listStaff(institutionCode: string) {
    return Array.from(this.staff.values()).filter((s) => s.institutionCode === institutionCode);
  }
}
