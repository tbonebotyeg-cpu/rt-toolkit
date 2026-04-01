"use client";

import { useState, useEffect } from "react";
import { calculateIsl, formatMultiplier } from "@/lib/calculations/isl";
import { minutesToMmSs } from "@/lib/calculations/ciSec";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IslCalc() {
  const [d1, setD1] = useState("36");
  const [d2, setD2] = useState("48");
  const [t1, setT1] = useState("27.0");
  const [units, setUnits] = useState<"in" | "ft">("in");
  const [timeUnits, setTimeUnits] = useState<"min" | "sec">("min");
  const [result, setResult] = useState<ReturnType<typeof calculateIsl> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d1, d2, t1, units, timeUnits]);

  function calc() {
    setError("");
    const D1 = parseFloat(d1);
    const D2 = parseFloat(d2);
    const T1 = parseFloat(t1);
    if (isNaN(D1) || isNaN(D2) || isNaN(T1)) {
      setResult(null);
      return;
    }
    try {
      setResult(calculateIsl(T1, D1, D2));
    } catch (e) {
      setError(String(e));
      setResult(null);
    }
  }

  const t1Minutes = result
    ? timeUnits === "sec"
      ? parseFloat(t1) / 60
      : parseFloat(t1)
    : 0;

  const t2Minutes = result
    ? timeUnits === "sec"
      ? result.newExposure / 60
      : result.newExposure
    : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Formula reminder */}
      <div className="formula-box">
        <p className="text-xs text-muted-foreground font-mono">E₂ = E₁ × (D₂ / D₁)²</p>
        <p className="text-xs text-muted-foreground mt-1">
          New exposure required when changing Source-to-Film Distance (SFD)
        </p>
      </div>

      {/* Distance units */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Distance Units
          </Label>
          <Select value={units} onValueChange={(v) => setUnits(v as "in" | "ft")}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="in" className="py-3">Inches</SelectItem>
              <SelectItem value="ft" className="py-3">Feet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Time Units
          </Label>
          <Select value={timeUnits} onValueChange={(v) => setTimeUnits(v as "min" | "sec")}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="min" className="py-3">Minutes</SelectItem>
              <SelectItem value="sec" className="py-3">Seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            D₁ — Original SFD ({units})
          </Label>
          <Input
            type="number"
            value={d1}
            onChange={(e) => setD1(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            D₂ — New SFD ({units})
          </Label>
          <Input
            type="number"
            value={d2}
            onChange={(e) => setD2(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          E₁ — Original Exposure Time ({timeUnits})
        </Label>
        <Input
          type="number"
          value={t1}
          onChange={(e) => setT1(e.target.value)}
          className="h-12 text-base tabular-nums input-dark"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm border border-destructive rounded p-2">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <Card className="p-4 animate-result glass-card-elevated">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                New Exposure Time
              </p>
              <p className="result-value-lg tabular-nums text-cyan-300">
                {minutesToMmSs(t2Minutes)}
              </p>
              <p className="text-muted-foreground text-sm">
                {t2Minutes.toFixed(2)} min
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="tabular-nums font-bold text-xl text-blue-300">
                {formatMultiplier(result.multiplier)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Original ({d1}{units})</p>
              <p className="tabular-nums font-semibold">
                {minutesToMmSs(t1Minutes)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">New ({d2}{units})</p>
              <p className="tabular-nums font-semibold text-blue-300">
                {minutesToMmSs(t2Minutes)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
