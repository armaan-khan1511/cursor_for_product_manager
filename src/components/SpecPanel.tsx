"use client";

import type { Specification } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function SpecPanel({ spec }: { spec: Specification }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-zinc-50">{spec.title}</h2>

      <Section title="Problem">
        <p className="text-sm text-zinc-300 leading-relaxed">{spec.problem_statement}</p>
      </Section>

      <Section title="Description">
        <p className="text-sm text-zinc-300 leading-relaxed">{spec.description}</p>
      </Section>

      <Section title="Acceptance Criteria">
        <ul className="space-y-1.5">
          {spec.acceptance_criteria.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300">
              <span className="mt-0.5 text-amber-500">—</span>
              {c}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Technical Tasks">
        <ol className="space-y-1.5">
          {spec.technical_tasks.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300">
              <span className="font-mono text-xs text-zinc-600 mt-0.5">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Edge Cases">
        <ul className="space-y-1.5">
          {spec.edge_cases.map((e, i) => (
            <li key={i} className="text-sm text-zinc-400">
              · {e}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Implementation Notes">
        <p className="text-sm text-zinc-400 leading-relaxed">{spec.implementation_notes}</p>
      </Section>
    </div>
  );
}
