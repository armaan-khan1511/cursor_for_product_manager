import { NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { buildGenerateTaskPrompt, GENERATE_TASK_SCHEMA } from "@/lib/prompts";
import { getServerSupabase } from "@/lib/supabase";
import { getUser } from "@/lib/supabase/server";
import type { Specification, Theme } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const user = await getUser();

    const body = await req.json();
    const theme: Partial<Theme> | undefined = body?.theme;

    if (!theme?.title || !theme?.summary) {
      return NextResponse.json(
        { error: "Request body must include a 'theme' object with at least title and summary." },
        { status: 400 }
      );
    }

    const spec = await generateStructuredJSON<Specification>({
      prompt: buildGenerateTaskPrompt({
        themeTitle: theme.title,
        themeSummary: theme.summary,
        sampleQuotes: theme.sample_quotes ?? [],
      }),
      schema: GENERATE_TASK_SCHEMA,
    });

    const supabase = getServerSupabase();
    if (supabase && theme.id) {
      let query = supabase
        .from("analyses")
        .select("id")
        .eq("theme_id", theme.id);

      if (user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data: analysisRow } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error: specError } = await supabase.from("specifications").insert({
        analysis_id: analysisRow?.id ?? null,
        user_id: user?.id ?? null,
        title: spec.title,
        problem_statement: spec.problem_statement,
        description: spec.description,
        acceptance_criteria: spec.acceptance_criteria,
        technical_tasks: spec.technical_tasks,
        edge_cases: spec.edge_cases,
        implementation_notes: spec.implementation_notes,
      });
      if (specError) {
        console.error("[generate-task] failed to store specification:", specError.message);
      }
    }

    return NextResponse.json({ spec });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-task] error:", message);
    return NextResponse.json(
      { error: "Failed to generate task", details: message },
      { status: 500 }
    );
  }
}
