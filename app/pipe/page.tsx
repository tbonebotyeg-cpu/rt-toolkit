"use client";

import PipeTable from "@/components/pipe/PipeTable";

export default function PipePage() {
  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Pipe Schedules</h1>
        <p className="text-xs text-muted-foreground mt-1">
          ASME B36.10M — Wall thickness &amp; IQI reference
        </p>
      </div>
      <PipeTable />
    </div>
  );
}
