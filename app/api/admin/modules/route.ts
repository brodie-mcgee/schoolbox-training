import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    const { data: modules, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/admin/modules] Error fetching modules:", error);
      return NextResponse.json(
        { error: "Failed to fetch modules" },
        { status: 500 }
      );
    }

    return NextResponse.json({ modules: modules || [] });
  } catch (error) {
    console.error("[/api/admin/modules] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const { data: module, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status || "draft",
        duration: body.duration_minutes || 0,
        lessons: body.lessons || [],
        pass_score: body.pass_score || 80,
        created_by: session.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/modules] Error creating module:", error);
      return NextResponse.json(
        { error: "Failed to create module" },
        { status: 500 }
      );
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("[/api/admin/modules] Error:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}
