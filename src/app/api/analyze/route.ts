import { NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { buildAnalyzePrompt, ANALYZE_SCHEMA } from "@/lib/prompts";
import { getServerSupabase } from "@/lib/supabase";
import { getUser } from "@/lib/supabase/server";
import type { AnalyzeResponse } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = await req.json();
    const feedback: unknown = body?.feedback;

    if (!Array.isArray(feedback) || feedback.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'feedback' array of strings." },
        { status: 400 }
      );
    }

    const items = feedback
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      .map((f) => f.trim());

    if (items.length === 0) {
      return NextResponse.json(
        { error: "'feedback' must contain at least one non-empty string." },
        { status: 400 }
      );
    }

    const result = await generateStructuredJSON<AnalyzeResponse>({
      prompt: buildAnalyzePrompt(items),
      schema: ANALYZE_SCHEMA,
    });

    // Sort highest priority first as a safety net in case the model doesn't.
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    result.themes.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

    // Persistence is best-effort: if Supabase isn't configured yet, the
    // analysis still returns successfully so the demo works without it.
    const supabase = getServerSupabase();
    let batchId: string | null = null;
    if (supabase) {
      const { data: batch, error: batchError } = await supabase
        .from("feedback_batches")
        .insert({ raw_items: items, user_id: user.id })
        .select("id")
        .single();

      if (batchError) {
        console.error("[analyze] failed to store feedback batch:", batchError.message);
      } else {
        batchId = batch.id;
        const { error: analysesError } = await supabase.from("analyses").insert(
          result.themes.map((theme) => ({
            batch_id: batchId,
            user_id: user.id,
            theme_id: theme.id,
            title: theme.title,
            summary: theme.summary,
            priority: theme.priority,
            confidence_score: theme.confidence_score,
            feedback_count: theme.feedback_count,
            sample_quotes: theme.sample_quotes,
          }))
        );
        if (analysesError) {
          console.error("[analyze] failed to store analyses:", analysesError.message);
        }
      }
    }

    return NextResponse.json({ ...result, batchId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analyze] error:", message);
    return NextResponse.json(
      { error: "Failed to analyze feedback", details: message },
      { status: 500 }
    );
  }
}
