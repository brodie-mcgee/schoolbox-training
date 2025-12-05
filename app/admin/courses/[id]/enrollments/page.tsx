"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EnrollmentViewer, {
  Enrollment,
  EnrollmentStats,
} from "@/components/admin/EnrollmentViewer";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
}

export default function CourseEnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<Course | null>(null);
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
      const response = await fetch(`/api/admin/courses/${courseId}/enrollments`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setEnrollments(data.enrollments);
        setStats(data.stats);
      } else {
        toast.error("Failed to load course enrollments");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load course enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

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

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Course not found</p>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">
              {course.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded">
                {course.category || "Uncategorized"}
              </span>
              <span
                className={`px-2 py-0.5 rounded ${
                  course.status === "published"
                    ? "bg-green-100 text-green-700"
                    : course.status === "draft"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {course.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/courses/${courseId}/edit`}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Course
            </Link>
          </div>
        </div>
      </div>

      {/* Enrollment Viewer */}
      <EnrollmentViewer
        entityType="course"
        entityId={courseId}
        entityTitle={course.title}
        enrollments={enrollments}
        stats={stats}
        onRefresh={loadData}
      />
    </div>
  );
}
