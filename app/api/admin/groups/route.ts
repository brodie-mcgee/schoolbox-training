import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// GET - List all groups with member counts
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .select("*")
      .order("name", { ascending: true });

    if (groupsError) {
      console.error("[/api/admin/groups] Error fetching groups:", groupsError);
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }

    // Get member counts for each group
    const { data: memberCounts, error: countError } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .select("group_id");

    if (countError) {
      console.error("[/api/admin/groups] Error fetching member counts:", countError);
    }

    // Calculate member counts
    const countMap: Record<string, number> = {};
    if (memberCounts) {
      memberCounts.forEach((m: { group_id: string }) => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
      });
    }

    // Add member counts to groups
    const groupsWithCounts = groups?.map((group) => ({
      ...group,
      member_count: countMap[group.id] || 0,
    }));

    return NextResponse.json({ groups: groupsWithCounts || [] });
  } catch (error) {
    console.error("[/api/admin/groups] Error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if group with same name already exists
    const { data: existing } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .select("id")
      .ilike("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
    }

    // Create the group
    const { data: group, error } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_by: session.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/groups] Error creating group:", error);
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("[/api/admin/groups] Error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
