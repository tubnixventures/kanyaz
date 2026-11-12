import { CreateUnitInput, RegisterUnitInput, MapStudentAccountInput } from '../schema/unit.schema.ts';
import { ConflictError, NotFoundError } from '../utils/errors.ts';

export interface CourseUnitRecord extends CreateUnitInput {
  createdAt: number;
}

export interface StudentProfileRecord extends MapStudentAccountInput {
  mappedAt: number;
  officialStudentEmail: string;
}

export class UnitService {
  private static units = new Map<string, CourseUnitRecord>();
  private static studentProfiles = new Map<string, StudentProfileRecord>();
  private static enrollments = new Set<string>(); // key: studentId::unitCode

  static createUnit(input: CreateUnitInput): CourseUnitRecord {
    const key = `${input.institutionCode}::${input.unitCode}`;
    if (this.units.has(key)) throw new ConflictError('Unit already exists for this institution');
    const record: CourseUnitRecord = { ...input, createdAt: Date.now() };
    this.units.set(key, record);
    return record;
  }

  static mapStudentAccount(input: MapStudentAccountInput): StudentProfileRecord {
    const officialStudentEmail = input.email || `${input.registrationNumber.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${input.branchCode}.${input.institutionCode}.lively.edu`;
    const record: StudentProfileRecord = { ...input, officialStudentEmail, mappedAt: Date.now() };
    this.studentProfiles.set(input.studentId, record);
    return record;
  }

  static registerStudentForUnit(input: RegisterUnitInput) {
    const profile = this.studentProfiles.get(input.studentId);
    if (!profile) throw new NotFoundError('Student account must be mapped to an institution prior to unit registration');
    const unitKey = `${profile.institutionCode}::${input.unitCode}`;
    if (!this.units.has(unitKey)) throw new NotFoundError('Course unit not found in student institution catalog');

    const enrollKey = `${input.studentId}::${input.unitCode}`;
    this.enrollments.add(enrollKey);
    return { studentId: input.studentId, unitCode: input.unitCode, institutionCode: profile.institutionCode, registered: true };
  }

  static isStudentEnrolled(studentId: string, unitCode: string): boolean {
    return this.enrollments.has(`${studentId}::${unitCode}`);
  }

  static getStudentProfile(studentId: string): StudentProfileRecord | null {
    return this.studentProfiles.get(studentId) || null;
  }

  static listUnits(institutionCode: string): CourseUnitRecord[] {
    return Array.from(this.units.values()).filter((u) => u.institutionCode === institutionCode);
  }
}
