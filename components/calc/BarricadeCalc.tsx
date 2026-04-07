"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

// Dose rate constant k (mR·ft² / Ci·hr): DR(mR/hr) = k × A(Ci) / d(ft)²
// Derived from specific gamma ray constant Γ:
//   Ir-192: Γ = 4.69 mR·cm²/(mCi·hr)  →  k = 4.69 × 1000 / 30.48² ≈ 5.05
//   Co-60:  Γ = 13.07 mR·cm²/(mCi·hr) →  k = 13.07 × 1000 / 30.48² ≈ 14.07
const GAMMA_K: Record<string, number> = {
  "Ir-192": 5.05,
  "Co-60": 14.07,
};

const LIMITS = [
  { mR: 2,   label: "2 mR",   desc: "ALARA public boundary",   color: "text-emerald-400", bg: "bg-emerald-400/8" },
  { mR: 2.5, label: "2.5 mR", desc: "¼ × 10 mR/hr limit",      color: "text-emerald-400", bg: "bg-emerald-400/8" },
  { mR: 5,   label: "5 mR",   desc: "Restricted boundary",     color: "text-amber-400",   bg: "bg-amber-400/8" },
  { mR: 10,  label: "10 mR",  desc: "Controlled area limit",   color: "text-amber-400",   bg: "bg-amber-400/8" },
  { mR: 100, label: "100 mR", desc: "Radiation worker / box",  color: "text-red-400",     bg: "bg-red-400/8" },
];

export default function BarricadeCalc() {
  const [sourceType, setSourceType] = useState<"Ir-192" | "Co-60">("Ir-192");
  const [activity, setActivity]     = useState("75");
  const [shotTime, setShotTime]     = useState("2.5");
  const [distances, setDistances]   = useState<{ mR: number; ft: number; m: number }[]>([]);

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, activity, shotTime]);

  function calc() {
    const A   = parseFloat(activity);
    const t   = parseFloat(shotTime) / 60; // minutes → hours
    if (isNaN(A) || isNaN(t) || A <= 0 || t <= 0) {
      setDistances([]);
      return;
    }
    const k = GAMMA_K[sourceType];
    setDistances(
      LIMITS.map(({ mR }) => {
        const ft = Math.sqrt((k * A * t) / mR);
        return { mR, ft, m: ft * 0.3048 };
      })
    );
  }

  const A      = parseFloat(activity);
  const t_min  = parseFloat(shotTime);
  const valid  = !isNaN(A) && !isNaN(t_min) && A > 0 && t_min > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Formula */}
      <div className="formula-box">
        <p className="text-xs font-mono text-muted-foreground">d = √( k × A × t / D )</p>
        <p className="text-xs text-muted-foreground mt-1">
          Minimum safe barricade distance for given dose limit.
          k: Ir-192 = 5.05 · Co-60 = 14.07 &nbsp;(mR·ft²/Ci·hr)
        </p>
      </div>

      {/* Source type */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          Source Type
        </Label>
        <Select value={sourceType} onValueChange={(v) => setSourceType(v as "Ir-192" | "Co-60")}>
          <SelectTrigger className="h-12 input-dark">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="select-dropdown">
            <SelectItem value="Ir-192" className="py-3">Ir-192 (Iridium-192)</SelectItem>
            <SelectItem value="Co-60"  className="py-3">Co-60 (Cobalt-60)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity + time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Activity (Ci)
          </Label>
          <Input
            type="number"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Shot Time (min)
          </Label>
          <Input
            type="number"
            value={shotTime}
            onChange={(e) => setShotTime(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>

      {/* Results */}
      {valid && distances.length > 0 && (
        <Card className="overflow-hidden glass-card-elevated animate-result">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <ShieldAlert size={14} className="text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Minimum Barricade Distances
            </span>
          </div>

          <div className="divide-y divide-border">
            {LIMITS.map((limit, i) => {
              const d = distances[i];
              return (
                <div key={limit.mR} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className={cn("font-semibold text-sm", limit.color)}>{limit.label}</p>
                    <p className="text-xs text-muted-foreground">{limit.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("tabular-nums font-bold text-xl leading-none", limit.color)}>
                      {d.ft.toFixed(1)} ft
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {d.m.toFixed(1)} m
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-border bg-white/[0.02]">
            <p className="text-[10px] text-muted-foreground text-center">
              {sourceType} · {A} Ci · {t_min} min · k = {GAMMA_K[sourceType]} mR·ft²/(Ci·hr)
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
