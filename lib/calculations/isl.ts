import { IslResult } from "@/types";

/**
 * Inverse Square Law — exposure adjustment for SFD change.
 *
 * Formula: E₂ = E₁ × (D₂ / D₁)²
 *
 * This gives the new exposure required when SFD changes.
 * If D₂ > D₁ (source moved farther), E₂ > E₁ (more exposure needed).
 * If D₂ < D₁ (source moved closer), E₂ < E₁ (less exposure needed).
 *
 * Units: D in inches (or feet — must be consistent). E in any time unit (minutes, CI·sec, etc.)
 */
export function calculateIsl(E1: number, D1: number, D2: number): IslResult {
  if (D1 <= 0 || D2 <= 0) throw new Error("Distance values must be > 0");
  const multiplier = Math.pow(D2 / D1, 2);
  return {
    newExposure: E1 * multiplier,
    multiplier,
  };
}

export function formatMultiplier(m: number): string {
  return m >= 1 ? `×${m.toFixed(3)}` : `÷${(1 / m).toFixed(3)}`;
}
