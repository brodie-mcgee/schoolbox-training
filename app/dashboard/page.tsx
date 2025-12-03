import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  ChevronRight,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/unauthorized");
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
                  Welcome back, {session.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.name}</p>
                <p className="text-xs text-gray-500">{session.email}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {session.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned Training</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
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
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>

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
                  <h3 className="font-semibold text-gray-900">Training Modules</h3>
                  <p className="text-sm text-gray-500">
                    View and complete training modules
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
        {(session.isAdmin || session.isHR) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {session.isAdmin ? "Administration" : "HR Tools"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.isAdmin && (
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

              {(session.isAdmin || session.isHR) && (
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

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-2">
            Training Portal Coming Soon
          </h3>
          <p className="text-sm text-purple-700">
            We&apos;re currently building out the training features. Check back soon for
            your assigned training modules, courses, and badges!
          </p>
        </div>
      </main>
    </div>
  );
}
