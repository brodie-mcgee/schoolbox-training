import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // Allow both admin and HR access to reports
    if (!session?.isAdmin && !session?.isHR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createServerSupabaseClient();

    // Get enrollment stats
    const [
      totalResult,
      completedResult,
      inProgressResult,
      overdueResult,
    ] = await Promise.all([
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .gte("created_at", startDate),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", startDate),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from(TABLES.MODULE_ENROLLMENTS)
        .select("id", { count: "exact", head: true })
        .lt("due_date", new Date().toISOString())
        .neq("status", "completed"),
    ]);

    const totalEnrollments = totalResult.count || 0;
    const completedEnrollments = completedResult.count || 0;
    const inProgressEnrollments = inProgressResult.count || 0;
    const overdueEnrollments = overdueResult.count || 0;
    const completionRate = totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

    // Get average completion time for completed enrollments
    const { data: completedData } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("created_at, completed_at")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", startDate)
      .limit(100);

    let avgCompletionTime = 0;
    if (completedData && completedData.length > 0) {
      const totalDays = completedData.reduce((sum, enrollment) => {
        const start = new Date(enrollment.created_at).getTime();
        const end = new Date(enrollment.completed_at).getTime();
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0);
      avgCompletionTime = totalDays / completedData.length;
    }

    // Get overdue items with user and module details
    const { data: overdueItems } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select(`
        due_date,
        status,
        user_id,
        module_id
      `)
      .lt("due_date", new Date().toISOString())
      .neq("status", "completed")
      .limit(50);

    // Enrich overdue items with user and module names
    const enrichedOverdue = [];
    if (overdueItems && overdueItems.length > 0) {
      const userIds = [...new Set(overdueItems.map(item => item.user_id))];
      const moduleIds = [...new Set(overdueItems.map(item => item.module_id))];

      const [usersResult, modulesResult] = await Promise.all([
        supabase.from(TABLES.USERS).select("id, name, email").in("id", userIds),
        supabase.from(TABLES.TRAINING_MODULES).select("id, title").in("id", moduleIds),
      ]);

      const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
      const modulesMap = new Map(modulesResult.data?.map(m => [m.id, m]) || []);

      for (const item of overdueItems) {
        const user = usersMap.get(item.user_id);
        const module = modulesMap.get(item.module_id);
        if (user && module) {
          const dueDate = new Date(item.due_date);
          const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          enrichedOverdue.push({
            user_name: user.name,
            user_email: user.email,
            module_title: module.title,
            due_date: item.due_date,
            status: item.status,
            days_overdue: daysOverdue,
          });
        }
      }
    }

    return NextResponse.json({
      stats: {
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        overdueEnrollments,
        completionRate,
        avgCompletionTime,
      },
      overdue: enrichedOverdue,
    });
  } catch (error) {
    console.error("[/api/admin/reports] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
