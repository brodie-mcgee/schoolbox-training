"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EnrollmentViewer, {
  Enrollment,
  EnrollmentStats,
} from "@/components/admin/EnrollmentViewer";

interface Module {
  id: string;
  title: string;
  description: string;
  status: string;
  duration_minutes: number;
  category: string;
}

export default function ModuleEnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const moduleId = resolvedParams.id;

  const [module, setModule] = useState<Module | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/enrollments`);
      if (response.ok) {
        const data = await response.json();
        setModule(data.module);
        setEnrollments(data.enrollments);
        setStats(data.stats);
      } else {
        toast.error("Failed to load module enrollments");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load module enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Module not found</p>
        <Link
          href="/admin/modules"
          className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Modules
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/modules"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Modules
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <p className="text-gray-600 mt-1">
              {module.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded">
                {module.category || "Uncategorized"}
              </span>
              <span>{module.duration_minutes || 0} min</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  module.status === "published"
                    ? "bg-green-100 text-green-700"
                    : module.status === "draft"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {module.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/modules/${moduleId}/edit`}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Module
            </Link>
          </div>
        </div>
      </div>

      {/* Enrollment Viewer */}
      <EnrollmentViewer
        entityType="module"
        entityId={moduleId}
        entityTitle={module.title}
        enrollments={enrollments}
        stats={stats}
        onRefresh={loadData}
      />
    </div>
  );
}
