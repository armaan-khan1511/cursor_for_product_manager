export type Priority = "high" | "medium" | "low";

export interface Theme {
  id: string;
  title: string;
  summary: string;
  priority: Priority;
  confidence_score: number; // 0-1
  feedback_count: number;
  sample_quotes: string[];
}

export interface AnalyzeResponse {
  themes: Theme[];
}

export interface Specification {
  title: string;
  problem_statement: string;
  description: string;
  acceptance_criteria: string[];
  technical_tasks: string[];
  edge_cases: string[];
  implementation_notes: string;
}

export type ExportFormat = "markdown" | "claude-code" | "cursor" | "chatgpt" | "github" | "linear";

export interface ExportRequest {
  spec: Specification;
  format: ExportFormat;
}

export interface ExportResponse {
  content: string;
  format: ExportFormat;
  redirectUrl?: string;
  filename?: string;
}
