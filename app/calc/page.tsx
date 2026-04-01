"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import DecayCalc from "@/components/calc/DecayCalc";
import UgCalc from "@/components/calc/UgCalc";
import IslCalc from "@/components/calc/IslCalc";
import CiSecCalc from "@/components/calc/CiSecCalc";
import ShotTimeCalc from "@/components/calc/ShotTimeCalc";

const TABS = [
  { key: "decay", label: "Decay" },
  { key: "ug", label: "Ug" },
  { key: "isl", label: "ISL" },
  { key: "cisec", label: "CI·sec" },
  { key: "shottime", label: "Shot Time" },
] as const;

type CalcTab = (typeof TABS)[number]["key"];

export default function CalcPage() {
  const [tab, setTab] = useState<CalcTab>("decay");

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Calculators</h1>
      </div>

      {/* Tab Bar */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-all duration-200 rounded-lg min-h-0",
                tab === key
                  ? "text-white bg-blue-500/20 shadow-sm shadow-blue-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "decay" && <DecayCalc />}
      {tab === "ug" && <UgCalc />}
      {tab === "isl" && <IslCalc />}
      {tab === "cisec" && <CiSecCalc />}
      {tab === "shottime" && <ShotTimeCalc />}
    </div>
  );
}
