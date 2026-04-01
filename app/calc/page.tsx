"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import DecayCalc from "@/components/calc/DecayCalc";
import UgCalc from "@/components/calc/UgCalc";
import IslCalc from "@/components/calc/IslCalc";
import CiSecCalc from "@/components/calc/CiSecCalc";
import ShotTimeCalc from "@/components/calc/ShotTimeCalc";

const TABS = [
  { key: "decay",    label: "Decay",     desc: "Activity" },
  { key: "ug",       label: "Ug",        desc: "Sharpness" },
  { key: "isl",      label: "ISL",       desc: "Correction" },
  { key: "cisec",    label: "CI·sec",    desc: "Dose" },
  { key: "shottime", label: "Shot Time", desc: "Exposure" },
] as const;

type CalcTab = (typeof TABS)[number]["key"];

export default function CalcPage() {
  const [tab, setTab] = useState<CalcTab>("decay");

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold tracking-tight">Calculators</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {TABS.find(t => t.key === tab)?.desc}
        </p>
      </div>

      {/* Scrollable Tab Bar */}
      <div className="px-4 pb-3 calc-tabs-scroll">
        <div className="calc-tabs-inner">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn("calc-tab", tab === key && "calc-tab-active")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === "decay"    && <DecayCalc />}
        {tab === "ug"       && <UgCalc />}
        {tab === "isl"      && <IslCalc />}
        {tab === "cisec"    && <CiSecCalc />}
        {tab === "shottime" && <ShotTimeCalc />}
      </div>
    </div>
  );
}
