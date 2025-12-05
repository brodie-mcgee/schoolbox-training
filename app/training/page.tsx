"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  PlayCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  lessons: unknown[];
  lesson_count: number;
  status: string;
  category: string;
  created_at: string;
}

interface Enrollment {
  module_id: string;
  completed: boolean;
  completed_at?: string;
  started_at?: string;
}

export default function TrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch modules and enrollments in parallel
        const [modulesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/training"),
          fetch("/api/my/enrollments"),
        ]);

        if (!modulesRes.ok) {
          const data = await modulesRes.json();
          throw new Error(data.error || "Failed to fetch modules");
        }

        const modulesData = await modulesRes.json();
        setModules(modulesData.modules || []);

        // Process enrollments into a lookup map
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          const enrollmentMap: Record<string, Enrollment> = {};
          (enrollmentsData.enrollments || []).forEach((e: Enrollment) => {
            enrollmentMap[e.module_id] = e;
          });
          setEnrollments(enrollmentMap);
        }
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load modules");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Separate modules into available and completed
  const completedModules = modules.filter((m) => enrollments[m.id]?.completed);
  const availableModules = modules.filter((m) => !enrollments[m.id]?.completed);

  const getModuleStatus = (moduleId: string) => {
    const enrollment = enrollments[moduleId];
    if (!enrollment) return "available";
    if (enrollment.completed) return "completed";
    if (enrollment.started_at) return "in_progress";
    return "available";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading training modules...</p>
        </div>
      </div>
    );
  }

  const ModuleCard = ({ module, isCompleted }: { module: TrainingModule; isCompleted: boolean }) => {
    const status = getModuleStatus(module.id);
    const enrollment = enrollments[module.id];

    return (
      <Link
        href={`/training/${module.id}`}
        className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all overflow-hidden group ${
          isCompleted
            ? "border-green-200 hover:border-green-300"
            : "border-gray-100 hover:border-purple-200"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isCompleted
                ? "bg-green-100 group-hover:bg-green-200"
                : "bg-purple-100 group-hover:bg-purple-200"
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <BookOpen className="w-5 h-5 text-purple-600" />
              )}
            </div>
            {status === "completed" ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </span>
            ) : status === "in_progress" ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                In Progress
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Available
              </span>
            )}
          </div>

          <h3 className={`font-semibold mb-2 transition-colors ${
            isCompleted
              ? "text-gray-700 group-hover:text-green-600"
              : "text-gray-900 group-hover:text-purple-600"
          }`}>
            {module.title}
          </h3>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {module.description || "No description available"}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{module.duration_minutes || 0} min</span>
            </div>
            <div className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              <span>{module.lesson_count || 0} lessons</span>
            </div>
          </div>

          {isCompleted && enrollment?.completed_at && (
            <p className="text-xs text-gray-400 mt-3">
              Completed {new Date(enrollment.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className={`px-6 py-3 border-t ${
          isCompleted
            ? "bg-green-50 border-green-100"
            : "bg-gray-50 border-gray-100"
        }`}>
          <span className={`text-sm font-medium ${
            isCompleted
              ? "text-green-600 group-hover:text-green-700"
              : "text-purple-600 group-hover:text-purple-700"
          }`}>
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <RotateCcw className="w-4 h-4" />
                Review Training →
              </span>
            ) : status === "in_progress" ? (
              "Continue Training →"
            ) : (
              "Start Training →"
            )}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Training Modules
              </h1>
              <p className="text-sm text-gray-500">
                Browse and complete your assigned training
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {modules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Training Modules Available
            </h3>
            <p className="text-gray-500">
              There are no published training modules at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Available Modules Section */}
            {availableModules.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Available Training ({availableModules.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableModules.map((module) => (
                    <ModuleCard key={module.id} module={module} isCompleted={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Modules Section */}
            {completedModules.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Completed Training ({completedModules.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedModules.map((module) => (
                    <ModuleCard key={module.id} module={module} isCompleted={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Show message if everything is completed */}
            {availableModules.length === 0 && completedModules.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-green-800 mb-1">
                  All Training Complete!
                </h3>
                <p className="text-green-600">
                  You&apos;ve completed all available training modules. Great work!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
