import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/modules", label: "Modules", icon: BookOpen },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/users", label: "Users & Roles", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/unauthorized");
  }

  if (!session.isAdmin) {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back to Portal</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <span className="font-semibold">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{session.name}</span>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
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

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-purple-600"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
