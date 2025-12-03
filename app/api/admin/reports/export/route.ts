import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient, TABLES } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // Allow both admin and HR access to reports
    if (!session?.isAdmin && !session?.isHR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "csv";
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createServerSupabaseClient();

    // Get all enrollments with user and module data
    const { data: enrollments } = await supabase
      .from(TABLES.MODULE_ENROLLMENTS)
      .select("*")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 });
    }

    // Get user and module data
    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    const moduleIds = [...new Set(enrollments.map(e => e.module_id))];

    const [usersResult, modulesResult] = await Promise.all([
      supabase.from(TABLES.USERS).select("id, name, email").in("id", userIds),
      supabase.from(TABLES.TRAINING_MODULES).select("id, title, category").in("id", moduleIds),
    ]);

    const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
    const modulesMap = new Map(modulesResult.data?.map(m => [m.id, m]) || []);

    // Build export data
    const exportData = enrollments.map(enrollment => {
      const user = usersMap.get(enrollment.user_id);
      const module = modulesMap.get(enrollment.module_id);
      return {
        user_name: user?.name || "Unknown",
        user_email: user?.email || "Unknown",
        module_title: module?.title || "Unknown",
        module_category: module?.category || "Uncategorized",
        status: enrollment.status,
        enrolled_at: enrollment.created_at,
        due_date: enrollment.due_date || "N/A",
        completed_at: enrollment.completed_at || "N/A",
        progress: enrollment.progress || 0,
      };
    });

    if (type === "csv") {
      const headers = [
        "User Name",
        "User Email",
        "Module Title",
        "Category",
        "Status",
        "Enrolled At",
        "Due Date",
        "Completed At",
        "Progress (%)",
      ];

      const rows = exportData.map(row => [
        `"${row.user_name}"`,
        `"${row.user_email}"`,
        `"${row.module_title}"`,
        `"${row.module_category}"`,
        row.status,
        row.enrolled_at,
        row.due_date,
        row.completed_at,
        row.progress,
      ].join(","));

      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="training-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // For other formats, return JSON for now
    return NextResponse.json({ data: exportData });
  } catch (error) {
    console.error("[/api/admin/reports/export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
