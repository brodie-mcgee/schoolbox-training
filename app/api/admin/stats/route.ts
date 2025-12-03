import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // Get counts in parallel
    const [
      usersResult,
      modulesResult,
      coursesResult,
      enrollmentsResult,
      completedResult,
      overdueResult,
    ] = await Promise.all([
      supabase.from(TABLES.USERS).select("id", { count: "exact", head: true }),
      supabase.from(TABLES.TRAINING_MODULES).select("id", { count: "exact", head: true }),
      supabase.from(TABLES.COURSES).select("id", { count: "exact", head: true }),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .in("status", ["in_progress", "not_started"]),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .lt("due_date", new Date().toISOString())
        .neq("status", "completed"),
    ]);

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      totalModules: modulesResult.count || 0,
      totalCourses: coursesResult.count || 0,
      activeEnrollments: enrollmentsResult.count || 0,
      completedThisMonth: completedResult.count || 0,
      overdue: overdueResult.count || 0,
    });
  } catch (error) {
    console.error("[/api/admin/stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
