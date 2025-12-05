"use client";

import { useState, useMemo } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Download,
  Trash2,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AssignTrainingModal from "./AssignTrainingModal";

export interface Enrollment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  progress: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  assigned: boolean;
  assigned_by: string | null;
  assigned_at: string | null;
}

export interface EnrollmentStats {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  overdue: number;
}

interface EnrollmentViewerProps {
  entityType: "module" | "course";
  entityId: string;
  entityTitle: string;
  enrollments: Enrollment[];
  stats: EnrollmentStats;
  onRefresh: () => void;
}

type FilterStatus = "all" | "not_started" | "in_progress" | "completed" | "overdue";
type SortField = "user_name" | "status" | "enrolled_at" | "due_date" | "completed_at";
type SortDirection = "asc" | "desc";

export default function EnrollmentViewer({
  entityType,
  entityId,
  entityTitle,
  enrollments,
  stats,
  onRefresh,
}: EnrollmentViewerProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("enrolled_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter and sort enrollments
  const filteredEnrollments = useMemo(() => {
    let filtered = [...enrollments];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.user_name.toLowerCase().includes(query) ||
          e.user_email.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "user_name":
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case "status":
          const statusOrder = { overdue: 0, not_started: 1, in_progress: 2, completed: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "enrolled_at":
          comparison = new Date(a.enrolled_at).getTime() - new Date(b.enrolled_at).getTime();
          break;
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "completed_at":
          if (!a.completed_at && !b.completed_at) comparison = 0;
          else if (!a.completed_at) comparison = 1;
          else if (!b.completed_at) comparison = -1;
          else comparison = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [enrollments, filterStatus, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const getStatusBadge = (status: Enrollment["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case "overdue":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      case "not_started":
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Not Started
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;

    setDeletingId(enrollmentId);
    try {
      const response = await fetch(
        `/api/admin/${entityType}s/${entityId}/enrollments?enrollment_id=${enrollmentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Enrollment removed");
        onRefresh();
      } else {
        toast.error("Failed to remove enrollment");
      }
    } catch (error) {
      console.error("Failed to remove enrollment:", error);
      toast.error("Failed to remove enrollment");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateDueDate = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/admin/${entityType}s/${entityId}/enrollments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          due_date: newDueDate || null,
        }),
      });

      if (response.ok) {
        toast.success("Due date updated");
        setEditingDueDate(null);
        setNewDueDate("");
        onRefresh();
      } else {
        toast.error("Failed to update due date");
      }
    } catch (error) {
      console.error("Failed to update due date:", error);
      toast.error("Failed to update due date");
    }
  };

  const handleBulkRemove = async () => {
    if (selectedEnrollments.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedEnrollments.size} enrollment(s)?`))
      return;

    let successCount = 0;
    let errorCount = 0;

    for (const enrollmentId of selectedEnrollments) {
      try {
        const response = await fetch(
          `/api/admin/${entityType}s/${entityId}/enrollments?enrollment_id=${enrollmentId}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Removed ${successCount} enrollment(s)`);
      setSelectedEnrollments(new Set());
      onRefresh();
    }
    if (errorCount > 0) {
      toast.error(`Failed to remove ${errorCount} enrollment(s)`);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Status", "Enrolled", "Due Date", "Completed"];
    const rows = filteredEnrollments.map((e) => [
      e.user_name,
      e.user_email,
      e.status.replace("_", " "),
      formatDate(e.enrolled_at),
      formatDate(e.due_date),
      formatDate(e.completed_at),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${entityType}-${entityId}-enrollments.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  };

  const toggleSelectAll = () => {
    if (selectedEnrollments.size === filteredEnrollments.length) {
      setSelectedEnrollments(new Set());
    } else {
      setSelectedEnrollments(new Set(filteredEnrollments.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedEnrollments);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedEnrollments(newSelection);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.not_started}</p>
              <p className="text-xs text-gray-500">Not Started</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All", count: stats.total },
              { value: "not_started", label: "Not Started", count: stats.not_started },
              { value: "in_progress", label: "In Progress", count: stats.in_progress },
              { value: "completed", label: "Completed", count: stats.completed },
              { value: "overdue", label: "Overdue", count: stats.overdue },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value as FilterStatus)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === tab.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Assign More
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {selectedEnrollments.size > 0 && (
              <button
                onClick={handleBulkRemove}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove ({selectedEnrollments.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">
            {enrollments.length === 0
              ? "No users enrolled yet"
              : "No enrollments match your filters"}
          </p>
          {enrollments.length === 0 && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Assign Users
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEnrollments.size === filteredEnrollments.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("user_name")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      User {getSortIcon("user_name")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Status {getSortIcon("status")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("enrolled_at")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Enrolled {getSortIcon("enrolled_at")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("due_date")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Due Date {getSortIcon("due_date")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("completed_at")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Completed {getSortIcon("completed_at")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className={`hover:bg-gray-50 ${
                      enrollment.status === "overdue" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEnrollments.has(enrollment.id)}
                        onChange={() => toggleSelect(enrollment.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{enrollment.user_name}</p>
                        <p className="text-sm text-gray-500">{enrollment.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(enrollment.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(enrollment.enrolled_at)}
                    </td>
                    <td className="px-4 py-3">
                      {editingDueDate === enrollment.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                          <button
                            onClick={() => handleUpdateDueDate(enrollment.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingDueDate(null);
                              setNewDueDate("");
                            }}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDueDate(enrollment.id);
                            setNewDueDate(
                              enrollment.due_date
                                ? new Date(enrollment.due_date).toISOString().split("T")[0]
                                : ""
                            );
                          }}
                          className={`text-sm flex items-center gap-1 hover:underline ${
                            enrollment.status === "overdue"
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {formatDate(enrollment.due_date)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {enrollment.completed_at ? (
                        <span className="text-green-600 font-medium">
                          {formatDate(enrollment.completed_at)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveEnrollment(enrollment.id)}
                        disabled={deletingId === enrollment.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            Showing {filteredEnrollments.length} of {enrollments.length} enrollment(s)
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignTrainingModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            onRefresh();
          }}
          preselectedType={entityType}
          preselectedEntityId={entityId}
        />
      )}
    </div>
  );
}
