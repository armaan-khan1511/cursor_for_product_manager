"use client";

import { useState } from "react";
import type { ExportFormat, Specification } from "@/lib/types";

const formats: { id: ExportFormat; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "github", label: "GitHub Issue" },
  { id: "linear", label: "Linear" },
  { id: "markdown", label: "Markdown" },
];

export function ExportPanel({ spec }: { spec: Specification }) {
  const [active, setActive] = useState<ExportFormat>("claude-code");
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSelect(format: ExportFormat) {
    setActive(format);
    setCopied(false);
    setIsLoading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      setContent(data.content);
    } catch {
      setContent("Couldn't generate this export. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Export</h3>
        {content && (
          <button
            onClick={handleCopy}
            className="text-xs font-medium text-amber-500 hover:text-amber-400"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => handleSelect(f.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active === f.id
                ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <pre className="max-h-80 overflow-auto rounded-md bg-black p-4 text-xs text-zinc-300 whitespace-pre-wrap font-mono">
        {isLoading ? "Formatting…" : content ?? "Pick a format above."}
      </pre>
    </div>
  );
}
