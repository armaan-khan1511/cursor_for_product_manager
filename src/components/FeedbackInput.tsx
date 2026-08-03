"use client";

import { useState, useMemo, useRef, ChangeEvent, DragEvent } from "react";
import { parseCSV } from "@/lib/csv";

export function FeedbackInput({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (items: string[]) => void;
  isLoading: boolean;
}) {
  const [raw, setRaw] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [csvStatusMessage, setCsvStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart parser to extract distinct feedback items from bulk raw text
  const detectedItems = useMemo(() => {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Split by double newlines first (paragraphs / distinct tickets / CSV items)
    let chunks = trimmed
      .split(/\n\s*\n/)
      .map((c) => c.trim())
      .filter(Boolean);

    // If there's only 1 chunk but it has multiple lines (e.g. CSV rows or line-by-line entries), split those lines
    if (chunks.length === 1) {
      const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        chunks = lines;
      }
    }

    // Clean up lead bullet numbers or markdown markers
    return chunks.map((item) => item.replace(/^[-*•\d+.]\s*/, "").trim()).filter(Boolean);
  }, [raw]);

  function handleSubmit() {
    if (detectedItems.length > 0) {
      onAnalyze(detectedItems);
    } else if (raw.trim().length > 0) {
      onAnalyze([raw.trim()]);
    }
  }

  function processCSVText(csvContent: string, fileName?: string) {
    const parsed = parseCSV(csvContent, fileName);
    if (parsed.items.length > 0) {
      setRaw(parsed.items.join("\n\n"));
      setShowPreview(true);
      setCsvStatusMessage(
        `Imported ${parsed.items.length} feedback item${parsed.items.length === 1 ? "" : "s"}${
          fileName ? ` from "${fileName}"` : ""
        }`
      );
    } else {
      setCsvStatusMessage("No valid feedback rows found in CSV.");
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        processCSVText(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          processCSVText(content, file.name);
        }
      };
      reader.readAsText(file);
    }
  }

  function handleLoadSampleText() {
    setCsvStatusMessage(null);
    const sampleText = `[Ticket #1042] Support Query
"Can't export my project data as CSV. This is blocking our quarterly report compliance and our VP needs it ASAP!"

- Export button is missing entirely on the mobile app layout.
- Would be nice to schedule automatic weekly exports via email.

[Review #881] User Feedback
"Dashboard takes over 8 seconds to render when we have 50+ members. We need pagination or query optimization urgently."

[Feature Request]
"Please add SAML SSO / Okta integration for enterprise user login. Our IT security team requires this for compliance."`;
    setRaw(sampleText);
  }

  function handleLoadSampleCSV() {
    const sampleCSV = `id,customer,priority,feedback
101,Acme Corp,High,"Can't export my project data as CSV, blocking our quarterly compliance report!"
102,Globex,Medium,"Export button missing on mobile layout layout returning 404 error."
103,Stark Tech,Low,"Would be nice to schedule automatic weekly exports to AWS S3 or email."
104,Wayne Ent,High,"Dashboard takes 8 seconds to load for 50+ members. Urgent optimization needed."
105,Cyberdyne,High,"Need SAML SSO and Okta integration for enterprise user authentication compliance."`;
    processCSVText(sampleCSV, "sample_feedback.csv");
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="feedback" className="text-sm font-medium text-zinc-300">
          Paste bulk feedback or import CSV
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            📁 Import CSV
          </button>
          <button
            type="button"
            onClick={handleLoadSampleCSV}
            className="text-xs font-medium text-amber-400/90 hover:text-amber-300 hover:underline"
          >
            + Sample CSV
          </button>
          <a
            href="/sample_feedback.csv"
            download="sample_feedback.csv"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:underline"
          >
            ↓ Download CSV file
          </a>
          <button
            type="button"
            onClick={handleLoadSampleText}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:underline"
          >
            + Sample text
          </button>
          <span className="text-xs text-zinc-500 tabular-nums">
            {detectedItems.length} item{detectedItems.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {csvStatusMessage && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <span>{csvStatusMessage}</span>
          <button
            type="button"
            onClick={() => setCsvStatusMessage(null)}
            className="text-amber-400 hover:text-zinc-100"
          >
            ✕
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border transition-all ${
          isDragging
            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40"
            : "border-zinc-800 bg-zinc-950"
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-zinc-950/90 text-amber-400">
            <span className="text-2xl font-bold">📥 Drop CSV File Here</span>
            <span className="mt-1 text-xs text-zinc-400">Feedback rows will be automatically imported</span>
          </div>
        )}
        <textarea
          id="feedback"
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            if (csvStatusMessage) setCsvStatusMessage(null);
          }}
          placeholder={
            "Paste support tickets, emails, user reviews, or drop a CSV file here...\n\ne.g.\n[Ticket #102] Can't export my project data as CSV, blocking our quarterly report\n\n- Export button missing on mobile layout\n- Would be nice to schedule automatic weekly exports\n\nOr click 'Import CSV' above!"
          }
          rows={10}
          className="w-full resize-y bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 rounded-lg"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleSubmit}
          disabled={isLoading || raw.trim().length === 0}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isLoading ? "Categorising & Prioritising…" : "Categorise & Prioritise"}
        </button>

        {detectedItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            {showPreview ? "Hide items preview" : `Preview detected items (${detectedItems.length})`}
          </button>
        )}
      </div>

      {showPreview && detectedItems.length > 0 && (
        <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Detected Items ({detectedItems.length}):
          </div>
          <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto text-xs text-zinc-300">
            {detectedItems.map((item, idx) => (
              <li key={idx} className="flex gap-2 rounded bg-zinc-950/80 p-2 border border-zinc-800/80">
                <span className="font-mono text-zinc-500 select-none">{idx + 1}.</span>
                <span className="line-clamp-2">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
