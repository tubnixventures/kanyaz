import { ExamRecord } from './exam.service.ts';
import { UnitService } from './unit.service.ts';
import { ForbiddenError } from '../utils/errors.ts';

export class ExamAccessService {
  static validateCandidateAccess(exam: ExamRecord, studentId: string): void {
    const now = Date.now();
    const startTime = new Date(exam.startsAt).getTime();
    const endTime = new Date(exam.endsAt).getTime();

    // 1. Strict time validation
    if (now < startTime) {
      throw new ForbiddenError(`Exam session is locked: starts at ${exam.startsAt}`);
    }
    if (now > endTime) {
      throw new ForbiddenError(`Exam session concluded: closed at ${exam.endsAt}`);
    }

    // 2. Candidate Whitelist Override
    if (exam.allowedCandidateIds && exam.allowedCandidateIds.includes(studentId)) {
      return;
    }

    // 3. Institutional Account Mapping & Unit Enrollment Verification
    const profile = UnitService.getStudentProfile(studentId);
    if (!profile) {
      throw new ForbiddenError('Unauthorized candidate: account is not mapped to an authorized academic institution');
    }

    if (exam.institutionCode && profile.institutionCode.toLowerCase() !== exam.institutionCode.toLowerCase()) {
      throw new ForbiddenError(`Access Denied: Exam is restricted to institution [${exam.institutionCode}]`);
    }

    if (exam.branchCode && profile.branchCode.toLowerCase() !== exam.branchCode.toLowerCase()) {
      throw new ForbiddenError(`Access Denied: Exam is restricted to branch [${exam.branchCode}]`);
    }

    const isEnrolled = UnitService.isStudentEnrolled(studentId, exam.unitCode);
    if (!isEnrolled) {
      throw new ForbiddenError(`Candidate eligibility denied: student is not registered for academic unit [${exam.unitCode}]`);
    }
  }
}
