"use client";

import { useState, useEffect } from "react";
import { minutesToMmSs } from "@/lib/calculations/ciSec";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExposureCorrectCalc() {
  const [e1,  setE1]  = useState("3.0");   // original exposure (min)
  const [fd1, setFd1] = useState("1.8");   // achieved density
  const [fd2, setFd2] = useState("2.5");   // target density
  const [e2,  setE2]  = useState<number | null>(null);

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e1, fd1, fd2]);

  function calc() {
    const E1  = parseFloat(e1);
    const FD1 = parseFloat(fd1);
    const FD2 = parseFloat(fd2);
    if (isNaN(E1) || isNaN(FD1) || isNaN(FD2) || FD1 <= 0 || E1 <= 0) {
      setE2(null);
      return;
    }
    setE2((E1 * FD2) / FD1);
  }

  const E1  = parseFloat(e1);
  const FD1 = parseFloat(fd1);
  const FD2 = parseFloat(fd2);
  const densityDiff = e2 !== null ? FD2 - FD1 : 0;
  const direction   = densityDiff > 0.001 ? "Increase exposure" : densityDiff < -0.001 ? "Decrease exposure" : "No change";

  return (
    <div className="p-4 space-y-4">
      {/* Formula */}
      <div className="formula-box">
        <p className="text-xs font-mono text-muted-foreground">E₁ / FD₁ = E₂ / FD₂</p>
        <p className="text-xs text-muted-foreground mt-1">
          Correct exposure time when achieved film density differs from target.
          FD = optical density (densitometer reading).
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            E₁ — Shot Time (min)
          </Label>
          <Input
            type="number"
            value={e1}
            onChange={(e) => setE1(e.target.value)}
            step="0.1"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            FD₁ — Achieved Density
          </Label>
          <Input
            type="number"
            value={fd1}
            onChange={(e) => setFd1(e.target.value)}
            step="0.01"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          FD₂ — Target Density
        </Label>
        <Input
          type="number"
          value={fd2}
          onChange={(e) => setFd2(e.target.value)}
          step="0.01"
          className="h-12 text-base tabular-nums input-dark"
        />
      </div>

      {/* Result */}
      {e2 !== null && (
        <Card className="p-4 animate-result glass-card-elevated">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Corrected Exposure
              </p>
              <p className="result-value-lg tabular-nums text-cyan-300">
                {minutesToMmSs(e2)}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {e2.toFixed(2)} min
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Density Δ</p>
              <p className={`tabular-nums font-bold text-xl ${densityDiff > 0.001 ? "text-amber-400" : densityDiff < -0.001 ? "text-blue-400" : "text-muted-foreground"}`}>
                {densityDiff >= 0 ? "+" : ""}{densityDiff.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-0.5 ${densityDiff > 0.001 ? "text-amber-400/70" : densityDiff < -0.001 ? "text-blue-400/70" : "text-muted-foreground"}`}>
                {direction}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Original Shot</p>
              <p className="tabular-nums font-semibold mt-0.5">{minutesToMmSs(E1)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">FD {FD1.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Corrected</p>
              <p className="tabular-nums font-semibold text-cyan-300 mt-0.5">{minutesToMmSs(e2)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">FD {FD2.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
