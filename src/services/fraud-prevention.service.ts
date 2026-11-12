import { hashSha256 } from '../utils/crypto.ts';
import { isWithinGeofence, Coordinates } from '../utils/geo.ts';
import { ConflictError, ForbiddenError } from '../utils/errors.ts';

export class FraudPreventionService {
  private static recordedVoters = new Set<string>();
  private static ipAttempts = new Map<string, { count: number; windowStart: number }>();

  static validateVoterEligibility(params: {
    electionId: string;
    voterIdentifier: string; // phone number OR device fingerprint
    clientIp: string;
    voterCoordinates?: Coordinates;
    electionCenter?: Coordinates;
    maxRadiusMeters?: number;
    allowedRegions?: string[];
    voterRegion?: string;
  }): void {
    const compositeKey = hashSha256(`${params.electionId}::${params.voterIdentifier}`);
    if (this.recordedVoters.has(compositeKey)) {
      throw new ConflictError('A vote has already been recorded for this participant or device');
    }

    // IP velocity rate limiting (max 15 anonymous votes per IP per 5 minutes)
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const ipData = this.ipAttempts.get(params.clientIp) || { count: 0, windowStart: now };
    if (now - ipData.windowStart > windowMs) {
      this.ipAttempts.set(params.clientIp, { count: 1, windowStart: now });
    } else {
      if (ipData.count >= 15) {
        throw new ForbiddenError('Rate limit exceeded: excessive voting attempts detected from your network');
      }
      ipData.count += 1;
      this.ipAttempts.set(params.clientIp, ipData);
    }

    // Regional whitelist validation
    if (params.allowedRegions && params.allowedRegions.length > 0) {
      const regionMatch = params.voterRegion && params.allowedRegions.some(
        (r) => r.toLowerCase() === params.voterRegion?.toLowerCase()
      );
      if (!regionMatch) {
        throw new ForbiddenError(`Vote restricted: participation is limited to specified regions (${params.allowedRegions.join(', ')})`);
      }
    }

    // Geographic verification if election enforces geofencing
    if (params.voterCoordinates && params.electionCenter && params.maxRadiusMeters) {
      const allowed = isWithinGeofence(params.voterCoordinates, params.electionCenter, params.maxRadiusMeters);
      if (!allowed) {
        throw new ForbiddenError('Vote rejected: your verified location is outside the authorized electoral boundary');
      }
    }
  }

  static markVoterCompleted(electionId: string, voterIdentifier: string): void {
    const compositeKey = hashSha256(`${electionId}::${voterIdentifier}`);
    this.recordedVoters.add(compositeKey);
  }
}
