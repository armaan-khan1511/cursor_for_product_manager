"use client";

import type { Theme } from "@/lib/types";

const priorityStyles: Record<Theme["priority"], string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function ThemeList({
  themes,
  selectedId,
  onSelect,
}: {
  themes: Theme[];
  selectedId: string | null;
  onSelect: (theme: Theme) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {themes.map((theme, i) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          className={`text-left rounded-lg border px-4 py-3 transition-colors ${
            selectedId === theme.id
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-medium text-zinc-100">{theme.title}</span>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                priorityStyles[(theme.priority || "medium").toString().toLowerCase() as keyof typeof priorityStyles] || priorityStyles.medium
              }`}
            >
              {theme.priority || "medium"}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{theme.summary}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{theme.feedback_count} reports</span>
            <span>{Math.round(theme.confidence_score * 100)}% confidence</span>
          </div>
        </button>
      ))}
    </div>
  );
}
