import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// GET - Get a single group with its members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Get the group
    const { data: group, error: groupError } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .select("*")
      .eq("id", id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get members with user details
    const { data: members, error: membersError } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .select("id, user_id, added_at, added_by")
      .eq("group_id", id);

    if (membersError) {
      console.error("[/api/admin/groups/[id]] Error fetching members:", membersError);
    }

    // Get user details for members
    let membersWithDetails: Array<{
      id: string;
      user_id: string;
      added_at: string;
      added_by: string | null;
      user_name: string | null;
      user_email: string | null;
    }> = [];

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);
      const { data: users } = await supabase
        .from(TABLES.USERS)
        .select("id, name, email")
        .in("id", userIds);

      const userMap: Record<string, { name: string; email: string }> = {};
      users?.forEach((u) => {
        userMap[u.id] = { name: u.name, email: u.email };
      });

      membersWithDetails = members.map((m) => ({
        ...m,
        user_name: userMap[m.user_id]?.name || null,
        user_email: userMap[m.user_id]?.email || null,
      }));
    }

    return NextResponse.json({
      group: {
        ...group,
        members: membersWithDetails,
        member_count: membersWithDetails.length,
      },
    });
  } catch (error) {
    console.error("[/api/admin/groups/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

// PATCH - Update a group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const supabase = createServerSupabaseClient();

    // Check if group exists
    const { data: existing, error: existingError } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .select("id")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // If renaming, check for duplicates
    if (name) {
      const { data: duplicate } = await supabase
        .from(TABLES.TRAINING_GROUPS)
        .select("id")
        .ilike("name", name.trim())
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const { data: group, error } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/groups/[id]] Error updating group:", error);
      return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("[/api/admin/groups/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE - Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Delete the group (members will be cascade deleted)
    const { error } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[/api/admin/groups/[id]] Error deleting group:", error);
      return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/groups/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
