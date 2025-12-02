import { NextRequest, NextResponse } from "next/server";
import { verifySchoolboxSignature, isStaff, getSchoolboxUser } from "@/lib/schoolbox";
import { setSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

// List of admin usernames (can be extended via environment variable)
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "bmcgee").split(",").map(u => u.trim().toLowerCase());

/**
 * GET /api/verify - Schoolbox Remote Services authentication endpoint
 *
 * Query params from Schoolbox:
 * - key: SHA1(secret + time + id) signature
 * - time: Unix timestamp
 * - id: External ID (staff ID)
 * - user: Username
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const time = searchParams.get("time");
    const id = searchParams.get("id");
    const user = searchParams.get("user");

    console.log("[/api/verify] Authentication attempt:", { id, user, time });

    // Validate required parameters
    if (!key || !time || !id || !user) {
      console.log("[/api/verify] Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify Schoolbox signature
    console.log("[/api/verify] Verifying Schoolbox signature...");
    const isValid = verifySchoolboxSignature(key, time, id);
    if (!isValid) {
      console.log("[/api/verify] Invalid signature or expired timestamp");
      return NextResponse.json(
        { error: "Invalid signature or expired timestamp" },
        { status: 401 }
      );
    }
    console.log("[/api/verify] Signature verified successfully");

    // Fetch user data from Schoolbox API
    console.log("[/api/verify] Fetching user data from Schoolbox API...");
    const schoolboxUser = await getSchoolboxUser(id, user);
    console.log("[/api/verify] User data fetched successfully");

    // Check if user is staff (this app is staff-only)
    if (!isStaff(schoolboxUser)) {
      console.log("[/api/verify] Non-staff user attempted access:", schoolboxUser.username);
      return NextResponse.json(
        { error: "Access restricted to staff members" },
        { status: 403 }
      );
    }
    console.log("[/api/verify] User confirmed as staff");

    // Get email from Schoolbox user data
    const email = schoolboxUser.email || `${user}@scr.vic.edu.au`;

    // Match or create user in Supabase
    const supabase = createServerSupabaseClient();
    let dbUser = await matchOrCreateUser(supabase, {
      name: schoolboxUser.fullName || `${schoolboxUser.firstName} ${schoolboxUser.lastName}`,
      email,
      schoolboxId: schoolboxUser.id,
      externalId: schoolboxUser.externalId?.toString() || id,
      username: user,
    });

    // Determine if user is admin
    const isAdmin = ADMIN_USERNAMES.includes(user.toLowerCase()) ||
                    dbUser.roles?.includes("admin") ||
                    dbUser.roles?.includes("hr");

    // Set session cookie
    await setSession({
      userId: dbUser.id!,
      schoolboxUserId: schoolboxUser.id,
      externalId: schoolboxUser.externalId?.toString() || id,
      username: user,
      email,
      name: schoolboxUser.fullName || `${schoolboxUser.firstName} ${schoolboxUser.lastName}`,
      role: "staff",
      isAdmin,
    });
    console.log("[/api/verify] Session cookie set successfully");

    // Redirect to dashboard
    const redirectUrl = "/dashboard";
    console.log("[/api/verify] Redirecting to:", redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("[/api/verify] Verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

/**
 * Matches Schoolbox user to existing Supabase user or creates new one
 */
async function matchOrCreateUser(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userData: {
    name: string;
    email: string;
    schoolboxId: number;
    externalId: string;
    username: string;
  }
) {
  // Try to find existing user by email
  const { data: existingUser, error: findError } = await supabase
    .from(TABLES.USERS)
    .select("*")
    .eq("email", userData.email)
    .single();

  if (existingUser && !findError) {
    console.log("[matchOrCreateUser] Found existing user:", existingUser.id);
    return existingUser;
  }

  // Create new user if not found
  console.log("[matchOrCreateUser] Creating new user for:", userData.email);
  const { data: newUser, error: createError } = await supabase
    .from(TABLES.USERS)
    .insert({
      name: userData.name,
      email: userData.email,
      roles: ["staff"],
      active: true,
      avatar_initials: getInitials(userData.name),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error("[matchOrCreateUser] Error creating user:", createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  console.log("[matchOrCreateUser] Created new user:", newUser.id);
  return newUser;
}

/**
 * Gets initials from a full name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
