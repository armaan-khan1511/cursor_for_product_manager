"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackInput } from "@/components/FeedbackInput";
import { ThemeList } from "@/components/ThemeList";
import { SpecPanel } from "@/components/SpecPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { createClient } from "@/lib/supabase/client";
import type { Specification, Theme } from "@/lib/types";

type Stage = "input" | "themes" | "spec";

export function Dashboard({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const [stage, setStage] = useState<Stage>("input");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [spec, setSpec] = useState<Specification | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(items: string[]) {
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setThemes(data.themes);
      setStage("themes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong analyzing that feedback.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelectTheme(theme: Theme) {
    setSelectedTheme(theme);
    setError(null);
    setIsGenerating(true);
    setSpec(null);
    try {
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSpec(data.spec);
      setStage("spec");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong generating that spec.");
    } finally {
      setIsGenerating(false);
    }
  }

  const steps: { id: Stage; label: string }[] = [
    { id: "input", label: "Paste feedback" },
    { id: "themes", label: "Pick a theme" },
    { id: "spec", label: "Review & export" },
  ];
  const stageIndex = steps.findIndex((s) => s.id === stage);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold tracking-tight">SpecForge</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 text-xs text-zinc-500">
              {steps.map((s, i) => (
                <span
                  key={s.id}
                  className={i <= stageIndex ? "text-zinc-200" : "text-zinc-600"}
                >
                  {String(i + 1).padStart(2, "0")} — {s.label}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
              {userEmail ? (
                <>
                  <span className="text-xs text-zinc-500">{userEmail}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                  Public Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <section>
              <FeedbackInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            </section>

            {themes.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Themes, by priority
                </h2>
                <ThemeList themes={themes} selectedId={selectedTheme?.id ?? null} onSelect={handleSelectTheme} />
              </section>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {isGenerating && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">
                Drafting specification…
              </div>
            )}
            {spec && !isGenerating && (
              <>
                <SpecPanel spec={spec} />
                <ExportPanel spec={spec} />
              </>
            )}
            {!spec && !isGenerating && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-600">
                Select a theme to generate an engineering-ready spec.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
