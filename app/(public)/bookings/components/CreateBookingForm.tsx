"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function CreateBookingForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [toUserId, setToUserId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createBooking = useMutation(api.schemas.bookings.createBooking);
    const allUsers = useQuery(api.schemas.users.getAllUsers);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!toUserId || !date || !time) {
            alert("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse date and time as UK timezone (Europe/London)
            // The input gives us local time, which for UK users is already in UK timezone
            const timestamp = new Date(`${date}T${time}`).getTime();
            await createBooking({
                toUserId: toUserId as Id<"users">,
                timestamp,
            });

            // Reset form
            setToUserId("");
            setDate("");
            setTime("");
            setIsOpen(false);
            alert("Booking created successfully!");
        } catch (error) {
            console.error("Failed to create booking:", error);
            alert("Failed to create booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                Create New Booking
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                Create Booking
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="toUserId"
                                    className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                                >
                                    Select Tutor
                                </label>
                                <select
                                    id="toUserId"
                                    value={toUserId}
                                    onChange={(e) => setToUserId(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                    required
                                >
                                    <option value="">Select a tutor...</option>
                                    {allUsers?.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name || user.email || "Unknown User"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="date"
                                    className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                                >
                                    Date (UK Time)
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="time"
                                    className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                                >
                                    Time (UK Time)
                                </label>
                                <input
                                    id="time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
