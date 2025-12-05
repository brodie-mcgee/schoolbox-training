"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Users,
  User,
  UsersRound,
  BookOpen,
  GraduationCap,
  Loader2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  status: string;
}

interface Course {
  id: string;
  title: string;
  status?: string;
  is_active?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles?: string[];
}

interface Group {
  id: string;
  name: string;
  member_count: number;
}

interface GroupMember {
  user_id: string;
}

interface AssignTrainingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedType?: "module" | "course";
  preselectedEntityId?: string;
}

type SelectionMode = "individual" | "group" | "role" | "all";

export default function AssignTrainingModal({
  onClose,
  onSuccess,
  preselectedType,
  preselectedEntityId,
}: AssignTrainingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Select training
  const [trainingType, setTrainingType] = useState<"module" | "course">(preselectedType || "module");
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(preselectedEntityId || "");

  // Step 2: Select users
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("individual");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("users");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);

  // Step 3: Set due date
  const [dueDate, setDueDate] = useState<string>("");

  // Derived data
  const roles = [...new Set(users.flatMap((u) => u.roles || []))].filter(Boolean).sort();

  useEffect(() => {
    loadData();
  }, []);

  // Load group members when groups are selected
  useEffect(() => {
    if (selectedGroupIds.length > 0 && selectionMode === "group") {
      loadGroupMembers(selectedGroupIds);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroupIds, selectionMode]);

  async function loadData() {
    setLoading(true);
    try {
      const [modulesRes, coursesRes, usersRes, groupsRes] = await Promise.all([
        fetch("/api/admin/modules"),
        fetch("/api/admin/courses"),
        fetch("/api/admin/users"),
        fetch("/api/admin/groups"),
      ]);

      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules?.filter((m: Module) => m.status === "published") || []);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses?.filter((c: Course) => c.is_active !== false) || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupMembers(groupIds: string[]) {
    setLoadingGroupMembers(true);
    try {
      // Fetch members from all selected groups in parallel
      const responses = await Promise.all(
        groupIds.map((id) => fetch(`/api/admin/groups/${id}/members`))
      );

      // Collect all unique user IDs from all groups
      const allMemberIds = new Set<string>();
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          data.members?.forEach((m: GroupMember) => allMemberIds.add(m.user_id));
        }
      }
      setGroupMembers([...allMemberIds]);
    } catch (error) {
      console.error("Failed to load group members:", error);
    } finally {
      setLoadingGroupMembers(false);
    }
  }

  function toggleGroupSelection(groupId: string) {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  }

  function selectAllGroups() {
    const filteredGroups = groups.filter((g) =>
      g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );
    setSelectedGroupIds([...new Set([...selectedGroupIds, ...filteredGroups.map((g) => g.id)])]);
  }

  function clearGroupSelection() {
    setSelectedGroupIds([]);
  }

  function getSelectedUsers(): User[] {
    switch (selectionMode) {
      case "all":
        return users;
      case "group":
        return users.filter((u) => groupMembers.includes(u.id));
      case "role":
        return users.filter((u) => u.roles?.includes(selectedRole));
      case "individual":
      default:
        return users.filter((u) => selectedUserIds.includes(u.id));
    }
  }

  function toggleUserSelection(userId: string) {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  }

  function selectAllFiltered() {
    const filteredUsers = users.filter(
      (u) =>
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
    setSelectedUserIds([...new Set([...selectedUserIds, ...filteredUsers.map((u) => u.id)])]);
  }

  function clearSelection() {
    setSelectedUserIds([]);
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  async function handleSubmit() {
    const targetUsers = getSelectedUsers();
    if (targetUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    if (!selectedEntityId) {
      toast.error("No training selected");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: trainingType,
          entity_id: selectedEntityId,
          user_ids: targetUsers.map((u) => u.id),
          due_date: dueDate || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Training assigned successfully");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign training");
      }
    } catch (error) {
      console.error("Failed to assign training:", error);
      toast.error("Failed to assign training");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTraining =
    trainingType === "module"
      ? modules.find((m) => m.id === selectedEntityId)
      : courses.find((c) => c.id === selectedEntityId);

  const canProceedStep1 = !!selectedEntityId;
  const canProceedStep2 = getSelectedUsers().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Assign Training</h3>
            <p className="text-sm text-gray-500">
              Step {step} of 3:{" "}
              {step === 1 ? "Select Training" : step === 2 ? "Select Users" : "Set Due Date"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Training */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Training Type Toggle */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => {
                        setTrainingType("module");
                        setSelectedEntityId("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        trainingType === "module"
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Module
                    </button>
                    <button
                      onClick={() => {
                        setTrainingType("course");
                        setSelectedEntityId("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        trainingType === "course"
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      Course
                    </button>
                  </div>

                  {/* Training List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {trainingType === "module" ? (
                      modules.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          No published modules available
                        </p>
                      ) : (
                        modules.map((module) => (
                          <label
                            key={module.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedEntityId === module.id
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="training"
                              checked={selectedEntityId === module.id}
                              onChange={() => setSelectedEntityId(module.id)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="flex-1 font-medium text-gray-900">
                              {module.title}
                            </span>
                          </label>
                        ))
                      )
                    ) : courses.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No active courses available
                      </p>
                    ) : (
                      courses.map((course) => (
                        <label
                          key={course.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedEntityId === course.id
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="training"
                            checked={selectedEntityId === course.id}
                            onChange={() => setSelectedEntityId(course.id)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <GraduationCap className="w-4 h-4 text-indigo-500" />
                          <span className="flex-1 font-medium text-gray-900">
                            {course.title}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Users */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Selection Mode */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { mode: "individual" as const, label: "Individual", icon: User },
                      { mode: "group" as const, label: "Group", icon: UsersRound },
                      { mode: "role" as const, label: "Role", icon: Users },
                      { mode: "all" as const, label: "All Staff", icon: Users },
                    ].map(({ mode, label, icon: Icon }) => (
                      <button
                        key={mode}
                        onClick={() => setSelectionMode(mode)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          selectionMode === mode
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Selection Options */}
                  {selectionMode === "group" && (
                    <div className="space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search groups..."
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Selection Actions */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? "s" : ""} selected
                          {groupMembers.length > 0 && (
                            <span className="text-purple-600 ml-1">
                              ({groupMembers.length} unique users)
                            </span>
                          )}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={selectAllGroups}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            Select all
                          </button>
                          <button
                            onClick={clearGroupSelection}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Group List */}
                      {groups.length === 0 ? (
                        <div className="text-center py-4 border border-gray-200 rounded-lg">
                          <p className="text-gray-500">No groups available.</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Create groups in the Groups section first.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {groups
                            .filter((g) =>
                              g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
                            )
                            .map((group) => (
                              <label
                                key={group.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedGroupIds.includes(group.id)}
                                  onChange={() => toggleGroupSelection(group.id)}
                                  className="w-4 h-4 text-purple-600 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {group.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </label>
                            ))}
                        </div>
                      )}

                      {loadingGroupMembers && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading group members...
                        </div>
                      )}
                    </div>
                  )}

                  {selectionMode === "role" && (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select role...</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role} ({users.filter((u) => u.roles?.includes(role)).length} users)
                        </option>
                      ))}
                    </select>
                  )}

                  {selectionMode === "individual" && (
                    <div className="space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Selection Actions */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {selectedUserIds.length} selected
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={selectAllFiltered}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            Select all
                          </button>
                          <button
                            onClick={clearSelection}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* User List */}
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No users found</p>
                        ) : (
                          filteredUsers.map((user) => (
                            <label
                              key={user.id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectionMode === "all" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        <strong>{users.length}</strong> staff members will be assigned this
                        training.
                      </p>
                    </div>
                  )}

                  {/* Preview */}
                  {getSelectedUsers().length > 0 && selectionMode !== "individual" && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <button
                        onClick={() =>
                          setExpandedSection(expandedSection === "preview" ? null : "preview")
                        }
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
                      >
                        <span>Preview: {getSelectedUsers().length} users will be assigned</span>
                        {expandedSection === "preview" ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedSection === "preview" && (
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {getSelectedUsers()
                            .slice(0, 20)
                            .map((user) => (
                              <p key={user.id} className="text-xs text-gray-600 py-0.5">
                                {user.name}
                              </p>
                            ))}
                          {getSelectedUsers().length > 20 && (
                            <p className="text-xs text-gray-400 py-0.5">
                              ...and {getSelectedUsers().length - 20} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Set Due Date */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Assignment Summary</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      <p>
                        <strong>Training:</strong> {selectedTraining?.title}
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        {trainingType === "module" ? "Module" : "Course"}
                      </p>
                      <p>
                        <strong>Users:</strong> {getSelectedUsers().length} staff members
                      </p>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Set a due date for compliance tracking. Users will be marked as overdue
                      if they haven&apos;t completed by this date.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep((step - 1) as 1 | 2)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting ? "Assigning..." : "Assign Training"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
