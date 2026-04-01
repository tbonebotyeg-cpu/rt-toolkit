"use client";

import { useState, useEffect } from "react";
import { SourceType } from "@/types";
import { calculateUg, UG_LIMIT_MM, inToMm } from "@/lib/calculations/ug";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

const SOURCE_DEFAULTS: Record<SourceType, number> = {
  "Ir-192": 3.0,
  "Co-60": 3.0,
};

export default function UgCalc() {
  const [sourceType, setSourceType] = useState<SourceType>("Ir-192");
  const [fs, setFs] = useState("3.0");
  const [t, setT] = useState("10");
  const [d, setD] = useState("600");
  const [units, setUnits] = useState<"mm" | "in">("mm");
  const [result, setResult] = useState<ReturnType<typeof calculateUg> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setFs(String(SOURCE_DEFAULTS[sourceType]));
  }, [sourceType]);

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs, t, d, units]);

  function calc() {
    setError("");
    const fsVal = parseFloat(fs);
    const tVal = parseFloat(t);
    const dVal = parseFloat(d);
    if (isNaN(fsVal) || isNaN(tVal) || isNaN(dVal)) {
      setResult(null);
      return;
    }
    try {
      const fsMm = units === "in" ? inToMm(fsVal) : fsVal;
      const tMm = units === "in" ? inToMm(tVal) : tVal;
      const dMm = units === "in" ? inToMm(dVal) : dVal;
      setResult(calculateUg(fsMm, tMm, dMm));
    } catch (e) {
      setError(String(e));
      setResult(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Source + Units */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Source
          </Label>
          <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="Ir-192" className="py-3">Ir-192</SelectItem>
              <SelectItem value="Co-60" className="py-3">Co-60</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Units
          </Label>
          <Select value={units} onValueChange={(v) => setUnits(v as "mm" | "in")}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="mm" className="py-3">mm</SelectItem>
              <SelectItem value="in" className="py-3">inches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formula reminder */}
      <div className="formula-box">
        <p className="text-xs text-muted-foreground font-mono">
          Ug = (Fs × t) / D
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Fs = source size · t = object-to-film dist · D = source-to-object dist (SOD)
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Fs — Source Focal Spot Size ({units})
          </Label>
          <Input
            type="number"
            value={fs}
            onChange={(e) => setFs(e.target.value)}
            placeholder="3.0"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            t — Object-to-Film Distance ({units})
          </Label>
          <Input
            type="number"
            value={t}
            onChange={(e) => setT(e.target.value)}
            placeholder="10"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            D — Source-to-Object Distance / SOD ({units})
          </Label>
          <Input
            type="number"
            value={d}
            onChange={(e) => setD(e.target.value)}
            placeholder="600"
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
      {result && (
        <Card
          className="p-4 animate-result glass-card-elevated overflow-hidden"
          style={{
            borderTopWidth: "2px",
            borderTopColor: result.pass ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Geometric Unsharpness (Ug)
              </p>
              <p className={`result-value-lg tabular-nums ${result.pass ? "text-emerald-400" : "text-red-400"}`}>
                {result.ug.toFixed(3)} mm
              </p>
              <p className="text-muted-foreground text-sm">
                {result.ugInches.toFixed(4)}&quot;
              </p>
            </div>
            {result.pass ? (
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-green-900 text-green-300 border-green-700">
                  PASS
                </Badge>
                <CheckCircle size={20} className="text-green-400" />
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-red-900 text-red-300 border-red-700">
                  FAIL
                </Badge>
                <XCircle size={20} className="text-red-400" />
              </div>
            )}
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">
              ASME V T-274.2 limit: Ug ≤ {UG_LIMIT_MM} mm (0.020&quot;)
            </p>
            {!result.pass && (
              <p className="text-red-400 text-xs mt-1">
                Ug exceeds limit by {(result.ug - UG_LIMIT_MM).toFixed(3)} mm — increase SOD or reduce source size.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
