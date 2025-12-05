import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// Helper to check if user can manage training content (admin or HR)
function canManageTraining(session: { isAdmin: boolean; isHR?: boolean; roles?: string[] } | null): boolean {
  if (!session) return false;
  return session.isAdmin || session.isHR || session.roles?.includes("hr") || false;
}

// GET - List members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: groupId } = await params;
    const supabase = createServerSupabaseClient();

    // Get members
    const { data: members, error: membersError } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .select("id, user_id, added_at, added_by")
      .eq("group_id", groupId);

    if (membersError) {
      console.error("[/api/admin/groups/[id]/members] Error fetching members:", membersError);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    // Get user details
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

    return NextResponse.json({ members: membersWithDetails });
  } catch (error) {
    console.error("[/api/admin/groups/[id]/members] Error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// POST - Add members to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: "user_ids array is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from(TABLES.TRAINING_GROUPS)
      .select("id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get existing members to avoid duplicates
    const { data: existingMembers } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .select("user_id")
      .eq("group_id", groupId)
      .in("user_id", user_ids);

    const existingUserIds = new Set(existingMembers?.map((m) => m.user_id) || []);

    // Filter out already existing members
    const newUserIds = user_ids.filter((id: string) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({
        message: "All users are already members of this group",
        added: 0,
        skipped: user_ids.length,
      });
    }

    // Add new members
    const membersToInsert = newUserIds.map((userId: string) => ({
      group_id: groupId,
      user_id: userId,
      added_by: session.userId,
    }));

    const { error: insertError } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .insert(membersToInsert);

    if (insertError) {
      console.error("[/api/admin/groups/[id]/members] Error adding members:", insertError);
      return NextResponse.json({ error: "Failed to add members" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added: newUserIds.length,
      skipped: user_ids.length - newUserIds.length,
    });
  } catch (error) {
    console.error("[/api/admin/groups/[id]/members] Error:", error);
    return NextResponse.json({ error: "Failed to add members" }, { status: 500 });
  }
}

// DELETE - Remove a member from a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageTraining(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id parameter is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from(TABLES.TRAINING_GROUP_MEMBERS)
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      console.error("[/api/admin/groups/[id]/members] Error removing member:", error);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/groups/[id]/members] Error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
