import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// GET - Fetch published PUBLIC training modules for authenticated users
// Private modules are only visible through user's enrollments
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Only fetch public modules (private modules only show via enrollments)
    const { data: modules, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .select("id, title, description, duration, lessons, status, category, visibility, created_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/training] Error fetching modules:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    // Format modules to include lesson count and rename duration to duration_minutes for frontend
    const formattedModules = (modules || []).map((m) => ({
      ...m,
      duration_minutes: m.duration || 0,
      lesson_count: Array.isArray(m.lessons) ? m.lessons.length : 0,
    }));

    return NextResponse.json({ modules: formattedModules });
  } catch (error) {
    console.error("[/api/training] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training modules" },
      { status: 500 }
    );
  }
}
