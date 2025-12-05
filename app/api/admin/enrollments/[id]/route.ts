import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// DELETE - Remove an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "module" or "course"

    if (!type || (type !== "module" && type !== "course")) {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be 'module' or 'course'" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const tableName = type === "module" ? TABLES.MODULE_ENROLLMENTS : TABLES.COURSE_ENROLLMENTS;

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[/api/admin/enrollments/${id}] Error deleting enrollment:`, error);
      return NextResponse.json(
        { error: "Failed to delete enrollment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}

// PATCH - Update enrollment (e.g., change due date)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, due_date } = body;

    if (!type || (type !== "module" && type !== "course")) {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be 'module' or 'course'" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const tableName = type === "module" ? TABLES.MODULE_ENROLLMENTS : TABLES.COURSE_ENROLLMENTS;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (due_date !== undefined) {
      updateData.due_date = due_date;
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error(`[/api/admin/enrollments/${id}] Error updating enrollment:`, error);
      return NextResponse.json(
        { error: "Failed to update enrollment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}
