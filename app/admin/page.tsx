"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalModules: number;
  totalCourses: number;
  activeEnrollments: number;
  completedThisMonth: number;
  overdue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalModules: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    completedThisMonth: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      href: "/admin/users",
    },
    {
      label: "Training Modules",
      value: stats.totalModules,
      icon: BookOpen,
      color: "purple",
      href: "/admin/modules",
    },
    {
      label: "Courses",
      value: stats.totalCourses,
      icon: GraduationCap,
      color: "indigo",
      href: "/admin/courses",
    },
    {
      label: "Active Enrollments",
      value: stats.activeEnrollments,
      icon: TrendingUp,
      color: "green",
      href: "/admin/reports",
    },
    {
      label: "Completed This Month",
      value: stats.completedThisMonth,
      icon: CheckCircle,
      color: "emerald",
      href: "/admin/reports",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "red",
      href: "/admin/reports",
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    purple: { bg: "bg-purple-100", icon: "text-purple-600" },
    indigo: { bg: "bg-indigo-100", icon: "text-indigo-600" },
    green: { bg: "bg-green-100", icon: "text-green-600" },
    emerald: { bg: "bg-emerald-100", icon: "text-emerald-600" },
    red: { bg: "bg-red-100", icon: "text-red-600" },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage training modules, courses, and users</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "--" : stat.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/modules/new"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Create Module</span>
          </Link>
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Create Course</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Manage Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
