"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AssignTrainingModal from "@/components/admin/AssignTrainingModal";

interface Enrollment {
  id: string;
  type: "module" | "course";
  user_id: string;
  user_name?: string;
  user_email?: string;
  entity_id: string;
  entity_title?: string;
  assigned: boolean;
  assigned_by: string | null;
  assigned_at: string | null;
  due_date: string | null;
  enrolled_at: string;
  started_at: string | null;
  completed: boolean;
  completed_at: string | null;
}

type StatusFilter = "all" | "pending" | "completed" | "overdue";
type TypeFilter = "all" | "module" | "course";

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, []);

  async function loadEnrollments() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/enrollments");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      } else {
        toast.error("Failed to load enrollments");
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEnrollment(enrollment: Enrollment) {
    if (!confirm(`Remove ${enrollment.user_name} from "${enrollment.entity_title}"?`)) {
      return;
    }

    setDeletingId(enrollment.id);
    try {
      const response = await fetch(
        `/api/admin/enrollments/${enrollment.id}?type=${enrollment.type}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Enrollment removed");
        setEnrollments(enrollments.filter((e) => e.id !== enrollment.id));
      } else {
        toast.error("Failed to remove enrollment");
      }
    } catch (error) {
      console.error("Failed to delete enrollment:", error);
      toast.error("Failed to remove enrollment");
    } finally {
      setDeletingId(null);
    }
  }

  function getStatus(enrollment: Enrollment): "completed" | "overdue" | "pending" {
    if (enrollment.completed) return "completed";
    if (enrollment.due_date && new Date(enrollment.due_date) < new Date()) return "overdue";
    return "pending";
  }

  function getStatusBadge(status: "completed" | "overdue" | "pending") {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  }

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      enrollment.user_name?.toLowerCase().includes(searchLower) ||
      enrollment.user_email?.toLowerCase().includes(searchLower) ||
      enrollment.entity_title?.toLowerCase().includes(searchLower);

    // Type filter
    const matchesType = typeFilter === "all" || enrollment.type === typeFilter;

    // Status filter
    const status = getStatus(enrollment);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: enrollments.length,
    pending: enrollments.filter((e) => getStatus(e) === "pending").length,
    completed: enrollments.filter((e) => getStatus(e) === "completed").length,
    overdue: enrollments.filter((e) => getStatus(e) === "overdue").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-600">
            Manage training assignments and track completion status
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Assign Training
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or training title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="module">Modules</option>
              <option value="course">Courses</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-500 mt-2">Loading enrollments...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">
              {enrollments.length === 0
                ? "No enrollments yet. Assign training to get started."
                : "No enrollments match your filters."}
            </p>
            {enrollments.length === 0 && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Assign Training
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((enrollment) => {
                  const status = getStatus(enrollment);
                  return (
                    <tr key={`${enrollment.type}-${enrollment.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {enrollment.user_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {enrollment.user_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {enrollment.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {enrollment.entity_title || "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            enrollment.type === "module"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {enrollment.type === "module" ? (
                            <BookOpen className="w-3 h-3" />
                          ) : (
                            <GraduationCap className="w-3 h-3" />
                          )}
                          {enrollment.type === "module" ? "Module" : "Course"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(status)}</td>
                      <td className="px-6 py-4">
                        {enrollment.due_date ? (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(enrollment.due_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No due date</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteEnrollment(enrollment)}
                          disabled={deletingId === enrollment.id}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove enrollment"
                        >
                          {deletingId === enrollment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Training Modal */}
      {showAssignModal && (
        <AssignTrainingModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            loadEnrollments();
          }}
        />
      )}
    </div>
  );
}
