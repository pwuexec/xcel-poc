"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "tutor" | "admin";

export default function AdminUsersPage() {
    const users = useQuery(api.admin.integrations.reads.listAllUsers);
    const currentUser = useQuery(api.users.integrations.reads.getMe);
    const updateUserRole = useMutation(api.admin.integrations.writes.updateUserRole);
    const updateUserName = useMutation(api.admin.integrations.writes.updateUserName);
    const createUser = useMutation(api.admin.integrations.writes.createUser);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserRole, setNewUserRole] = useState<Role>("user");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingNameId, setEditingNameId] = useState<Id<"users"> | null>(null);
    const [editingNameValue, setEditingNameValue] = useState("");
    const router = useRouter();

    // Check if user is admin
    const isAdmin = currentUser?.role === "admin";

    // Redirect if not admin
    if (currentUser && !isAdmin) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Access Denied
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const handleRoleChange = async (userId: Id<"users">, newRole: Role) => {
        setError(null);
        try {
            await updateUserRole({ userId, role: newRole });
        } catch (error) {
            console.error("Failed to update role:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update role";
            setError(errorMessage);
        }
    };

    const handleNameEdit = (userId: Id<"users">, currentName: string) => {
        setEditingNameId(userId);
        setEditingNameValue(currentName);
    };

    const handleNameSave = async (userId: Id<"users">) => {
        setError(null);
        try {
            await updateUserName({ userId, name: editingNameValue });
            setEditingNameId(null);
            setEditingNameValue("");
        } catch (error) {
            console.error("Failed to update name:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update name";
            setError(errorMessage);
        }
    };

    const handleNameCancel = () => {
        setEditingNameId(null);
        setEditingNameValue("");
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);
        try {
            const fullEmail = newUserEmail.includes("@")
                ? newUserEmail
                : `${newUserEmail}@xceltutors.com`;

            await createUser({
                name: newUserName,
                email: fullEmail,
                password: "Teste1234",
                role: newUserRole,
            });
            // Reset form
            setNewUserName("");
            setNewUserEmail("");
            setNewUserRole("user");
            setShowCreateForm(false);
        } catch (error) {
            console.error("Failed to create user:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create user";
            setError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                User Management
                            </h1>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Admin
                            </span>
                        </div>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                            Assign roles to users across the platform
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        {showCreateForm ? "Cancel" : "Create User"}
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Create User Form */}
                {showCreateForm && (
                    <div className="mb-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                            Create New User
                        </h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        placeholder="Enter name"
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                        Email
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            id="email"
                                            type="text"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            placeholder="username"
                                            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                            required
                                        />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">@xceltutors.com</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value as Role)}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                    >
                                        <option value="user">User</option>
                                        <option value="tutor">Tutor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? "Creating..." : "Create User"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Users List */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {!users ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-100 dark:border-r-transparent"></div>
                            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-600 dark:text-zinc-400">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Created At
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Current Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Assign Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {users.map((user) => {
                                        const isCurrentUser = user._id === currentUser?._id;
                                        return (
                                            <tr key={user._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {user.image ? (
                                                            <img
                                                                src={user.image}
                                                                alt={user.name || "User"}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                                                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                                                                    {user.name?.[0]?.toUpperCase() || "?"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            {editingNameId === user._id ? (
                                                                <div className="flex gap-2 items-center">
                                                                    <input
                                                                        type="text"
                                                                        value={editingNameValue}
                                                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                                                        className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleNameSave(user._id)}
                                                                        className="text-xs text-green-600 dark:text-green-400 hover:underline"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={handleNameCancel}
                                                                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                                        {user.name || "Unknown User"}
                                                                        {isCurrentUser && (
                                                                            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(You)</span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleNameEdit(user._id, user.name || "")}
                                                                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {user.email || "No email"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {new Date(user._creationTime).toLocaleDateString("en-GB", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                            timeZone: "Europe/London",
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === "admin"
                                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                                            : user.role === "tutor"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                                : user.role === "user"
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                                                            }`}
                                                    >
                                                        {user.role || "No role"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isCurrentUser ? (
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            Cannot change own role
                                                        </span>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRoleChange(user._id, "user")}
                                                                disabled={user.role === "user"}
                                                                className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                User
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleChange(user._id, "tutor")}
                                                                disabled={user.role === "tutor"}
                                                                className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                Tutor
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleChange(user._id, "admin")}
                                                                disabled={user.role === "admin"}
                                                                className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                Admin
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
