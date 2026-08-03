import { NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { buildAnalyzePrompt, ANALYZE_SCHEMA } from "@/lib/prompts";
import { getServerSupabase } from "@/lib/supabase";
import { getUser } from "@/lib/supabase/server";
import type { AnalyzeResponse, Priority } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = await req.json();
    const feedback: unknown = body?.feedback;

    let items: string[] = [];
    let promptInput: string | string[];

    if (typeof feedback === "string") {
      const trimmed = feedback.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "'feedback' string must not be empty." },
          { status: 400 }
        );
      }
      promptInput = trimmed;
      // Store line-based or whole text for batch storage
      items = [trimmed];
    } else if (Array.isArray(feedback)) {
      items = feedback
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim());

      if (items.length === 0) {
        return NextResponse.json(
          { error: "'feedback' must contain at least one non-empty string." },
          { status: 400 }
        );
      }
      promptInput = items;
    } else {
      return NextResponse.json(
        { error: "Request body must include a 'feedback' string or array of strings." },
        { status: 400 }
      );
    }

    const result = await generateStructuredJSON<AnalyzeResponse>({
      prompt: buildAnalyzePrompt(promptInput),
      schema: ANALYZE_SCHEMA,
    });

    const rawThemes = Array.isArray(result?.themes) ? result.themes : [];

    // Normalize themes & sanitize priority values to prevent crashes
    const themes = rawThemes.map((theme, index) => {
      const rawPriority = (theme?.priority || "medium").toString().toLowerCase();
      let normalizedPriority: Priority = "medium";
      if (rawPriority.includes("high")) normalizedPriority = "high";
      else if (rawPriority.includes("low")) normalizedPriority = "low";
      else if (rawPriority.includes("med")) normalizedPriority = "medium";

      return {
        id: theme?.id || `theme-${index + 1}`,
        title: theme?.title || `Theme ${index + 1}`,
        summary: theme?.summary || "User feedback theme",
        priority: normalizedPriority,
        confidence_score: typeof theme?.confidence_score === "number" ? theme.confidence_score : 0.85,
        feedback_count: typeof theme?.feedback_count === "number" ? theme.feedback_count : 1,
        sample_quotes: Array.isArray(theme?.sample_quotes) ? theme.sample_quotes : [],
      };
    });

    // Sort highest priority first as a safety net in case the model doesn't.
    const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    themes.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

    const sanitizedResult = { themes };

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
          sanitizedResult.themes.map((theme) => ({
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

    return NextResponse.json({ ...sanitizedResult, batchId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[analyze] error details:", message, stack);
    return NextResponse.json(
      { error: "Failed to analyze feedback", details: message },
      { status: 500 }
    );
  }
}
