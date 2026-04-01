import { CiSecResult } from "@/types";

/**
 * CI·sec Recalculation — adjusts exposure time for a different source activity.
 *
 * Formula: T₂ = T₁ × (A₁ / A₂)
 *
 * This is an activity-ratio adjustment ONLY.
 * It does NOT account for SFD changes (use ISL for that).
 * It does NOT account for film type / developer changes.
 *
 * CI·sec = Activity_Ci × Exposure_seconds
 */
export function recalcExposureTime(
  T1minutes: number,
  A1ci: number,
  A2ci: number
): CiSecResult {
  if (A2ci <= 0) throw new Error("New source activity must be > 0");
  if (A1ci <= 0) throw new Error("Original source activity must be > 0");

  const newTimeMinutes = T1minutes * (A1ci / A2ci);
  const ciSec = A2ci * newTimeMinutes * 60;

  return {
    newTimeMinutes,
    newTimeDisplay: minutesToMmSs(newTimeMinutes),
    ciSec,
  };
}

export function computeCiSec(activityCi: number, timeMinutes: number): number {
  return activityCi * timeMinutes * 60;
}

export function minutesToMmSs(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
