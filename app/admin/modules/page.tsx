"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Archive,
  Loader2,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published" | "archived";
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  lesson_count?: number;
  enrollment_count?: number;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      const response = await fetch("/api/admin/modules");
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules);
      }
    } catch (error) {
      console.error("Failed to load modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }

  async function deleteModule(id: string) {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Module deleted successfully");
        setModules(modules.filter((m) => m.id !== id));
      } else {
        toast.error("Failed to delete module");
      }
    } catch (error) {
      console.error("Failed to delete module:", error);
      toast.error("Failed to delete module");
    }
  }

  async function updateStatus(id: string, status: TrainingModule["status"]) {
    try {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Module ${status}`);
        setModules(
          modules.map((m) => (m.id === id ? { ...m, status } : m))
        );
      } else {
        toast.error("Failed to update module status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update module status");
    }
  }

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || module.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function getStatusBadge(status: TrainingModule["status"]) {
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
          <h1 className="text-2xl font-bold text-gray-900">Training Modules</h1>
          <p className="text-gray-600">Create and manage training content</p>
        </div>
        <Link
          href="/admin/modules/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Module
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
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

      {/* Modules Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading modules...</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">No modules found</p>
          <Link
            href="/admin/modules/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first module
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  {getStatusBadge(module.status)}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {module.description || "No description"}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {module.duration_minutes || 0} min
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {module.category || "Uncategorized"}
                  </span>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/training/${module.id}`}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/modules/${module.id}/edit`}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative group">
                  <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {module.status !== "published" && (
                      <button
                        onClick={() => updateStatus(module.id, "published")}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Publish
                      </button>
                    )}
                    {module.status !== "draft" && (
                      <button
                        onClick={() => updateStatus(module.id, "draft")}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Unpublish
                      </button>
                    )}
                    {module.status !== "archived" && (
                      <button
                        onClick={() => updateStatus(module.id, "archived")}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
