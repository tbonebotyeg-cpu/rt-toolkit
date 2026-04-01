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
      <div
        className="flex border-b"
        style={{ borderColor: "#2a2a38" }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors min-h-0",
              tab === key
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
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
