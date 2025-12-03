import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * GET /api/admin/users/sync/debug
 * Debug endpoint to test Schoolbox API connection
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized", step: "session" }, { status: 403 });
    }

    const baseUrl = process.env.SCHOOLBOX_BASE_URL;
    const apiToken = process.env.SCHOOLBOX_API_TOKEN;

    // Build a simple test request
    const filter = { role: { type: "staff" } };
    const filterJson = JSON.stringify(filter);
    const filterEncoded = encodeURIComponent(filterJson);
    const testUrl = `${baseUrl}/api/user?filter=${filterEncoded}&limit=5`;

    console.log("[sync/debug] Testing Schoolbox API...");
    console.log("[sync/debug] URL:", testUrl);

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
      baseUrl: baseUrl?.substring(0, 30) + "...",
      hasToken: !!apiToken && apiToken !== "placeholder-token",
      tokenPrefix: apiToken?.substring(0, 10) + "...",
      responsePreview: responseText.substring(0, 500),
      dataCount: responseJson?.data?.length || 0,
    });
  } catch (error) {
    console.error("[sync/debug] Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
