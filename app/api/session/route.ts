import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// GET - Fetch current session
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({
      session: {
        userId: session.userId,
        name: session.name,
        email: session.email,
        isAdmin: session.isAdmin,
        isHR: session.isHR || session.roles?.includes("hr") || false,
        roles: session.roles,
      },
    });
  } catch (error) {
    console.error("[/api/session] Error:", error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
