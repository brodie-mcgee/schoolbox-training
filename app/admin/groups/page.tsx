"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
}

interface GroupMember {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  added_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const response = await fetch("/api/admin/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(group: Group) {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will remove all members from the group.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/groups/${group.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Group deleted successfully");
        setGroups(groups.filter((g) => g.id !== group.id));
      } else {
        toast.error("Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    }
  }

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">
            Create and manage groups for training assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-500 mt-2">Loading groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">
            {groups.length === 0 ? "No groups yet" : "No groups match your search"}
          </p>
          {groups.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first group
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    {group.member_count} {group.member_count === 1 ? "member" : "members"}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{group.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {group.description || "No description"}
                </p>

                <p className="text-xs text-gray-400">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManagingGroup(group)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Manage
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteGroup(group)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGroup) && (
        <GroupFormModal
          group={editingGroup}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGroup(null);
          }}
          onSuccess={(group) => {
            if (editingGroup) {
              setGroups(groups.map((g) => (g.id === group.id ? group : g)));
            } else {
              setGroups([...groups, group]);
            }
            setShowCreateModal(false);
            setEditingGroup(null);
          }}
        />
      )}

      {/* Manage Members Modal */}
      {managingGroup && (
        <ManageMembersModal
          group={managingGroup}
          onClose={() => setManagingGroup(null)}
          onMemberChange={(newCount) => {
            setGroups(groups.map((g) =>
              g.id === managingGroup.id ? { ...g, member_count: newCount } : g
            ));
          }}
        />
      )}
    </div>
  );
}

// Group Form Modal (Create/Edit)
function GroupFormModal({
  group,
  onClose,
  onSuccess,
}: {
  group: Group | null;
  onClose: () => void;
  onSuccess: (group: Group) => void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const url = group ? `/api/admin/groups/${group.id}` : "/api/admin/groups";
      const method = group ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(group ? "Group updated" : "Group created");
        onSuccess(data.group);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save group");
      }
    } catch (error) {
      console.error("Failed to save group:", error);
      toast.error("Failed to save group");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {group ? "Edit Group" : "Create Group"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Staff 2025"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {group ? "Save Changes" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Manage Members Modal
function ManageMembersModal({
  group,
  onClose,
  onMemberChange,
}: {
  group: Group;
  onClose: () => void;
  onMemberChange: (newCount: number) => void;
}) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [addingUsers, setAddingUsers] = useState(false);

  useEffect(() => {
    loadData();
  }, [group.id]);

  async function loadData() {
    setLoading(true);
    try {
      // Load members and all users in parallel
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/admin/groups/${group.id}/members`),
        fetch("/api/admin/users"),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(member: GroupMember) {
    if (!confirm(`Remove ${member.user_name} from this group?`)) return;

    try {
      const response = await fetch(
        `/api/admin/groups/${group.id}/members?user_id=${member.user_id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Member removed");
        const newMembers = members.filter((m) => m.id !== member.id);
        setMembers(newMembers);
        onMemberChange(newMembers.length);
      } else {
        toast.error("Failed to remove member");
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
    }
  }

  async function addSelectedUsers() {
    if (selectedUsers.length === 0) return;

    setAddingUsers(true);
    try {
      const response = await fetch(`/api/admin/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: selectedUsers }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Added ${data.added} member(s)`);
        setShowAddUsers(false);
        setSelectedUsers([]);
        loadData();
        onMemberChange(members.length + data.added);
      } else {
        toast.error("Failed to add members");
      }
    } catch (error) {
      console.error("Failed to add members:", error);
      toast.error("Failed to add members");
    } finally {
      setAddingUsers(false);
    }
  }

  // Get users not already in the group
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  // Filter available users by search
  const filteredAvailableUsers = availableUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <p className="text-sm text-gray-500">Manage group members</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          ) : showAddUsers ? (
            // Add Users View
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setShowAddUsers(false);
                    setSelectedUsers([]);
                    setSearchQuery("");
                  }}
                  className="text-sm text-purple-600 hover:underline"
                >
                  ← Back to members
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {filteredAvailableUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {availableUsers.length === 0
                    ? "All users are already in this group"
                    : "No users match your search"}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {filteredAvailableUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {user.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={addSelectedUsers}
                    disabled={addingUsers}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addingUsers && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} to group
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Members List View
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
                <button
                  onClick={() => setShowAddUsers(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Members
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">No members yet</p>
                  <button
                    onClick={() => setShowAddUsers(true)}
                    className="mt-2 text-sm text-purple-600 hover:underline"
                  >
                    Add members
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {member.user_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user_name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">{member.user_email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(member)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from group"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
