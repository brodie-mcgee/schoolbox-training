import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// GET - List all enrollments for a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: courseId } = await params;
    const supabase = createServerSupabaseClient();

    // Get course details first
    const { data: course, error: courseError } = await supabase
      .from(TABLES.COURSES)
      .select("id, title, description, status, category")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get all enrollments for this course with user details
    const { data: enrollments, error: enrollmentError } = await supabase
      .from(TABLES.COURSE_ENROLLMENTS)
      .select(`
        id,
        user_id,
        enrolled_at,
        started_at,
        completed,
        completed_at,
        due_date,
        assigned,
        assigned_by,
        assigned_at,
        user:users!course_enrollments_user_id_fkey(id, name, email)
      `)
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: false });

    if (enrollmentError) {
      console.error("[/api/admin/courses/[id]/enrollments] Error:", enrollmentError);
      return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
    }

    // Format enrollments and calculate status
    const now = new Date();
    const formattedEnrollments = (enrollments || []).map((e) => {
      let status: "not_started" | "in_progress" | "completed" | "overdue" = "not_started";

      if (e.completed) {
        status = "completed";
      } else if (e.due_date && new Date(e.due_date) < now) {
        status = "overdue";
      } else if (e.started_at) {
        status = "in_progress";
      }

      // User is returned as single object from Supabase join (TypeScript infers array incorrectly)
      const user = e.user as unknown as { id: string; name: string; email: string } | null;

      return {
        id: e.id,
        user_id: e.user_id,
        user_name: user?.name || "Unknown User",
        user_email: user?.email || "",
        status,
        progress: e.completed ? 100 : (e.started_at ? 50 : 0),
        enrolled_at: e.enrolled_at,
        started_at: e.started_at,
        completed_at: e.completed_at,
        due_date: e.due_date,
        assigned: e.assigned || false,
        assigned_by: e.assigned_by,
        assigned_at: e.assigned_at,
      };
    });

    // Calculate stats
    const stats = {
      total: formattedEnrollments.length,
      completed: formattedEnrollments.filter((e) => e.status === "completed").length,
      in_progress: formattedEnrollments.filter((e) => e.status === "in_progress").length,
      not_started: formattedEnrollments.filter((e) => e.status === "not_started").length,
      overdue: formattedEnrollments.filter((e) => e.status === "overdue").length,
    };

    return NextResponse.json({
      course,
      enrollments: formattedEnrollments,
      stats,
    });
  } catch (error) {
    console.error("[/api/admin/courses/[id]/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
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

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollment_id");

    if (!enrollmentId) {
      return NextResponse.json({ error: "Missing enrollment_id" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from(TABLES.COURSE_ENROLLMENTS)
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      console.error("[/api/admin/courses/[id]/enrollments] Delete error:", error);
      return NextResponse.json({ error: "Failed to remove enrollment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/courses/[id]/enrollments] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove enrollment" },
      { status: 500 }
    );
  }
}

// PATCH - Update enrollment (e.g., due date)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { enrollment_id, due_date } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: "Missing enrollment_id" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (due_date !== undefined) {
      updateData.due_date = due_date;
    }

    const { error } = await supabase
      .from(TABLES.COURSE_ENROLLMENTS)
      .update(updateData)
      .eq("id", enrollment_id);

    if (error) {
      console.error("[/api/admin/courses/[id]/enrollments] Update error:", error);
      return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/courses/[id]/enrollments] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}
