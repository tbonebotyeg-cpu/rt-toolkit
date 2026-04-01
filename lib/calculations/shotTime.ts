import { ShotTimeResult } from "@/types";
import { minutesToMmSs } from "@/lib/calculations/ciSec";

/**
 * Calculate shot time from a reference shot, adjusting for activity, SFD, and film changes.
 *
 * T_new = T_ref × (A_ref / A_new) × (SFD_new / SFD_ref)² × (R_new / R_ref)
 */
export function calcShotTimeFromRef(
  T_ref_min: number,
  A_ref_ci: number,
  A_new_ci: number,
  SFD_ref: number,
  SFD_new: number,
  R_ref: number,
  R_new: number
): ShotTimeResult {
  if (A_new_ci <= 0) throw new Error("New activity must be > 0");
  if (A_ref_ci <= 0) throw new Error("Reference activity must be > 0");
  if (SFD_ref <= 0) throw new Error("Reference SFD must be > 0");
  if (SFD_new <= 0) throw new Error("New SFD must be > 0");
  if (R_ref <= 0) throw new Error("Reference R-factor must be > 0");
  if (R_new <= 0) throw new Error("New R-factor must be > 0");

  const activityRatio = A_ref_ci / A_new_ci;
  const islMultiplier = (SFD_new / SFD_ref) ** 2;
  const filmRatio = R_new / R_ref;
  const combinedMultiplier = activityRatio * islMultiplier * filmRatio;

  const newTimeMinutes = T_ref_min * combinedMultiplier;
  const ciSec = A_new_ci * newTimeMinutes * 60;

  return {
    newTimeMinutes,
    newTimeDisplay: minutesToMmSs(newTimeMinutes),
    ciSec,
    activityRatio,
    islMultiplier,
    filmRatio,
    combinedMultiplier,
  };
}

/**
 * Calculate shot time from a known CI·sec value.
 *
 * Base time: T_base = CI·sec / (A_new × 60)
 * Then adjust for SFD and film: T_new = T_base × (SFD_new / SFD_ref)² × (R_new / R_ref)
 *
 * CI·sec is assumed to be established at R = 1.00 baseline (Agfa D7).
 */
export function calcShotTimeFromCiSec(
  ciSecValue: number,
  A_new_ci: number,
  SFD_ref: number,
  SFD_new: number,
  R_ref: number,
  R_new: number
): ShotTimeResult {
  if (ciSecValue <= 0) throw new Error("CI·sec must be > 0");
  if (A_new_ci <= 0) throw new Error("Activity must be > 0");
  if (SFD_ref <= 0) throw new Error("Reference SFD must be > 0");
  if (SFD_new <= 0) throw new Error("New SFD must be > 0");
  if (R_ref <= 0) throw new Error("Reference R-factor must be > 0");
  if (R_new <= 0) throw new Error("New R-factor must be > 0");

  const tBaseMinutes = ciSecValue / (A_new_ci * 60);
  const islMultiplier = (SFD_new / SFD_ref) ** 2;
  const filmRatio = R_new / R_ref;
  const combinedMultiplier = islMultiplier * filmRatio;

  const newTimeMinutes = tBaseMinutes * combinedMultiplier;
  const ciSec = A_new_ci * newTimeMinutes * 60;

  return {
    newTimeMinutes,
    newTimeDisplay: minutesToMmSs(newTimeMinutes),
    ciSec,
    activityRatio: 1.0, // N/A in manual mode — CI·sec already encodes the dose
    islMultiplier,
    filmRatio,
    combinedMultiplier,
  };
}
