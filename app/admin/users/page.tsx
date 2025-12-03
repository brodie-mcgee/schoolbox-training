"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
  created_at: string;
}

const AVAILABLE_ROLES = [
  { id: "staff", label: "Staff", description: "Basic staff access" },
  { id: "hr", label: "HR", description: "HR dashboards and compliance analytics" },
  { id: "admin", label: "Admin", description: "Admin panel access" },
  { id: "super_admin", label: "Super Admin", description: "Full system access" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [savingRoles, setSavingRoles] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(user: User) {
    setEditingUser(user.id);
    setPendingRoles([...user.roles]);
  }

  function cancelEditing() {
    setEditingUser(null);
    setPendingRoles([]);
  }

  function toggleRole(role: string) {
    if (pendingRoles.includes(role)) {
      // Don't allow removing the last role
      if (pendingRoles.length === 1) {
        toast.error("User must have at least one role");
        return;
      }
      setPendingRoles(pendingRoles.filter((r) => r !== role));
    } else {
      setPendingRoles([...pendingRoles, role]);
    }
  }

  async function saveRoles(userId: string) {
    setSavingRoles(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: pendingRoles }),
      });

      if (response.ok) {
        toast.success("Roles updated successfully");
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, roles: pendingRoles } : u
          )
        );
        setEditingUser(null);
        setPendingRoles([]);
      } else {
        toast.error("Failed to update roles");
      }
    } catch (error) {
      console.error("Failed to save roles:", error);
      toast.error("Failed to save roles");
    } finally {
      setSavingRoles(null);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getRoleIcon(roles: string[]) {
    if (roles.includes("super_admin")) return ShieldCheck;
    if (roles.includes("admin")) return Shield;
    return UserCog;
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "hr":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
        <p className="text-gray-600">
          Manage user roles and permissions. Assign HR access for compliance dashboards.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {AVAILABLE_ROLES.map((role) => (
            <div key={role.id} className="flex items-start gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(role.id)}`}>
                {role.label}
              </span>
              <span className="text-xs text-gray-500">{role.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.roles);
                const isEditing = editingUser === user.id;

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <RoleIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_ROLES.map((role) => {
                            const isSelected = pendingRoles.includes(role.id);
                            return (
                              <button
                                key={role.id}
                                onClick={() => toggleRole(role.id)}
                                className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                  isSelected
                                    ? `${getRoleBadgeColor(role.id)} border-transparent`
                                    : "bg-white text-gray-500 border-gray-300 hover:border-purple-400"
                                }`}
                              >
                                {role.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={savingRoles === user.id}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => saveRoles(user.id)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                            disabled={savingRoles === user.id}
                          >
                            {savingRoles === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(user)}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          Edit Roles
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
