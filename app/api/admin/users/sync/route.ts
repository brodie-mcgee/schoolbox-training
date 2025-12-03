import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllSchoolboxStaff } from "@/lib/schoolbox";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

/**
 * POST /api/admin/users/sync
 * Syncs staff from Schoolbox API to local database
 * Only accessible by admins
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("[/api/admin/users/sync] Starting staff sync...");

    // Fetch all staff from Schoolbox
    const schoolboxStaff = await getAllSchoolboxStaff();
    console.log(`[/api/admin/users/sync] Got ${schoolboxStaff.length} staff from Schoolbox`);

    const supabase = createServerSupabaseClient();

    // Get existing users by email for matching
    const { data: existingUsers } = await supabase
      .from(TABLES.USERS)
      .select("id, email, name, roles");

    const existingEmailMap = new Map(
      existingUsers?.map((u) => [u.email?.toLowerCase(), u]) || []
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const staff of schoolboxStaff) {
      // Skip staff without email
      if (!staff.email) {
        console.log(`[sync] Skipping ${staff.fullName} - no email`);
        skipped++;
        continue;
      }

      const email = staff.email.toLowerCase();
      const existingUser = existingEmailMap.get(email);

      if (existingUser) {
        // Update existing user if name changed
        if (existingUser.name !== staff.fullName) {
          const { error } = await supabase
            .from(TABLES.USERS)
            .update({
              name: staff.fullName,
              avatar_initials: getInitials(staff.fullName),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUser.id);

          if (!error) {
            updated++;
          }
        } else {
          skipped++;
        }
      } else {
        // Create new user
        const { error } = await supabase.from(TABLES.USERS).insert({
          name: staff.fullName,
          email: staff.email,
          roles: ["staff"],
          active: true,
          avatar_initials: getInitials(staff.fullName),
          created_at: new Date().toISOString(),
        });

        if (!error) {
          created++;
        } else {
          console.error(`[sync] Error creating user ${staff.email}:`, error);
          skipped++;
        }
      }
    }

    console.log(`[/api/admin/users/sync] Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      stats: {
        total: schoolboxStaff.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (error) {
    console.error("[/api/admin/users/sync] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/sync
 * Preview what will be synced from Schoolbox without making changes
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if Schoolbox env vars are configured
    const baseUrl = process.env.SCHOOLBOX_BASE_URL;
    const apiToken = process.env.SCHOOLBOX_API_TOKEN;

    if (!baseUrl || baseUrl === "https://placeholder.schoolbox.com") {
      console.error("[/api/admin/users/sync] SCHOOLBOX_BASE_URL not configured");
      return NextResponse.json(
        { error: "Schoolbox API not configured. Please set SCHOOLBOX_BASE_URL environment variable." },
        { status: 500 }
      );
    }

    if (!apiToken || apiToken === "placeholder-token") {
      console.error("[/api/admin/users/sync] SCHOOLBOX_API_TOKEN not configured");
      return NextResponse.json(
        { error: "Schoolbox API not configured. Please set SCHOOLBOX_API_TOKEN environment variable." },
        { status: 500 }
      );
    }

    console.log("[/api/admin/users/sync] Preview: Fetching staff from Schoolbox...");
    console.log("[/api/admin/users/sync] Using base URL:", baseUrl);

    // Fetch all staff from Schoolbox
    const schoolboxStaff = await getAllSchoolboxStaff();

    // Return preview data
    return NextResponse.json({
      success: true,
      preview: true,
      totalStaff: schoolboxStaff.length,
      staff: schoolboxStaff.slice(0, 50).map((s) => ({
        name: s.fullName,
        email: s.email,
        username: s.username,
        externalId: s.externalId,
      })),
      hasMore: schoolboxStaff.length > 50,
    });
  } catch (error) {
    console.error("[/api/admin/users/sync] Preview error:", error);
    const errorMessage = error instanceof Error ? error.message : "Preview failed";
    console.error("[/api/admin/users/sync] Error details:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
