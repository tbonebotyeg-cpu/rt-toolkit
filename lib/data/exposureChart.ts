/**
 * Approximate base exposure data for Ir-192 and Co-60.
 *
 * Values are CI·sec at:
 *   - 1 Ci source activity
 *   - 12" SFD (source-to-film distance)
 *   - D7 film (R-factor = 1.00)
 *   - Target density ~2.0
 *   - Steel (carbon/low alloy)
 *
 * Data interpolated from standard industrial radiography exposure charts.
 * These are APPROXIMATE — verify against your company's specific charts.
 */

import { SourceType } from "@/types";

interface ExposurePoint {
  wallIn: number; // inches
  ciSec: number;  // CI·seconds at 1 Ci, 12" SFD, R=1.00
}

// Ir-192 base exposure data (steel, D7 film, density ~2.0)
const IR192_CHART: ExposurePoint[] = [
  { wallIn: 0.125, ciSec: 30 },
  { wallIn: 0.188, ciSec: 55 },
  { wallIn: 0.250, ciSec: 100 },
  { wallIn: 0.312, ciSec: 160 },
  { wallIn: 0.375, ciSec: 250 },
  { wallIn: 0.432, ciSec: 370 },
  { wallIn: 0.500, ciSec: 540 },
  { wallIn: 0.562, ciSec: 720 },
  { wallIn: 0.625, ciSec: 960 },
  { wallIn: 0.688, ciSec: 1260 },
  { wallIn: 0.750, ciSec: 1620 },
  { wallIn: 0.875, ciSec: 2700 },
  { wallIn: 1.000, ciSec: 4500 },
  { wallIn: 1.125, ciSec: 7200 },
  { wallIn: 1.250, ciSec: 11500 },
  { wallIn: 1.500, ciSec: 28800 },
  { wallIn: 1.750, ciSec: 72000 },
  { wallIn: 2.000, ciSec: 162000 },
  { wallIn: 2.500, ciSec: 540000 },
];

// Co-60 base exposure data (steel, D7 film, density ~2.0)
const CO60_CHART: ExposurePoint[] = [
  { wallIn: 0.500, ciSec: 18 },
  { wallIn: 0.750, ciSec: 36 },
  { wallIn: 1.000, ciSec: 72 },
  { wallIn: 1.250, ciSec: 144 },
  { wallIn: 1.500, ciSec: 270 },
  { wallIn: 1.750, ciSec: 480 },
  { wallIn: 2.000, ciSec: 840 },
  { wallIn: 2.500, ciSec: 2400 },
  { wallIn: 3.000, ciSec: 6600 },
  { wallIn: 3.500, ciSec: 16800 },
  { wallIn: 4.000, ciSec: 42000 },
  { wallIn: 5.000, ciSec: 180000 },
];

function getChart(sourceType: SourceType): ExposurePoint[] {
  return sourceType === "Ir-192" ? IR192_CHART : CO60_CHART;
}

/**
 * Look up base CI·sec for a given wall thickness using log-linear interpolation.
 * Returns CI·sec at 1 Ci, 12" SFD, R=1.00, density ~2.0.
 */
export function lookupBaseCiSec(wallIn: number, sourceType: SourceType): number {
  const chart = getChart(sourceType);

  if (wallIn <= 0) throw new Error("Wall thickness must be > 0");

  // Clamp to chart range
  if (wallIn <= chart[0].wallIn) return chart[0].ciSec;
  if (wallIn >= chart[chart.length - 1].wallIn) return chart[chart.length - 1].ciSec;

  // Find bracketing points
  for (let i = 0; i < chart.length - 1; i++) {
    const lo = chart[i];
    const hi = chart[i + 1];
    if (wallIn >= lo.wallIn && wallIn <= hi.wallIn) {
      // Log-linear interpolation (exposure is roughly exponential with thickness)
      const t = (wallIn - lo.wallIn) / (hi.wallIn - lo.wallIn);
      const logCiSec = Math.log(lo.ciSec) + t * (Math.log(hi.ciSec) - Math.log(lo.ciSec));
      return Math.exp(logCiSec);
    }
  }

  return chart[chart.length - 1].ciSec;
}

/**
 * Calculate exposure time from wall thickness and shooting parameters.
 *
 * Steps:
 *  1. Look up base CI·sec for wall thickness (at 1 Ci, 12" SFD, R=1.00)
 *  2. Convert to time: T_base = baseCiSec / (activity × 60) minutes
 *  3. Apply ISL: T = T_base × (SFD / 12)²
 *  4. Apply film R-factor: T = T × R_new
 */
export function calcTimeFromChart(
  wallIn: number,
  sourceType: SourceType,
  activityCi: number,
  sfdIn: number,
  rFactor: number
): { timeMinutes: number; baseCiSec: number; islMultiplier: number; filmRatio: number } {
  if (activityCi <= 0) throw new Error("Activity must be > 0");
  if (sfdIn <= 0) throw new Error("SFD must be > 0");

  const baseCiSec = lookupBaseCiSec(wallIn, sourceType);
  const tBase = baseCiSec / (activityCi * 60); // minutes at 12" SFD, R=1.00
  const islMultiplier = (sfdIn / 12) ** 2;
  const filmRatio = rFactor;
  const timeMinutes = tBase * islMultiplier * filmRatio;

  return { timeMinutes, baseCiSec, islMultiplier, filmRatio };
}

/** Reference SFD used in the exposure chart (12 inches) */
export const CHART_REF_SFD = 12;
