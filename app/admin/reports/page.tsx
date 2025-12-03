"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ReportStats {
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  overdueEnrollments: number;
  completionRate: number;
  avgCompletionTime: number;
}

interface ComplianceItem {
  user_name: string;
  user_email: string;
  module_title: string;
  due_date: string;
  status: string;
  days_overdue?: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalEnrollments: 0,
    completedEnrollments: 0,
    inProgressEnrollments: 0,
    overdueEnrollments: 0,
    completionRate: 0,
    avgCompletionTime: 0,
  });
  const [overdueItems, setOverdueItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  async function loadReportData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?days=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setOverdueItems(data.overdue || []);
      }
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(type: "csv" | "pdf") {
    toast.info(`Exporting ${type.toUpperCase()} report...`);
    try {
      const response = await fetch(`/api/admin/reports/export?type=${type}&days=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `training-report-${new Date().toISOString().split("T")[0]}.${type}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported successfully");
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      console.error("Failed to export report:", error);
      toast.error("Failed to export report");
    }
  }

  const statCards = [
    {
      label: "Total Enrollments",
      value: stats.totalEnrollments,
      icon: Users,
      color: "blue",
    },
    {
      label: "Completed",
      value: stats.completedEnrollments,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "In Progress",
      value: stats.inProgressEnrollments,
      icon: Clock,
      color: "yellow",
    },
    {
      label: "Overdue",
      value: stats.overdueEnrollments,
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    green: { bg: "bg-green-100", icon: "text-green-600" },
    yellow: { bg: "bg-yellow-100", icon: "text-yellow-600" },
    red: { bg: "bg-red-100", icon: "text-red-600" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Training analytics and compliance reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => exportReport("csv")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => {
              const colors = colorClasses[stat.color];
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}
                    >
                      <stat.icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Completion Rate
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.completionRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.completedEnrollments} of {stats.totalEnrollments} enrollments completed
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Average Completion Time
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgCompletionTime > 0
                      ? `${stats.avgCompletionTime.toFixed(1)} days`
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    From enrollment to completion
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Overdue Training
              </h3>
              {overdueItems.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {overdueItems.length} items
                </span>
              )}
            </div>

            {overdueItems.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
                <p className="text-gray-500 mt-2">
                  No overdue training! Everyone is on track.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overdueItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.user_name}
                          </p>
                          <p className="text-sm text-gray-500">{item.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.module_title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {item.days_overdue} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
