// Prompt construction lives here, separate from the route handlers, so the
// prompt engineering can be iterated on without touching request/response
// plumbing.

export const ANALYZE_SCHEMA = {
  type: "object",
  properties: {
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "short kebab-case slug, e.g. 'export-to-csv'" },
          title: { type: "string", description: "5-8 word theme title" },
          summary: { type: "string", description: "1-2 sentence summary of the underlying problem" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          confidence_score: { type: "number", description: "0 to 1, how confident the clustering is" },
          feedback_count: { type: "number", description: "how many input items were grouped into this theme" },
          sample_quotes: {
            type: "array",
            items: { type: "string" },
            description: "1-3 short verbatim or near-verbatim quotes from the input feedback",
          },
        },
        required: [
          "id",
          "title",
          "summary",
          "priority",
          "confidence_score",
          "feedback_count",
          "sample_quotes",
        ],
      },
    },
  },
  required: ["themes"],
};

export function buildAnalyzePrompt(feedbackInput: string | string[]): string {
  const formattedFeedback = Array.isArray(feedbackInput)
    ? feedbackInput.map((item, i) => `${i + 1}. ${item}`).join("\n")
    : feedbackInput;

  return `You are a senior product manager triaging raw customer feedback for an engineering team.

Below is a batch of raw customer feedback inputs (which may include support tickets, emails, user reviews, interview notes, bullet points, or multiple items submitted at once).

Your job:
1. Parse and identify all distinct feedback points/requests contained in the input, even if multiple feedback items are pasted together, spanning multiple lines, or formatted as support tickets/emails/lists.
2. Group and categorise items that describe the same underlying problem or feature request into overarching themes. Don't over-split — merge near-duplicates and related issues.
3. Prioritise each theme as "high", "medium", or "low" based on apparent frequency, severity, and business/user impact:
   - High: Critical blockers, data loss, security/access issues, core flow failures, frequent pain points.
   - Medium: Significant usability issues, missing standard features, workarounds required.
   - Low: Minor cosmetic suggestions, nice-to-have enhancements, low-frequency edge cases.
4. Order themes by priority (highest priority first).
5. Provide a confidence_score (0-1) reflecting how strongly the grouped items belong together.
6. Calculate feedback_count as the total number of distinct input reports/tickets/items that contribute to this theme.
7. Pull 1-3 short representative verbatim or near-verbatim quotes per theme directly from the raw input text.

Do not invent feedback that isn't present in the input. If the input only supports one or two themes, return only that many — don't pad the list.

Raw Customer Feedback Input:
${formattedFeedback}`;
}

export const GENERATE_TASK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "concise engineering task title" },
    problem_statement: { type: "string", description: "2-3 sentences on the user problem, from the user's perspective" },
    description: { type: "string", description: "what should be built, in plain product language" },
    acceptance_criteria: {
      type: "array",
      items: { type: "string" },
      description: "testable, specific criteria; each one a single sentence",
    },
    technical_tasks: {
      type: "array",
      items: { type: "string" },
      description: "concrete implementation steps an engineer or coding agent could execute in order",
    },
    edge_cases: {
      type: "array",
      items: { type: "string" },
    },
    implementation_notes: {
      type: "string",
      description: "assumptions, risks, or things the implementer should double check",
    },
  },
  required: [
    "title",
    "problem_statement",
    "description",
    "acceptance_criteria",
    "technical_tasks",
    "edge_cases",
    "implementation_notes",
  ],
};

export function buildGenerateTaskPrompt(params: {
  themeTitle: string;
  themeSummary: string;
  sampleQuotes: string[];
}): string {
  return `You are a senior product manager writing an engineering-ready specification for a coding agent (like Claude Code or Cursor) to implement directly.

Theme: ${params.themeTitle}
Summary: ${params.themeSummary}
Representative user quotes:
${params.sampleQuotes.map((q) => `- "${q}"`).join("\n")}

Write a specification that:
- States the problem from the user's point of view before proposing a solution.
- Gives acceptance criteria that are specific and testable, not vague ("works correctly" is not acceptable — say what "correctly" means).
- Breaks the work into an ordered list of concrete technical tasks a coding agent could follow step by step.
- Calls out realistic edge cases (empty states, permission boundaries, concurrent edits, large inputs, etc. — whatever actually applies here).
- Notes any assumptions you had to make due to missing context, so a human reviewer can catch mistakes before handoff.

Do not invent product decisions that weren't implied by the theme — flag them as open questions in implementation_notes instead.`;
}
