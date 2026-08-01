import { NextResponse } from "next/server";
import type { ExportFormat, ExportRequest, Specification } from "@/lib/types";

function toMarkdown(spec: Specification): string {
  return `# ${spec.title}

## Problem
${spec.problem_statement}

## Description
${spec.description}

## Acceptance Criteria
${spec.acceptance_criteria.map((c) => `- [ ] ${c}`).join("\n")}

## Technical Tasks
${spec.technical_tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## Edge Cases
${spec.edge_cases.map((e) => `- ${e}`).join("\n")}

## Implementation Notes
${spec.implementation_notes}
`;
}

function toClaudeCodePrompt(spec: Specification): string {
  return `Implement the following feature end to end.

Problem: ${spec.problem_statement}

What to build: ${spec.description}

Work through these tasks in order, writing tests where it makes sense:
${spec.technical_tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

The implementation must satisfy every one of these acceptance criteria:
${spec.acceptance_criteria.map((c) => `- ${c}`).join("\n")}

Handle these edge cases explicitly:
${spec.edge_cases.map((e) => `- ${e}`).join("\n")}

Notes / open questions to flag if they affect your approach: ${spec.implementation_notes}`;
}

function toCursorPrompt(spec: Specification): string {
  // Cursor works well with a tighter, task-first prompt referencing the
  // codebase directly, so this trims the framing Claude Code gets.
  return `Task: ${spec.title}

${spec.description}

Steps:
${spec.technical_tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Must satisfy:
${spec.acceptance_criteria.map((c) => `- ${c}`).join("\n")}

Watch for: ${spec.edge_cases.join("; ")}`;
}

function toGithubIssue(spec: Specification): string {
  return `**Problem**
${spec.problem_statement}

**Description**
${spec.description}

**Acceptance Criteria**
${spec.acceptance_criteria.map((c) => `- [ ] ${c}`).join("\n")}

**Technical Tasks**
${spec.technical_tasks.map((t) => `- [ ] ${t}`).join("\n")}

**Edge Cases**
${spec.edge_cases.map((e) => `- ${e}`).join("\n")}

**Implementation Notes**
${spec.implementation_notes}

<!-- Suggested labels: enhancement, needs-triage -->`;
}

function toLinearIssue(spec: Specification): string {
  return `${spec.problem_statement}

${spec.description}

Acceptance Criteria:
${spec.acceptance_criteria.map((c) => `• ${c}`).join("\n")}

Tasks:
${spec.technical_tasks.map((t) => `• ${t}`).join("\n")}

Edge cases: ${spec.edge_cases.join(", ")}

Notes: ${spec.implementation_notes}`;
}

const formatters: Record<ExportFormat, (spec: Specification) => string> = {
  markdown: toMarkdown,
  "claude-code": toClaudeCodePrompt,
  cursor: toCursorPrompt,
  github: toGithubIssue,
  linear: toLinearIssue,
};

export async function POST(req: Request) {
  try {
    const body: Partial<ExportRequest> = await req.json();

    if (!body.spec || !body.format) {
      return NextResponse.json(
        { error: "Request body must include 'spec' and 'format'." },
        { status: 400 }
      );
    }

    const formatter = formatters[body.format];
    if (!formatter) {
      return NextResponse.json(
        { error: `Unsupported format '${body.format}'. Use one of: ${Object.keys(formatters).join(", ")}` },
        { status: 400 }
      );
    }

    const content = formatter(body.spec as Specification);
    return NextResponse.json({ content, format: body.format });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[export] error:", message);
    return NextResponse.json({ error: "Failed to export", details: message }, { status: 500 });
  }
}
