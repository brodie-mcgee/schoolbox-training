"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  BookOpen,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
}

const CATEGORIES = [
  "Compliance",
  "Safety",
  "Professional Development",
  "Technology",
  "Leadership",
  "Onboarding",
  "Other",
];

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft" as "draft" | "published" | "archived",
    module_ids: [] as string[],
  });

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      const response = await fetch("/api/admin/modules");
      if (response.ok) {
        const data = await response.json();
        // Only show published modules for course assignment
        setAvailableModules(
          data.modules.filter((m: Module) => m.status === "published")
        );
      }
    } catch (error) {
      console.error("Failed to load modules:", error);
    } finally {
      setLoadingModules(false);
    }
  }

  function addModule(moduleId: string) {
    if (!formData.module_ids.includes(moduleId)) {
      setFormData({
        ...formData,
        module_ids: [...formData.module_ids, moduleId],
      });
    }
  }

  function removeModule(moduleId: string) {
    setFormData({
      ...formData,
      module_ids: formData.module_ids.filter((id) => id !== moduleId),
    });
  }

  function moveModule(index: number, direction: "up" | "down") {
    const newIds = [...formData.module_ids];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    setFormData({ ...formData, module_ids: newIds });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Course created successfully");
        router.push("/admin/courses");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Failed to create course:", error);
      toast.error("Failed to create course");
    } finally {
      setSaving(false);
    }
  }

  const selectedModules = formData.module_ids
    .map((id) => availableModules.find((m) => m.id === id))
    .filter(Boolean) as Module[];

  const unselectedModules = availableModules.filter(
    (m) => !formData.module_ids.includes(m.id)
  );

  const totalDuration = selectedModules.reduce(
    (sum, m) => sum + (m.duration_minutes || 0),
    0
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/courses"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
          <p className="text-gray-600">
            Build a learning path with multiple modules
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Course Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., New Staff Onboarding Program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what staff will learn in this course..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as typeof formData.status,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Course Modules
              </h2>

              {/* Selected Modules */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Modules ({selectedModules.length})
                </h3>
                {selectedModules.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">
                      No modules selected. Add modules from the list below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedModules.map((module, index) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {module.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {module.duration_minutes || 0} minutes
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveModule(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(index, "down")}
                            disabled={index === selectedModules.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeModule(module.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Modules */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Available Modules
                </h3>
                {loadingModules ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  </div>
                ) : unselectedModules.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    {availableModules.length === 0
                      ? "No published modules available. Create and publish modules first."
                      : "All available modules have been added."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {unselectedModules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {module.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {module.duration_minutes || 0} minutes
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addModule(module.id)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Modules</p>
                    <p className="font-semibold text-gray-900">
                      {selectedModules.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Duration</p>
                    <p className="font-semibold text-gray-900">
                      {totalDuration} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Create Course"}
                </button>

                <Link
                  href="/admin/courses"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
