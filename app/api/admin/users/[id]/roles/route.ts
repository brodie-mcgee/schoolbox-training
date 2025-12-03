import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { roles } = await request.json();

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "Invalid roles - must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate roles
    const validRoles = ["staff", "hr", "admin", "super_admin"];
    const invalidRoles = roles.filter((r: string) => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid roles: ${invalidRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Only super_admin can assign super_admin role
    if (roles.includes("super_admin") && !session.roles?.includes("super_admin")) {
      return NextResponse.json(
        { error: "Only super admins can assign super_admin role" },
        { status: 403 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ roles, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[/api/admin/users/roles] Error updating roles:", error);
      return NextResponse.json(
        { error: "Failed to update roles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/users/roles] Error:", error);
    return NextResponse.json(
      { error: "Failed to update roles" },
      { status: 500 }
    );
  }
}
