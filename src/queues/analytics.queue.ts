export interface GeoTallyEvent {
  electionId: string;
  optionId: string;
  country?: string;
  county?: string;
  constituency?: string;
  ward?: string;
  region?: string;
}

export class AnalyticsQueue {
  private static events: GeoTallyEvent[] = [];
  private static geoAggregates = new Map<string, Map<string, number>>();

  static enqueue(event: GeoTallyEvent): void {
    this.events.push(event);
    const key = `${event.electionId}::${event.country || 'Global'}::${event.county || 'All'}`;
    const optionMap = this.geoAggregates.get(key) || new Map<string, number>();
    optionMap.set(event.optionId, (optionMap.get(event.optionId) || 0) + 1);
    this.geoAggregates.set(key, optionMap);
  }

  static getAggregates(electionId: string) {
    const results: Record<string, Record<string, number>> = {};
    for (const [key, val] of this.geoAggregates.entries()) {
      if (key.startsWith(electionId)) {
        results[key] = Object.fromEntries(val);
      }
    }
    return results;
  }
}
