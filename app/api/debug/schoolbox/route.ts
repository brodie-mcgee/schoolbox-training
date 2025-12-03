import { NextResponse } from "next/server";

/**
 * GET /api/debug/schoolbox
 * Public debug endpoint to test Schoolbox API connection
 * No auth required - for debugging only
 */
export async function GET(request: Request) {
  try {
    // Trim to remove any accidental newlines
    const baseUrl = (process.env.SCHOOLBOX_BASE_URL || "").trim();
    const apiToken = (process.env.SCHOOLBOX_API_TOKEN || "").trim();

    // Check for detailed mode via query param
    const url = new URL(request.url);
    const detailed = url.searchParams.get("detailed") === "true";

    console.log("[debug/schoolbox] Testing Schoolbox API...");

    // Check configuration
    if (!baseUrl || baseUrl === "https://placeholder.schoolbox.com") {
      return NextResponse.json({
        error: "SCHOOLBOX_BASE_URL not configured",
        configured: false,
      });
    }

    if (!apiToken || apiToken === "placeholder-token") {
      return NextResponse.json({
        error: "SCHOOLBOX_API_TOKEN not configured",
        configured: false,
      });
    }

    // Build test request - get 500 users for detailed mode, 5 for simple mode
    const limit = detailed ? 500 : 5;
    const testUrl = `${baseUrl}/api/user?limit=${limit}`;

    console.log("[debug/schoolbox] URL:", testUrl);

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // Not JSON
    }

    // Count users by role type
    const roleBreakdown: Record<string, number> = {};
    if (responseJson?.data && Array.isArray(responseJson.data)) {
      for (const user of responseJson.data) {
        const roleType = user.role?.type || "unknown";
        roleBreakdown[roleType] = (roleBreakdown[roleType] || 0) + 1;
      }
    }

    // Get sample of staff users
    const staffUsers = responseJson?.data?.filter(
      (u: { role?: { type?: string } }) => u.role?.type === "staff"
    ) || [];

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      configured: true,
      baseUrl: baseUrl.replace(/^(https?:\/\/[^\/]+).*/, "$1"),
      tokenConfigured: true,
      tokenPrefix: apiToken.substring(0, 8) + "...",
      // Raw response structure (to debug pagination)
      responseKeys: responseJson ? Object.keys(responseJson) : [],
      // Pagination info - Schoolbox uses "metadata" not "meta"
      metadata: responseJson?.metadata || null,
      hasNextPage: !!responseJson?.metadata?.cursor?.next,
      nextCursor: responseJson?.metadata?.cursor?.next?.substring(0, 50) || null,
      // User counts
      totalUsersInResponse: responseJson?.data?.length || 0,
      roleBreakdown,
      staffCount: staffUsers.length,
      // Sample staff names
      sampleStaff: staffUsers.slice(0, 5).map((u: { fullName?: string; username?: string; email?: string }) => ({
        name: u.fullName || u.username,
        email: u.email,
      })),
      errorMessage: !response.ok ? responseText.substring(0, 200) : undefined,
    });
  } catch (error) {
    console.error("[debug/schoolbox] Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      configured: true,
    }, { status: 500 });
  }
}
