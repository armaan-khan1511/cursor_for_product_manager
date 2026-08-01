"use client";

import { useState } from "react";

export function FeedbackInput({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (items: string[]) => void;
  isLoading: boolean;
}) {
  const [raw, setRaw] = useState("");

  const lineCount = raw.split("\n").filter((l) => l.trim().length > 0).length;

  function handleSubmit() {
    const items = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (items.length > 0) onAnalyze(items);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor="feedback" className="text-sm font-medium text-zinc-300">
          Paste feedback
        </label>
        <span className="text-xs text-zinc-500 tabular-nums">
          {lineCount} item{lineCount === 1 ? "" : "s"} · one per line
        </span>
      </div>
      <textarea
        id="feedback"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={
          "Paste support tickets, reviews, or interview notes — one per line.\n\ne.g.\nCan't export my project data as CSV, blocking our quarterly report\nExport button is missing entirely on the mobile app\nWould be nice to schedule automatic weekly exports"
        }
        rows={10}
        className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || lineCount === 0}
        className="self-start rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {isLoading ? "Clustering…" : "Analyze feedback"}
      </button>
    </div>
  );
}
