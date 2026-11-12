export class RateLimiterDO {
  private requests = new Map<string, number[]>();
  private readonly defaultWindowMs = 60 * 1000;
  private readonly defaultLimit = 120;

  checkRateLimit(key: string, limit = this.defaultLimit, windowMs = this.defaultWindowMs): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    const timestamps = (this.requests.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, windowMs - (now - oldest)),
      };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetMs: windowMs,
    };
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => now - t < this.defaultWindowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}
