import { IqiWire, IqiResult, Technique, IqiPlacement } from "@/types";

/**
 * ASTM E747 Wire IQI sets and diameters.
 * Source-side essential wire selection per ASME Section V, Article 2, Table T-276.
 *
 * CRITICAL RULE (ASME V T-274.2):
 * IQI selection is based on the nominal single-wall (parent material) thickness ONLY.
 * Weld reinforcement, backing rings, and any added material are EXCLUDED.
 */

export const IQI_WIRES: IqiWire[] = [
  { wireNumber: 1, diameterIn: 0.0032, diameterMm: 0.08, set: "A" },
  { wireNumber: 2, diameterIn: 0.004, diameterMm: 0.10, set: "A" },
  { wireNumber: 3, diameterIn: 0.005, diameterMm: 0.13, set: "A" },
  { wireNumber: 4, diameterIn: 0.0063, diameterMm: 0.16, set: "A" },
  { wireNumber: 5, diameterIn: 0.008, diameterMm: 0.20, set: "A" },
  { wireNumber: 6, diameterIn: 0.010, diameterMm: 0.25, set: "A" }, // also Set B
  { wireNumber: 7, diameterIn: 0.013, diameterMm: 0.33, set: "A" }, // also Set B
  { wireNumber: 8, diameterIn: 0.016, diameterMm: 0.40, set: "B" },
  { wireNumber: 9, diameterIn: 0.020, diameterMm: 0.51, set: "B" },
  { wireNumber: 10, diameterIn: 0.025, diameterMm: 0.64, set: "B" }, // also Set C
  { wireNumber: 11, diameterIn: 0.032, diameterMm: 0.81, set: "B" }, // also Set C
  { wireNumber: 12, diameterIn: 0.040, diameterMm: 1.02, set: "B" }, // also Set C
  { wireNumber: 13, diameterIn: 0.050, diameterMm: 1.27, set: "B" }, // also Set C
  { wireNumber: 14, diameterIn: 0.063, diameterMm: 1.60, set: "C" },
  { wireNumber: 15, diameterIn: 0.080, diameterMm: 2.03, set: "C" },
  { wireNumber: 16, diameterIn: 0.100, diameterMm: 2.54, set: "C" },
];

// Wire set ranges: A = #1-#7, B = #6-#13, C = #10-#16
// For display, prefer set B when in overlap (most common in field RT)
export function getWireByNumber(n: number): IqiWire | undefined {
  return IQI_WIRES.find((w) => w.wireNumber === n);
}

/** Determine the best IQI set for a given wire number */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function wireSet(wireNumber: number): "A" | "B" | "C" {
  if (wireNumber >= 10) return wireNumber <= 13 ? "B" : "C";
  if (wireNumber >= 6) return wireNumber <= 7 ? "A" : "B"; // 6-7 overlap, prefer B for common use... actually A is fine for small pipe
  return "A";
}

// Better set selection: prefer B for wires 6-13, C for 14+
function preferredSet(wireNumber: number): "A" | "B" | "C" {
  if (wireNumber <= 5) return "A";
  if (wireNumber <= 7) return "A"; // Set A includes 1-7; small pipe typically uses Set A
  if (wireNumber <= 13) return "B";
  return "C";
}

/**
 * Hole-type IQI equivalents (ASTM E1025, 2T sensitivity) per ASME V Table T-276.
 * Format: "<thickness_mils>-2T"
 */
const HOLE_TYPE_EQUIV: Record<number, string> = {
  1: "5-2T",
  2: "5-2T",
  3: "7-2T",
  4: "7-2T",
  5: "10-2T",
  6: "12-2T",
  7: "15-2T",
  8: "17-2T",
  9: "20-2T",
  10: "25-2T",
  11: "30-2T",
  12: "40-2T",
  13: "50-2T",
  14: "60-2T",
  15: "80-2T",
  16: "100-2T",
};

/**
 * ASME Section V, Article 2, Table T-276 — Essential wire selection by nominal wall (inches).
 * PARENT MATERIAL ONLY — no weld reinforcement, no backing rings.
 */
export function selectEssentialWire(wallInches: number): number {
  if (wallInches <= 0.25) return 4;
  if (wallInches <= 0.375) return 5;
  if (wallInches <= 0.50) return 6;
  if (wallInches <= 0.75) return 7;
  if (wallInches <= 1.00) return 8;
  if (wallInches <= 1.50) return 9;
  if (wallInches <= 2.00) return 10;
  if (wallInches <= 2.50) return 11;
  if (wallInches <= 4.00) return 12;
  if (wallInches <= 6.00) return 13;
  if (wallInches <= 8.00) return 14;
  return 16;
}

/**
 * Full IQI calculation result.
 * @param wallInches - nominal parent material wall thickness in inches (ONLY — no weld crown / backing ring)
 * @param technique - welding technique
 * @param placement - IQI placement (source or film side)
 */
export function calculateIqi(
  wallInches: number,
  technique: Technique,
  placement: IqiPlacement
): IqiResult {
  const sourceWireNumber = selectEssentialWire(wallInches);
  const filmSideWireNumber =
    placement === "Film Side" ? sourceWireNumber + 1 : undefined;

  const essentialWireNumber =
    placement === "Film Side" ? sourceWireNumber + 1 : sourceWireNumber;
  const wire = getWireByNumber(essentialWireNumber) ?? getWireByNumber(16)!;
  const set = preferredSet(essentialWireNumber);

  return {
    wallUsed: wallInches,
    essentialWireNumber: wire.wireNumber,
    essentialWireDiam: wire.diameterIn,
    set,
    holeTypeEquiv: HOLE_TYPE_EQUIV[wire.wireNumber] ?? "—",
    filmSideWireNumber,
    technique,
    placement,
  };
}

export function formatIqiString(result: IqiResult): string {
  return `Set ${result.set}, Wire #${result.essentialWireNumber} — ${result.placement} (${result.technique})`;
}
