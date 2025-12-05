import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// GET - Fetch current user's enrollments
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    console.log("[/api/my/enrollments] Session userId:", session.userId);

    // Fetch module enrollments for the current user
    const { data: moduleEnrollments, error: moduleError } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("*")
      .eq("user_id", session.userId);

    console.log("[/api/my/enrollments] Module enrollments found:", moduleEnrollments?.length || 0, moduleEnrollments);

    if (moduleError) {
      console.error("[/api/my/enrollments] Module enrollments error:", moduleError);
    }

    // Fetch course enrollments for the current user
    const { data: courseEnrollments, error: courseError } = await supabase
      .from(TABLES.COURSE_ENROLLMENTS)
      .select("*")
      .eq("user_id", session.userId);

    if (courseError) {
      console.error("[/api/my/enrollments] Course enrollments error:", courseError);
    }

    // Get module details
    const moduleIds = moduleEnrollments?.map((e) => e.module_id) || [];
    let modules: Record<string, { title: string; description: string; duration: number; lessons: unknown[] }> = {};

    console.log("[/api/my/enrollments] Module IDs to lookup:", moduleIds);

    if (moduleIds.length > 0) {
      const { data: moduleData, error: moduleLookupError } = await supabase
        .from(TABLES.TRAINING_MODULES)
        .select("id, title, description, duration, lessons")
        .in("id", moduleIds);

      if (moduleLookupError) {
        console.error("[/api/my/enrollments] Module lookup error:", moduleLookupError);
      }
      console.log("[/api/my/enrollments] Found modules:", moduleData?.map(m => ({ id: m.id, title: m.title })));

      moduleData?.forEach((m) => {
        modules[m.id] = m;
      });
    }

    // Get course details
    const courseIds = courseEnrollments?.map((e) => e.course_id) || [];
    let courses: Record<string, { title: string; description: string }> = {};

    if (courseIds.length > 0) {
      const { data: courseData } = await supabase
        .from(TABLES.COURSES)
        .select("id, title, description")
        .in("id", courseIds);

      courseData?.forEach((c) => {
        courses[c.id] = c;
      });
    }

    // Combine and format enrollments
    const formattedModuleEnrollments = (moduleEnrollments || []).map((e) => ({
      id: e.id,
      type: "module" as const,
      entity_id: e.module_id,
      title: modules[e.module_id]?.title || "Unknown Module",
      description: modules[e.module_id]?.description || "",
      duration_minutes: modules[e.module_id]?.duration || 0,
      lesson_count: Array.isArray(modules[e.module_id]?.lessons) ? modules[e.module_id].lessons.length : 0,
      enrolled_at: e.enrolled_at,
      due_date: e.due_date,
      started_at: e.started_at,
      completed: e.completed,
      completed_at: e.completed_at,
    }));

    const formattedCourseEnrollments = (courseEnrollments || []).map((e) => ({
      id: e.id,
      type: "course" as const,
      entity_id: e.course_id,
      title: courses[e.course_id]?.title || "Unknown Course",
      description: courses[e.course_id]?.description || "",
      enrolled_at: e.enrolled_at,
      due_date: e.due_date,
      started_at: e.started_at,
      completed: e.completed,
      completed_at: e.completed_at,
    }));

    const allEnrollments = [...formattedModuleEnrollments, ...formattedCourseEnrollments];

    // Calculate stats
    const now = new Date();
    const stats = {
      total: allEnrollments.length,
      completed: allEnrollments.filter((e) => e.completed).length,
      pending: allEnrollments.filter((e) => !e.completed).length,
      overdue: allEnrollments.filter(
        (e) => !e.completed && e.due_date && new Date(e.due_date) < now
      ).length,
      dueSoon: allEnrollments.filter((e) => {
        if (e.completed || !e.due_date) return false;
        const dueDate = new Date(e.due_date);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      }).length,
    };

    return NextResponse.json({
      enrollments: allEnrollments,
      modules: formattedModuleEnrollments,
      courses: formattedCourseEnrollments,
      stats,
    });
  } catch (error) {
    console.error("[/api/my/enrollments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
