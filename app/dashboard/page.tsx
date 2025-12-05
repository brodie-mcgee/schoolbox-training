"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  ChevronRight,
  Settings,
  BarChart3,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: string;
  type: "module" | "course";
  entity_id: string;
  title: string;
  description: string;
  duration_minutes?: number;
  lesson_count?: number;
  enrolled_at: string;
  due_date: string | null;
  started_at: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueSoon: number;
}

interface Session {
  name: string;
  email: string;
  isAdmin: boolean;
  isHR: boolean;
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0, overdue: 0, dueSoon: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch session
        const sessionRes = await fetch("/api/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData.session);
        }

        // Fetch enrollments
        const enrollmentsRes = await fetch("/api/my/enrollments");
        if (enrollmentsRes.ok) {
          const data = await enrollmentsRes.json();
          setEnrollments(data.enrollments || []);
          setStats(data.stats || { total: 0, completed: 0, pending: 0, overdue: 0, dueSoon: 0 });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Get pending/active enrollments (not completed)
  const activeEnrollments = enrollments
    .filter((e) => !e.completed)
    .sort((a, b) => {
      // Sort by due date (overdue first, then by due date)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Staff Training Portal
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {session?.name || "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.name}</p>
                <p className="text-xs text-gray-500">{session?.email}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {session?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2) || "?"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dueSoon}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active/Pending Training */}
        {activeEnrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Assigned Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={`${enrollment.type}-${enrollment.id}`}
                  href={enrollment.type === "module" ? `/training/${enrollment.entity_id}` : `/courses/${enrollment.entity_id}`}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group ${
                    isOverdue(enrollment.due_date)
                      ? "border-red-200 hover:border-red-300"
                      : "border-gray-100 hover:border-purple-200"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        enrollment.type === "module" ? "bg-purple-100" : "bg-indigo-100"
                      }`}>
                        {enrollment.type === "module" ? (
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      {isOverdue(enrollment.due_date) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : enrollment.due_date ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(enrollment.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {enrollment.type === "module" ? "Module" : "Course"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {enrollment.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {enrollment.description || "No description available"}
                    </p>

                    {enrollment.type === "module" && (
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{enrollment.duration_minutes || 0} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{enrollment.lesson_count || 0} lessons</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
                      {enrollment.started_at ? "Continue Training" : "Start Training"} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/training"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">All Training Modules</h3>
                  <p className="text-sm text-gray-500">
                    Browse all available training
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/courses"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Courses</h3>
                  <p className="text-sm text-gray-500">
                    Browse available courses
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/badges"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Badges</h3>
                  <p className="text-sm text-gray-500">
                    View earned badges and achievements
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/certificates"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Certificates</h3>
                  <p className="text-sm text-gray-500">
                    Download completion certificates
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Admin/HR Section */}
        {(session?.isAdmin || session?.isHR) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {session?.isAdmin ? "Administration" : "HR Tools"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session?.isAdmin && (
                <Link
                  href="/admin"
                  className="bg-gray-900 rounded-xl shadow-sm p-6 hover:bg-gray-800 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Admin Panel</h3>
                        <p className="text-sm text-gray-400">
                          Manage modules, courses, and users
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  </div>
                </Link>
              )}

              {(session?.isAdmin || session?.isHR) && (
                <Link
                  href="/admin/reports"
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Compliance Reports
                        </h3>
                        <p className="text-sm text-gray-500">
                          Analytics and training compliance
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2">
              No Training Assigned Yet
            </h3>
            <p className="text-sm text-purple-700">
              You don&apos;t have any training assigned yet. Browse available modules
              and courses, or check back later for assigned training.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
