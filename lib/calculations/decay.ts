import { SourceType, DecayResult } from "@/types";

export const HALF_LIVES_DAYS: Record<SourceType, number> = {
  "Ir-192": 73.83,
  "Co-60": 1925.3,
};

/**
 * Radioactive decay formula: A_t = A_0 × 0.5^(Δdays / half_life)
 */
export function decayActivity(
  A0: number,
  deltaDays: number,
  sourceType: SourceType
): number {
  const hl = HALF_LIVES_DAYS[sourceType];
  return A0 * Math.pow(0.5, deltaDays / hl);
}

export function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (dateB.getTime() - dateA.getTime()) / msPerDay;
}

export function calculateDecay(
  A0: number,
  calDate: Date,
  targetDate: Date,
  sourceType: SourceType
): DecayResult {
  const daysElapsed = daysBetween(calDate, targetDate);
  const activityAtTarget = decayActivity(A0, daysElapsed, sourceType);
  const decayPercent = ((A0 - activityAtTarget) / A0) * 100;

  let projections: { label: string; activity: number }[];

  if (sourceType === "Ir-192") {
    projections = [30, 60, 90].map((days) => ({
      label: `+${days} days`,
      activity: decayActivity(A0, daysElapsed + days, sourceType),
    }));
  } else {
    // Co-60: project 1, 2, 3, 5 years
    projections = [1, 2, 3, 5].map((years) => ({
      label: `+${years} year${years > 1 ? "s" : ""}`,
      activity: decayActivity(A0, daysElapsed + years * 365.25, sourceType),
    }));
  }

  return { activityAtTarget, daysElapsed, decayPercent, projections };
}

export function formatActivity(ci: number): string {
  if (ci >= 1) return `${ci.toFixed(3)} Ci`;
  return `${(ci * 1000).toFixed(1)} mCi`;
}
