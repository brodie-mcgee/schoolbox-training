import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// GET - Fetch a single training module by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: moduleId } = await params;
    const supabase = createServerSupabaseClient();

    const { data: module, error } = await supabase
      .from(TABLES.TRAINING_MODULES)
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error) {
      console.error("[/api/training/[id]] Error fetching module:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Module not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
    }

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Ensure lessons is an array
    const formattedModule = {
      ...module,
      lessons: Array.isArray(module.lessons) ? module.lessons : [],
    };

    return NextResponse.json({ module: formattedModule });
  } catch (error) {
    console.error("[/api/training/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training module" },
      { status: 500 }
    );
  }
}
