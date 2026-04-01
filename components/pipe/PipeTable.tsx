"use client";

import { useState, useMemo } from "react";
import { PIPE_SCHEDULES } from "@/lib/data/pipeSchedules";
import { ScheduleEntry } from "@/types";
import { calculateIqi } from "@/lib/data/iqiWires";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipeTable() {
  const [selectedNps, setSelectedNps] = useState<string>("8");
  const [copiedSchedule, setCopiedSchedule] = useState<string | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);

  const pipe = useMemo(
    () => PIPE_SCHEDULES.find((p) => p.nps === selectedNps),
    [selectedNps]
  );

  function handleCopy(entry: ScheduleEntry) {
    const text = `Wall: ${entry.wall.toFixed(3)}"`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSchedule(entry.schedule);
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopiedSchedule(null), 2000);
    }).catch(() => {
      // Clipboard API not available (e.g. non-HTTPS)
    });
  }

  function handleScheduleClick(entry: ScheduleEntry) {
    handleCopy(entry);
    setExpandedSchedule(
      expandedSchedule === entry.schedule ? null : entry.schedule
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">
          NPS Size
        </label>
        <Select value={selectedNps} onValueChange={(v) => v && setSelectedNps(v)}>
          <SelectTrigger className="h-12 text-base input-dark">
            <SelectValue placeholder="Select NPS" />
          </SelectTrigger>
          <SelectContent className="select-dropdown">
            {PIPE_SCHEDULES.map((p) => (
              <SelectItem key={p.nps} value={p.nps} className="text-base py-3">
                NPS {p.npsDisplay} — OD {p.od.toFixed(3)}&quot;
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pipe && (
        <>
          {/* OD Info Card */}
          <Card className="p-4 glass-card-elevated gradient-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Outer Diameter
                </p>
                <p
                  className="tabular-nums font-bold"
                  style={{ fontSize: "2rem", color: "#fff" }}
                >
                  {pipe.od.toFixed(3)}&quot;
                </p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {(pipe.od * 25.4).toFixed(2)} mm
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {pipe.odNominalEqual ? (
                  <Badge className="bg-green-900 text-green-300 border-green-700 text-xs">
                    NPS = OD
                  </Badge>
                ) : (
                  <Badge className="bg-amber-900 text-amber-300 border-amber-700 text-xs">
                    OD ≠ NPS
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  NPS {pipe.npsDisplay}
                </p>
              </div>
            </div>
            {!pipe.odNominalEqual && (
              <p className="text-amber-400 text-xs mt-2 border-t border-border pt-2">
                OD is NOT equal to NPS designation. Nominal size only — verify OD before calculating.
              </p>
            )}
          </Card>

          {/* Schedule Table */}
          <div>
            <p className="section-label mb-2">
              Schedules — smallest to largest wall
            </p>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 pb-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Schedule</span>
              <span className="text-right">Wall</span>
              <span className="text-right">OD</span>
              <span className="text-right">Wire #</span>
            </div>

            <div className="space-y-1.5">
              {[...pipe.schedules]
                .sort((a, b) => a.wall - b.wall)
                .map((entry) => {
                  const isCopied = copiedSchedule === entry.schedule;
                  const isExpanded = expandedSchedule === entry.schedule;
                  const iqi = calculateIqi(entry.wall, "SWE/SWV", "Source Side");

                  return (
                    <div key={entry.schedule}>
                      <button
                        onClick={() => handleScheduleClick(entry)}
                        className={cn(
                          "w-full grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center p-3 rounded-lg border transition-all text-left",
                          isExpanded
                            ? "border-blue-500 bg-blue-950/30"
                            : "border-white/[0.04] hover:border-blue-700 glass-card"
                        )}
                        style={{
                          borderLeftWidth: "3px",
                          borderLeftColor: iqi.set === "A" ? "rgba(96, 165, 250, 0.5)"
                            : iqi.set === "B" ? "rgba(52, 211, 153, 0.5)"
                            : "rgba(251, 191, 36, 0.5)",
                        }}
                      >
                        {/* Schedule name */}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {entry.schedule}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {(entry.wall * 25.4).toFixed(2)} mm
                          </p>
                        </div>

                        {/* Wall thickness */}
                        <div className="text-right">
                          <p className="tabular-nums font-bold text-base text-white">
                            {entry.wall.toFixed(3)}&quot;
                          </p>
                          {isCopied && (
                            <ClipboardCheck size={12} className="text-green-400 ml-auto mt-0.5" />
                          )}
                        </div>

                        {/* OD */}
                        <div className="text-right">
                          <p className="tabular-nums text-sm text-muted-foreground">
                            {pipe.od.toFixed(3)}&quot;
                          </p>
                        </div>

                        {/* Wire # */}
                        <div className="text-right min-w-[3.5rem]">
                          <Badge className={cn(
                            "text-[10px] tabular-nums",
                            iqi.set === "A" ? "bg-blue-900/60 text-blue-300 border-blue-700/50"
                              : iqi.set === "B" ? "bg-emerald-900/60 text-emerald-300 border-emerald-700/50"
                              : "bg-amber-900/60 text-amber-300 border-amber-700/50"
                          )}>
                            #{iqi.essentialWireNumber} {iqi.set}
                          </Badge>
                        </div>
                      </button>

                      {/* Expanded IQI Details */}
                      {isExpanded && (
                        <div
                          className="rounded-b-lg border border-t-0 border-blue-500 p-4 space-y-2 animate-result formula-box"
                        >
                          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                            IQI Details — ASTM E747
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Parent material wall:{" "}
                            <span className="text-white font-semibold">
                              {entry.wall.toFixed(3)}&quot;
                            </span>
                            {" "}— reinforcement excluded per ASME V T-274.2
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.06]">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Source Side</p>
                              <p className="font-bold text-white text-sm mt-0.5">
                                Wire #{iqi.essentialWireNumber} — Set {iqi.set}
                              </p>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {iqi.essentialWireDiam.toFixed(4)}&quot; ({(iqi.essentialWireDiam * 25.4).toFixed(2)} mm)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Film Side</p>
                              <p className="font-bold text-amber-300 text-sm mt-0.5">
                                Wire #{Math.min(iqi.essentialWireNumber + 1, 16)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {iqi.holeTypeEquiv}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
