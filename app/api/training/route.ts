import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// GET - Fetch published training modules for authenticated users
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data: modules, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .select("id, title, description, duration_minutes, lessons, status, category, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/training] Error fetching modules:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    // Format modules to include lesson count
    const formattedModules = (modules || []).map((m) => ({
      ...m,
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
