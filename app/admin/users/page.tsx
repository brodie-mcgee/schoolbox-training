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
  RefreshCw,
  CloudDownload,
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

interface SyncPreview {
  name: string;
  email: string;
  username: string;
}

interface SyncStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
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

  // Sync state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncPreview, setSyncPreview] = useState<SyncPreview[]>([]);
  const [syncTotalStaff, setSyncTotalStaff] = useState(0);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

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

  async function openSyncModal() {
    setShowSyncModal(true);
    setSyncLoading(true);
    setSyncStats(null);
    setSyncPreview([]);

    try {
      const response = await fetch("/api/admin/users/sync");
      if (response.ok) {
        const data = await response.json();
        setSyncPreview(data.staff || []);
        setSyncTotalStaff(data.totalStaff || 0);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch Schoolbox staff");
        setShowSyncModal(false);
      }
    } catch (error) {
      console.error("Failed to preview sync:", error);
      toast.error("Failed to connect to Schoolbox");
      setShowSyncModal(false);
    } finally {
      setSyncLoading(false);
    }
  }

  async function performSync() {
    setSyncLoading(true);
    try {
      const response = await fetch("/api/admin/users/sync", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStats(data.stats);
        toast.success(
          `Sync complete: ${data.stats.created} created, ${data.stats.updated} updated`
        );
        // Reload users list
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Sync failed");
      }
    } catch (error) {
      console.error("Failed to sync:", error);
      toast.error("Failed to sync with Schoolbox");
    } finally {
      setSyncLoading(false);
    }
  }

  function closeSyncModal() {
    setShowSyncModal(false);
    setSyncPreview([]);
    setSyncStats(null);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-600">
            Manage user roles and permissions. Assign HR access for compliance dashboards.
          </p>
        </div>
        <button
          onClick={openSyncModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CloudDownload className="w-4 h-4" />
          Sync from Schoolbox
        </button>
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

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sync Staff from Schoolbox
                  </h3>
                  <p className="text-sm text-gray-500">
                    Import staff members from Schoolbox LMS
                  </p>
                </div>
              </div>
              <button
                onClick={closeSyncModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {syncLoading && !syncStats ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-500 mt-2">
                    {syncPreview.length === 0
                      ? "Fetching staff from Schoolbox..."
                      : "Syncing users..."}
                  </p>
                </div>
              ) : syncStats ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Sync Complete!
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Total processed:</span>{" "}
                        <strong>{syncStats.total}</strong>
                      </div>
                      <div>
                        <span className="text-green-600">Created:</span>{" "}
                        <strong>{syncStats.created}</strong>
                      </div>
                      <div>
                        <span className="text-green-600">Updated:</span>{" "}
                        <strong>{syncStats.updated}</strong>
                      </div>
                      <div>
                        <span className="text-green-600">Skipped:</span>{" "}
                        <strong>{syncStats.skipped}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                      Found <strong>{syncTotalStaff}</strong> staff members in
                      Schoolbox.
                      {syncTotalStaff > 50 && (
                        <span className="text-sm text-blue-600 block mt-1">
                          Showing first 50 for preview.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Username
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {syncPreview.map((staff, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">
                              {staff.name}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {staff.email || "—"}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {staff.username}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={closeSyncModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {syncStats ? "Close" : "Cancel"}
              </button>
              {!syncStats && (
                <button
                  onClick={performSync}
                  disabled={syncLoading || syncPreview.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync {syncTotalStaff} Staff
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
