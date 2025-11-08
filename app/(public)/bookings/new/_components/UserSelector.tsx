"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface User {
    _id: string;
    name?: string;
    email?: string;
}

interface UserSelectorProps {
    value: string;
    onChange: (userId: string) => void;
    users: User[] | undefined;
    label: string;
    placeholder: string;
}

export function UserSelector({ 
    value, 
    onChange, 
    users, 
    label, 
    placeholder 
}: UserSelectorProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="toUserId">{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {users?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                            {user.name || user.email || "Unknown User"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
