import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// POST - Update training progress (start, complete, update last accessed)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: moduleId } = await params;
    const body = await request.json();
    const { action } = body; // "start", "complete", "access"

    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    // First check if enrollment exists
    const { data: enrollment, error: fetchError } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("id, started_at, completed")
      .eq("module_id", moduleId)
      .eq("user_id", session.userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[/api/training/[id]/progress] Fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch enrollment" }, { status: 500 });
    }

    // If no enrollment exists, create one
    if (!enrollment) {
      const { error: insertError } = await supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .insert({
          user_id: session.userId,
          module_id: moduleId,
          enrolled_at: now,
          started_at: action === "start" ? now : null,
          completed: action === "complete",
          completed_at: action === "complete" ? now : null,
          last_accessed: now,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error("[/api/training/[id]/progress] Insert error:", insertError);
        return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action, created: true });
    }

    // Build update data based on action
    const updateData: Record<string, unknown> = {
      last_accessed: now,
      updated_at: now,
    };

    if (action === "start" && !enrollment.started_at) {
      updateData.started_at = now;
    }

    if (action === "complete" && !enrollment.completed) {
      updateData.completed = true;
      updateData.completed_at = now;
    }

    const { error: updateError } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .update(updateData)
      .eq("id", enrollment.id);

    if (updateError) {
      console.error("[/api/training/[id]/progress] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[/api/training/[id]/progress] Error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// GET - Get current progress for a module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: moduleId } = await params;
    const supabase = createServerSupabaseClient();

    const { data: enrollment, error } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("id, enrolled_at, started_at, completed, completed_at, last_accessed")
      .eq("module_id", moduleId)
      .eq("user_id", session.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[/api/training/[id]/progress] Error:", error);
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }

    return NextResponse.json({
      enrolled: !!enrollment,
      started: !!enrollment?.started_at,
      completed: !!enrollment?.completed,
      enrollment: enrollment || null,
    });
  } catch (error) {
    console.error("[/api/training/[id]/progress] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
