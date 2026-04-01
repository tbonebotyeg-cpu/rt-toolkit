"use client";

import { useState, useEffect } from "react";
import { SourceType } from "@/types";
import { calculateDecay, formatActivity, HALF_LIVES_DAYS } from "@/lib/calculations/decay";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DecayCalc() {
  const today = new Date().toISOString().split("T")[0];

  const [sourceType, setSourceType] = useState<SourceType>("Ir-192");
  const [calActivity, setCalActivity] = useState("100");
  const [calDate, setCalDate] = useState(today);
  const [targetDate, setTargetDate] = useState(today);
  const [result, setResult] = useState<ReturnType<typeof calculateDecay> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    calc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, calActivity, calDate, targetDate]);

  function calc() {
    setError("");
    const a0 = parseFloat(calActivity);
    if (!calActivity || isNaN(a0) || a0 <= 0) {
      setResult(null);
      return;
    }
    try {
      const cal = new Date(calDate);
      const target = new Date(targetDate);
      if (isNaN(cal.getTime()) || isNaN(target.getTime())) return;
      setResult(calculateDecay(a0, cal, target, sourceType));
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Source Selector */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Source
          </Label>
          <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
            <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#1a1a24" }}>
              <SelectItem value="Ir-192" className="py-3">Ir-192</SelectItem>
              <SelectItem value="Co-60" className="py-3">Co-60</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Cal Activity (Ci)
          </Label>
          <Input
            type="number"
            value={calActivity}
            onChange={(e) => setCalActivity(e.target.value)}
            placeholder="100"
            className="h-12 text-base tabular-nums"
            style={{ backgroundColor: "#1a1a24" }}
          />
        </div>
      </div>

      {/* Half-life info */}
      <p className="text-xs text-muted-foreground">
        Half-life:{" "}
        <span className="text-foreground font-semibold">
          {HALF_LIVES_DAYS[sourceType].toFixed(2)} days
          {sourceType === "Co-60" ? " (5.271 years)" : ""}
        </span>
      </p>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Cal Date
          </Label>
          <Input
            type="date"
            value={calDate}
            onChange={(e) => setCalDate(e.target.value)}
            className="h-12 text-base"
            style={{ backgroundColor: "#1a1a24" }}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Target Date
          </Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-12 text-base"
            style={{ backgroundColor: "#1a1a24" }}
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
          className="p-4 space-y-3 animate-result"
          style={{ backgroundColor: "#1a1a24" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Activity at Target Date
              </p>
              <p className="result-value-lg tabular-nums">
                {formatActivity(result.activityAtTarget)}
              </p>
            </div>
            <Badge
              className={cn(
                "text-xs",
                result.activityAtTarget < 10
                  ? "bg-red-900 text-red-300 border-red-700"
                  : result.activityAtTarget < 30
                  ? "bg-amber-900 text-amber-300 border-amber-700"
                  : "bg-green-900 text-green-300 border-green-700"
              )}
            >
              {sourceType}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
            <Stat label="Days Elapsed" value={result.daysElapsed.toFixed(1)} />
            <Stat label="Decayed" value={`${result.decayPercent.toFixed(1)}%`} />
            <Stat label="Remaining" value={`${(100 - result.decayPercent).toFixed(1)}%`} />
          </div>

          {/* Projections */}
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Projections from Target
            </p>
            <div className="space-y-1.5">
              {result.projections.map((p) => (
                <div
                  key={p.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-muted-foreground">{p.label}</span>
                  <span className="tabular-nums font-semibold text-sm">
                    {formatActivity(p.activity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular-nums font-bold text-sm text-foreground">{value}</p>
    </div>
  );
}
