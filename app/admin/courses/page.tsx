"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  CheckCircle,
  Archive,
  Clock,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AssignTrainingModal from "@/components/admin/AssignTrainingModal";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  module_count?: number;
  enrollment_count?: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigningCourse, setAssigningCourse] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Course deleted successfully");
        setCourses(courses.filter((c) => c.id !== id));
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    }
  }

  async function updateStatus(id: string, status: Course["status"]) {
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Course ${status}`);
        setCourses(
          courses.map((c) => (c.id === id ? { ...c, status } : c))
        );
      } else {
        toast.error("Failed to update course status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update course status");
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function getStatusBadge(status: Course["status"]) {
    switch (status) {
      case "published":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">
            Create and manage learning paths with multiple modules
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">No courses found</p>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {course.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                      {course.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <BookOpen className="w-4 h-4" />
                      {course.module_count || 0} modules
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/courses/${course.id}/enrollments`}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View enrollments"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      {course.status === "published" && (
                        <button
                          onClick={() => setAssigningCourse(course.id)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Assign to users"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/courses/${course.id}`}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Training Modal */}
      {assigningCourse && (
        <AssignTrainingModal
          onClose={() => setAssigningCourse(null)}
          onSuccess={() => setAssigningCourse(null)}
          preselectedType="course"
          preselectedEntityId={assigningCourse}
        />
      )}
    </div>
  );
}
