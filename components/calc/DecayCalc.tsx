"use client";

import { useState, useEffect } from "react";
import { SourceType } from "@/types";
import { loadSettings, updateSettings } from "@/lib/storage/settings";
import { calculateDecay, formatActivity, HALF_LIVES_DAYS } from "@/lib/calculations/decay";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DecayCalc() {
  const today = new Date().toISOString().split("T")[0];

  const [sourceType, setSourceType] = useState<SourceType>("Ir-192");
  const [calActivity, setCalActivity] = useState("100");
  const [calDate, setCalDate] = useState(today);
  const [cameraSerial, setCameraSerial] = useState("");
  const [targetDate, setTargetDate] = useState(today);
  const [result, setResult] = useState<ReturnType<typeof calculateDecay> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load saved source data on mount
  useEffect(() => {
    const s = loadSettings();
    setSourceType(s.pinnedSourceType);
    setCalActivity(String(s.pinnedSourceActivityCi));
    setCalDate(s.pinnedSourceCalDate);
    setCameraSerial(s.cameraSerial || "");
  }, []);

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

  function handleSaveSource() {
    updateSettings({
      pinnedSourceType: sourceType,
      pinnedSourceActivityCi: parseFloat(calActivity) || 0,
      pinnedSourceCalDate: calDate,
      cameraSerial,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Source Info */}
      <div className="glass-card rounded-xl p-3.5 space-y-3">
        <p className="section-label">Source Info</p>

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
              Cal Activity (Ci)
            </Label>
            <Input
              type="number"
              value={calActivity}
              onChange={(e) => setCalActivity(e.target.value)}
              placeholder="100"
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              Cal Date
            </Label>
            <Input
              type="date"
              value={calDate}
              onChange={(e) => setCalDate(e.target.value)}
              className="h-12 text-base input-dark"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              Camera S/N
            </Label>
            <Input
              value={cameraSerial}
              onChange={(e) => setCameraSerial(e.target.value)}
              placeholder="e.g. IR-2045"
              className="h-12 text-base input-dark"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveSource}
          className="w-full h-10 text-sm font-semibold gap-2"
          variant={saved ? "secondary" : "default"}
        >
          {saved ? "Saved!" : <><Save size={14} /> Save Source</>}
        </Button>
      </div>

      {/* Half-life info */}
      <div className="formula-box">
        <p className="text-xs text-muted-foreground">
          Half-life:{" "}
          <span className="text-foreground font-semibold">
            {HALF_LIVES_DAYS[sourceType].toFixed(2)} days
            {sourceType === "Co-60" ? " (5.271 years)" : ""}
          </span>
        </p>
      </div>

      {/* Target Date */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          Target Date
        </Label>
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-12 text-base input-dark"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm border border-destructive rounded p-2">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <Card
          className="p-4 space-y-3 animate-result glass-card-elevated overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Activity at Target Date
              </p>
              <p className={cn(
                "result-value-lg tabular-nums",
                result.activityAtTarget >= 50 ? "text-emerald-400" : result.activityAtTarget >= 20 ? "text-amber-300" : "text-red-400"
              )}>
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
                  <span className={cn(
                    "tabular-nums font-semibold text-sm",
                    p.activity >= 50 ? "text-emerald-400" : p.activity >= 20 ? "text-amber-300" : "text-red-400"
                  )}>
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
