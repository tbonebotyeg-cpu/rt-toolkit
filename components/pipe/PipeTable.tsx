"use client";

import { useState, useMemo } from "react";
import { PIPE_SCHEDULES } from "@/lib/data/pipeSchedules";
import { IQI_WIRES } from "@/lib/data/iqiWires";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ASME Section V, Article 2, Table T-276
// Source-side essential wire by nominal single-wall material thickness
function selectSourceWire(wallInches: number): number {
  if (wallInches <= 0.25) return 5;
  if (wallInches <= 0.375) return 6;
  if (wallInches <= 0.50) return 7;
  if (wallInches <= 0.75) return 8;
  if (wallInches <= 1.00) return 9;
  if (wallInches <= 1.50) return 10;
  if (wallInches <= 2.00) return 11;
  if (wallInches <= 2.50) return 12;
  return 13;
}

function getWireDiam(wireNumber: number) {
  return IQI_WIRES.find((w) => w.wireNumber === wireNumber);
}

function wireSetLabel(wireNumber: number): "A" | "B" | "C" {
  if (wireNumber <= 7) return "A";
  if (wireNumber <= 13) return "B";
  return "C";
}

export default function PipeTable() {
  const [selectedNps, setSelectedNps] = useState<string>("8");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");

  const pipe = useMemo(
    () => PIPE_SCHEDULES.find((p) => p.nps === selectedNps),
    [selectedNps]
  );

  const sortedSchedules = useMemo(() => {
    if (!pipe) return [];
    return [...pipe.schedules].sort((a, b) => a.wall - b.wall);
  }, [pipe]);

  // Reset schedule when NPS changes
  function handleNpsChange(nps: string | null) {
    if (!nps) return;
    setSelectedNps(nps);
    setSelectedSchedule("");
  }

  const entry = useMemo(
    () => sortedSchedules.find((s) => s.schedule === selectedSchedule),
    [sortedSchedules, selectedSchedule]
  );

  const derived = useMemo(() => {
    if (!pipe || !entry) return null;
    const wall = entry.wall;
    const od = pipe.od;
    const id = od - 2 * wall;
    const sourceWire = selectSourceWire(wall);
    const filmWire = Math.max(sourceWire - 1, 1);
    const sourceSet = wireSetLabel(sourceWire);
    const filmSet = wireSetLabel(filmWire);
    const sourceWireData = getWireDiam(sourceWire);
    const filmWireData = getWireDiam(filmWire);
    return { wall, od, id, sourceWire, filmWire, sourceSet, filmSet, sourceWireData, filmWireData };
  }, [pipe, entry]);

  return (
    <div className="space-y-4">
      {/* Dropdowns — side by side, edge to edge */}
      <div className="grid grid-cols-2 gap-2 pt-4 px-2">
        <div>
          <label className="section-label block mb-2 px-1">Pipe Size (NPS)</label>
          <Select value={selectedNps} onValueChange={handleNpsChange}>
            <SelectTrigger className="h-14 text-base input-dark px-3 w-full">
              <SelectValue placeholder="Select NPS" />
            </SelectTrigger>
            <SelectContent className="select-dropdown !w-[calc(100vw-1rem)]" align="start">
              {PIPE_SCHEDULES.filter((p) => !["1/8","1/4","3/8"].includes(p.nps)).map((p, i) => (
                <SelectItem key={p.nps} value={p.nps} className={`text-base py-3.5 justify-center text-center ${i % 2 === 1 ? "bg-white/[0.04]" : ""}`}>
                  NPS {p.npsDisplay}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="section-label block mb-2 px-1">Schedule</label>
          <Select value={selectedSchedule} onValueChange={(v) => v && setSelectedSchedule(v)}>
            <SelectTrigger className="h-14 text-base input-dark px-3 w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="select-dropdown !w-[calc(100vw-1rem)]" align="end">
              {sortedSchedules.map((s, i) => (
                <SelectItem key={s.schedule} value={s.schedule} className={`text-base py-3.5 justify-center text-center ${i % 2 === 1 ? "bg-white/[0.04]" : ""}`}>
                  {s.schedule}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Card */}
      {derived && entry && pipe && (
        <div className="mx-4 glass-card-elevated gradient-border rounded-xl p-5 space-y-5 animate-result">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                NPS {pipe.npsDisplay} — {entry.schedule}
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                pipe.odNominalEqual
                  ? "bg-green-900/60 text-green-300 border-green-700/50"
                  : "bg-amber-900/60 text-amber-300 border-amber-700/50"
              )}>
                {pipe.odNominalEqual ? "NPS = OD" : "OD ≠ NPS"}
              </span>
            </div>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* Dimensions Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Wall Thickness */}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Wall
              </p>
              <p className="tabular-nums font-black text-white leading-none" style={{ fontSize: "1.5rem" }}>
                {derived.wall.toFixed(3)}&quot;
              </p>
              <p className="tabular-nums text-xs text-blue-300 mt-1.5 font-medium">
                {(derived.wall * 25.4).toFixed(2)} mm
              </p>
            </div>

            {/* Outside Diameter */}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                OD
              </p>
              <p className="tabular-nums font-black text-white leading-none" style={{ fontSize: "1.5rem" }}>
                {derived.od.toFixed(3)}&quot;
              </p>
              <p className="tabular-nums text-xs text-blue-300 mt-1.5 font-medium">
                {(derived.od * 25.4).toFixed(2)} mm
              </p>
            </div>

            {/* Inside Diameter */}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                ID
              </p>
              <p className="tabular-nums font-black text-white leading-none" style={{ fontSize: "1.5rem" }}>
                {derived.id.toFixed(3)}&quot;
              </p>
              <p className="tabular-nums text-xs text-blue-300 mt-1.5 font-medium">
                {(derived.id * 25.4).toFixed(2)} mm
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* IQI Wire Selection */}
          <div>
            <p className="section-label mb-3">IQI Wire Selection</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Source Side */}
              <div className="rounded-lg border border-blue-700/40 bg-blue-950/25 p-4">
                <p className="text-[10px] text-blue-400 uppercase tracking-widest font-medium mb-3">
                  Source Side
                </p>
                <p className="tabular-nums font-black text-white leading-none" style={{ fontSize: "2rem" }}>
                  #{derived.sourceWire}
                </p>
                <p className="text-xs text-blue-300 font-semibold mt-1">
                  {derived.sourceWire >= 6 ? "B Penny" : "A Penny"}
                </p>
                {derived.sourceWireData && (
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-2">
                    ∅ {derived.sourceWireData.diameterIn.toFixed(4)}&quot;
                    {" / "}{derived.sourceWireData.diameterMm.toFixed(2)} mm
                  </p>
                )}
              </div>

              {/* Film Side */}
              <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4">
                <p className="text-[10px] text-amber-400 uppercase tracking-widest font-medium mb-3">
                  Film Side
                </p>
                <p className="tabular-nums font-black text-white leading-none" style={{ fontSize: "2rem" }}>
                  #{derived.filmWire}
                </p>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  {derived.filmWire >= 6 ? "B Penny" : "A Penny"}
                </p>
                {derived.filmWireData && (
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-2">
                    ∅ {derived.filmWireData.diameterIn.toFixed(4)}&quot;
                    {" / "}{derived.filmWireData.diameterMm.toFixed(2)} mm
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Footer note */}
          <p className="text-[10px] text-muted-foreground/60 border-t border-white/[0.04] pt-3 leading-relaxed">
            IQI based on nominal single-wall (parent material) thickness only — weld reinforcement and backing rings excluded per ASME V T-274.2
          </p>
        </div>
      )}

      {/* Prompt when no schedule selected */}
      {pipe && !entry && (
        <div className="mx-4 rounded-xl border border-white/[0.06] glass-card p-6 text-center">
          <p className="text-muted-foreground text-sm">Select a schedule to see wall thickness and IQI wire data.</p>
        </div>
      )}
    </div>
  );
}
