import { NextResponse } from "next/server";

/**
 * GET /api/debug/schoolbox
 * Public debug endpoint to test Schoolbox API connection
 * No auth required - for debugging only
 */
export async function GET() {
  try {
    const baseUrl = process.env.SCHOOLBOX_BASE_URL;
    const apiToken = process.env.SCHOOLBOX_API_TOKEN;

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

    // Build a simple test request - get just 3 staff
    const filter = { role: { type: "staff" } };
    const filterJson = JSON.stringify(filter);
    const filterEncoded = encodeURIComponent(filterJson);
    const testUrl = `${baseUrl}/api/user?filter=${filterEncoded}&limit=3`;

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

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      configured: true,
      baseUrl: baseUrl.replace(/^(https?:\/\/[^\/]+).*/, "$1"), // Just show domain
      tokenConfigured: true,
      tokenPrefix: apiToken.substring(0, 8) + "...",
      dataCount: responseJson?.data?.length || 0,
      sampleNames: responseJson?.data?.slice(0, 3).map((u: { fullName?: string; username?: string }) =>
        u.fullName || u.username || "Unknown"
      ) || [],
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
