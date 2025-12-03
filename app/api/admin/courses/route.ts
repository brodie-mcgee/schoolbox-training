import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
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

    const { data: courses, error } = await supabase
      .from(TABLES.COURSES)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/admin/courses] Error fetching courses:", error);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses: courses || [] });
  } catch (error) {
    console.error("[/api/admin/courses] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
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

    const { data: course, error } = await supabase
      .from(TABLES.COURSES)
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status || "draft",
        module_ids: body.module_ids || [],
        created_by: session.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/courses] Error creating course:", error);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[/api/admin/courses] Error:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
