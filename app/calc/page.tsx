"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import DecayCalc from "@/components/calc/DecayCalc";
import UgCalc from "@/components/calc/UgCalc";
import IslCalc from "@/components/calc/IslCalc";
import CiSecCalc from "@/components/calc/CiSecCalc";
import ShotTimeCalc from "@/components/calc/ShotTimeCalc";
import BarricadeCalc from "@/components/calc/BarricadeCalc";
import ExposureCorrectCalc from "@/components/calc/ExposureCorrectCalc";

const TABS = [
  { key: "decay",    label: "Decay",    desc: "Radioactive decay & projected activity" },
  { key: "ug",       label: "Ug",       desc: "Geometric unsharpness (ASME V T-274.2)" },
  { key: "isl",      label: "ISL",      desc: "Inverse square law SFD correction" },
  { key: "cisec",    label: "CI·sec",   desc: "Dose adjustment for activity change" },
  { key: "shottime", label: "Shot Time",desc: "Exposure time from chart or reference shot" },
  { key: "barricade",label: "Barricade",desc: "Safe radiation boundary distances" },
  { key: "expcorr",  label: "Film Corr",desc: "Exposure correction for film density (E₁/FD₁ = E₂/FD₂)" },
] as const;

type CalcTab = (typeof TABS)[number]["key"];

export default function CalcPage() {
  const [tab, setTab] = useState<CalcTab>("decay");
  const activeTab = TABS.find(t => t.key === tab);

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Calculators</h1>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {activeTab?.desc}
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
        {tab === "decay"     && <DecayCalc />}
        {tab === "ug"        && <UgCalc />}
        {tab === "isl"       && <IslCalc />}
        {tab === "cisec"     && <CiSecCalc />}
        {tab === "shottime"  && <ShotTimeCalc />}
        {tab === "barricade" && <BarricadeCalc />}
        {tab === "expcorr"   && <ExposureCorrectCalc />}
      </div>
    </div>
  );
}
