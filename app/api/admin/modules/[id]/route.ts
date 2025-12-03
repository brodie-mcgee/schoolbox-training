import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: module, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[/api/admin/modules/[id]] Error fetching module:", error);
      return NextResponse.json(
        { error: "Failed to fetch module" },
        { status: 500 }
      );
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("[/api/admin/modules/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.lessons !== undefined) updateData.lessons = body.lessons;
    if (body.pass_score !== undefined) updateData.pass_score = body.pass_score;
    if (body.max_attempts !== undefined) updateData.max_attempts = body.max_attempts;

    const { error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[/api/admin/modules/[id]] Error updating module:", error);
      return NextResponse.json(
        { error: "Failed to update module" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/modules/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Check if module has active enrollments
    const { count } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("id", { count: "exact", head: true })
      .eq("module_id", id)
      .in("status", ["in_progress", "not_started"]);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete module with active enrollments. Archive it instead." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[/api/admin/modules/[id]] Error deleting module:", error);
      return NextResponse.json(
        { error: "Failed to delete module" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/modules/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
