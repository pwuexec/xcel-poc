"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface BookingChatProps {
    bookingId: Id<"bookings">;
    currentUserId: Id<"users">;
    otherPartyName: string;
}

export default function BookingChat({ bookingId, currentUserId, otherPartyName }: BookingChatProps) {
    const [message, setMessage] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasMarkedAsReadRef = useRef(false);

    const messages = useQuery(
        api.schemas.messages.getBookingMessages,
        isChatOpen ? { bookingId } : "skip"
    );
    const unreadCount = useQuery(api.schemas.messages.getUnreadCount, { bookingId });
    const sendMessage = useMutation(api.schemas.messages.sendMessage);
    const markMessagesAsRead = useMutation(api.schemas.messages.markMessagesAsRead);

    // Auto-scroll when new messages arrive and chat is open
    useEffect(() => {
        if (isChatOpen && messages) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isChatOpen]);

    const handleToggleChat = () => {
        const willBeOpen = !isChatOpen;
        setIsChatOpen(willBeOpen);

        // Mark messages as read when opening chat (only once per session)
        if (willBeOpen && !hasMarkedAsReadRef.current) {
            markMessagesAsRead({ bookingId });
            hasMarkedAsReadRef.current = true;
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            await sendMessage({ bookingId, message });
            setMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
            alert(error instanceof Error ? error.message : "Failed to send message");
        }
    };

    const hasUnread = (unreadCount ?? 0) > 0;

    return (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
            <button
                onClick={handleToggleChat}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all ${hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="text-lg">💬</span>
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                                {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Chat with {otherPartyName}
                        </p>
                        {hasUnread && (
                            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                                {unreadCount} unread message{(unreadCount ?? 0) > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
                <span className={`text-zinc-400 dark:text-zinc-500 text-sm transform transition-transform ${isChatOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {isChatOpen && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Messages Container */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                        {!messages ? (
                            <div className="text-center py-6">
                                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-zinc-900 border-r-transparent dark:border-zinc-100 dark:border-r-transparent"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    No messages yet. Start the conversation!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isCurrentUser = msg.userId === currentUserId;
                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-3 py-2 ${isCurrentUser
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {msg.message}
                                            </p>
                                            <p
                                                className={`text-xs mt-1 ${isCurrentUser
                                                    ? "text-blue-100"
                                                    : "text-zinc-500 dark:text-zinc-400"
                                                    }`}
                                            >
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Message ${otherPartyName}...`}
                            maxLength={1000}
                            className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
