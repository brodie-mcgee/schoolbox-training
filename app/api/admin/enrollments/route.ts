import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// GET - List all enrollments with user and module/course details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "module", "course", or "all"
    const status = searchParams.get("status"); // "pending", "completed", "overdue"

    const supabase = createServerSupabaseClient();

    const enrollments: Array<{
      id: string;
      type: "module" | "course";
      user_id: string;
      user_name?: string;
      user_email?: string;
      entity_id: string;
      entity_title?: string;
      assigned: boolean;
      assigned_by: string | null;
      assigned_at: string | null;
      due_date: string | null;
      enrolled_at: string;
      started_at: string | null;
      completed: boolean;
      completed_at: string | null;
    }> = [];

    // Fetch module enrollments
    if (type === "all" || type === "module") {
      const { data: moduleEnrollments, error: moduleError } = await supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select(`
          *,
          user:users!module_enrollments_user_id_fkey(id, name, email),
          module:training_modules!module_enrollments_module_id_fkey(id, title)
        `)
        .order("enrolled_at", { ascending: false });

      if (moduleError) {
        console.error("[/api/admin/enrollments] Error fetching module enrollments:", moduleError);
      } else if (moduleEnrollments) {
        for (const e of moduleEnrollments) {
          enrollments.push({
            id: e.id,
            type: "module",
            user_id: e.user_id,
            user_name: e.user?.name,
            user_email: e.user?.email,
            entity_id: e.module_id,
            entity_title: e.module?.title,
            assigned: e.assigned || false,
            assigned_by: e.assigned_by,
            assigned_at: e.assigned_at,
            due_date: e.due_date,
            enrolled_at: e.enrolled_at,
            started_at: e.started_at,
            completed: e.completed || false,
            completed_at: e.completed_at,
          });
        }
      }
    }

    // Fetch course enrollments
    if (type === "all" || type === "course") {
      const { data: courseEnrollments, error: courseError } = await supabase
        .from(TABLES.COURSE_ENROLLMENTS)
        .select(`
          *,
          user:users!course_enrollments_user_id_fkey(id, name, email),
          course:courses!course_enrollments_course_id_fkey(id, title)
        `)
        .order("enrolled_at", { ascending: false });

      if (courseError) {
        console.error("[/api/admin/enrollments] Error fetching course enrollments:", courseError);
      } else if (courseEnrollments) {
        for (const e of courseEnrollments) {
          enrollments.push({
            id: e.id,
            type: "course",
            user_id: e.user_id,
            user_name: e.user?.name,
            user_email: e.user?.email,
            entity_id: e.course_id,
            entity_title: e.course?.title,
            assigned: e.assigned || false,
            assigned_by: e.assigned_by,
            assigned_at: e.assigned_at,
            due_date: e.due_date,
            enrolled_at: e.enrolled_at,
            started_at: e.started_at,
            completed: e.completed || false,
            completed_at: e.completed_at,
          });
        }
      }
    }

    // Filter by status if specified
    let filteredEnrollments = enrollments;
    if (status) {
      const now = new Date();
      filteredEnrollments = enrollments.filter((e) => {
        if (status === "completed") return e.completed;
        if (status === "pending") return !e.completed;
        if (status === "overdue") {
          return !e.completed && e.due_date && new Date(e.due_date) < now;
        }
        return true;
      });
    }

    // Sort by enrolled_at descending
    filteredEnrollments.sort((a, b) =>
      new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
    );

    return NextResponse.json({ enrollments: filteredEnrollments });
  } catch (error) {
    console.error("[/api/admin/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// POST - Create new enrollments (bulk assignment)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type, // "module" or "course"
      entity_id, // module_id or course_id
      user_ids, // array of user IDs to assign
      due_date, // optional due date
    } = body;

    if (!type || !entity_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: type, entity_id, user_ids" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    const results = {
      created: 0,
      skipped: 0, // Already enrolled
      errors: 0,
    };

    const tableName = type === "module" ? TABLES.MODULE_ENROLLMENTS : TABLES.COURSE_ENROLLMENTS;
    const entityColumn = type === "module" ? "module_id" : "course_id";

    for (const userId of user_ids) {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from(tableName)
        .select("id")
        .eq("user_id", userId)
        .eq(entityColumn, entity_id)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      // Create enrollment
      const enrollmentData: Record<string, unknown> = {
        user_id: userId,
        [entityColumn]: entity_id,
        assigned: true,
        assigned_by: session.userId,
        assigned_at: now,
        enrolled_at: now,
        created_at: now,
        updated_at: now,
      };

      if (due_date) {
        enrollmentData.due_date = due_date;
      }

      const { error } = await supabase
        .from(tableName)
        .insert(enrollmentData);

      if (error) {
        console.error(`[/api/admin/enrollments] Error creating enrollment for user ${userId}:`, error);
        results.errors++;
      } else {
        results.created++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Assigned to ${results.created} users. ${results.skipped} already enrolled.`,
    });
  } catch (error) {
    console.error("[/api/admin/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 }
    );
  }
}
