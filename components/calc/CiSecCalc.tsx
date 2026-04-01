"use client";

import { useState, useEffect } from "react";
import { recalcExposureTime, computeCiSec, minutesToMmSs } from "@/lib/calculations/ciSec";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CiSecCalc() {
  const [a1, setA1] = useState("85");
  const [t1, setT1] = useState("2.5");
  const [a2, setA2] = useState("70");
  const [result, setResult] = useState<ReturnType<typeof recalcExposureTime> | null>(null);
  const [originalCiSec, setOriginalCiSec] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a1, t1, a2]);

  function calc() {
    setError("");
    const A1 = parseFloat(a1);
    const T1 = parseFloat(t1);
    const A2 = parseFloat(a2);
    if (isNaN(A1) || isNaN(T1) || isNaN(A2)) {
      setResult(null);
      setOriginalCiSec(null);
      return;
    }
    try {
      setOriginalCiSec(computeCiSec(A1, T1));
      setResult(recalcExposureTime(T1, A1, A2));
    } catch (e) {
      setError(String(e));
      setResult(null);
      setOriginalCiSec(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Formula reminder */}
      <div className="formula-box">
        <p className="text-xs text-muted-foreground font-mono">
          T₂ = T₁ × (A₁ / A₂)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Adjust exposure time when source activity changes. CI·sec = Activity × Time × 60
        </p>
      </div>

      {/* Original shot */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              A₁ — Original Activity (Ci)
            </Label>
            <Input
              type="number"
              value={a1}
              onChange={(e) => setA1(e.target.value)}
              placeholder="85"
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              T₁ — Original Time (min)
            </Label>
            <Input
              type="number"
              value={t1}
              onChange={(e) => setT1(e.target.value)}
              placeholder="2.5"
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            A₂ — New Activity (Ci)
          </Label>
          <Input
            type="number"
            value={a2}
            onChange={(e) => setA2(e.target.value)}
            placeholder="70"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm border border-destructive rounded p-2">
          {error}
        </p>
      )}

      {/* Result */}
      {result && originalCiSec !== null && (
        <Card className="p-4 space-y-3 animate-result glass-card-elevated">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                New Exposure Time
              </p>
              <p className="result-value-lg tabular-nums text-cyan-300">
                {result.newTimeDisplay}
              </p>
              <p className="text-muted-foreground text-sm">
                {result.newTimeMinutes.toFixed(2)} min
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ratio</p>
              <p className="tabular-nums font-bold text-xl text-blue-300">
                {(parseFloat(a1) / parseFloat(a2)).toFixed(3)}×
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Original ({a1} Ci)
              </p>
              <p className="tabular-nums font-semibold">
                {minutesToMmSs(parseFloat(t1))}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {originalCiSec.toFixed(0)} CI·sec
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                New ({a2} Ci)
              </p>
              <p className="tabular-nums font-semibold text-blue-300">
                {result.newTimeDisplay}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {result.ciSec.toFixed(0)} CI·sec
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
