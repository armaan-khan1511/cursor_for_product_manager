"use client";

import { useState } from "react";
import type { ExportFormat, Specification } from "@/lib/types";

const formats: {
  id: ExportFormat;
  label: string;
  actionLabel: string;
  icon: string;
  accentColor: string;
}[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    actionLabel: "Launch in Claude AI",
    icon: "🚀",
    accentColor: "bg-amber-500 hover:bg-amber-400 text-zinc-950",
  },
  {
    id: "cursor",
    label: "Cursor IDE",
    actionLabel: "Open in Cursor Chat",
    icon: "⚡",
    accentColor: "bg-cyan-500 hover:bg-cyan-400 text-zinc-950",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    actionLabel: "Open in ChatGPT",
    icon: "🤖",
    accentColor: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950",
  },
  {
    id: "github",
    label: "GitHub Issue",
    actionLabel: "Create GitHub Issue",
    icon: "🐙",
    accentColor: "bg-purple-500 hover:bg-purple-400 text-zinc-950",
  },
  {
    id: "linear",
    label: "Linear",
    actionLabel: "Create Linear Issue",
    icon: "📐",
    accentColor: "bg-blue-500 hover:bg-blue-400 text-zinc-950",
  },
  {
    id: "markdown",
    label: "Markdown",
    actionLabel: "Copy Markdown",
    icon: "📝",
    accentColor: "bg-zinc-700 hover:bg-zinc-600 text-zinc-100",
  },
];

export function ExportPanel({ spec }: { spec: Specification }) {
  const [active, setActive] = useState<ExportFormat>("claude-code");
  const [content, setContent] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);
  const [filename, setFilename] = useState<string>("spec.md");
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
      setRedirectUrl(data.redirectUrl);
      setFilename(data.filename ?? "spec.md");
    } catch {
      setContent("Couldn't generate this export. Try again.");
      setRedirectUrl(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleLaunch() {
    if (!content) return;
    // Always copy prompt to clipboard first as a safety net
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (redirectUrl) {
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleDownload() {
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const currentConfig = formats.find((f) => f.id === active) ?? formats[0];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Export & One-Click Launch
        </h3>
        <span className="text-[11px] text-zinc-500">
          Select target environment
        </span>
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
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {content && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2">
            {redirectUrl ? (
              <button
                onClick={handleLaunch}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm ${currentConfig.accentColor}`}
              >
                <span>{currentConfig.icon}</span>
                <span>{currentConfig.actionLabel}</span>
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400"
              >
                📋 {copied ? "Copied Prompt!" : "Copy Prompt"}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              💾 Save File ({filename})
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 underline"
          >
            {copied ? "✓ Prompt Copied" : "Copy raw prompt"}
          </button>
        </div>
      )}

      <pre className="max-h-80 overflow-auto rounded-md bg-black p-4 text-xs text-zinc-300 whitespace-pre-wrap font-mono border border-zinc-900">
        {isLoading ? "Generating redirect prompt…" : content ?? "Pick an export format above to generate prompt."}
      </pre>
    </div>
  );
}
