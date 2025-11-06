"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0"),
}));

const MINUTES = [0, 15, 30, 45].map((m) => ({
  value: m,
  label: m.toString().padStart(2, "0"),
}));

interface RecurringBookingsManagerProps {
  tutorId: Id<"users">;
  tutorName: string;
}

export function RecurringBookingsManager({ tutorId, tutorName }: RecurringBookingsManagerProps) {
  const [dayOfWeek, setDayOfWeek] = useState<string>("monday");
  const [hourUTC, setHourUTC] = useState<number>(14);
  const [minuteUTC, setMinuteUTC] = useState<number>(0);

  const recurringRules = useQuery(api.schemas.recurringRules.getMyRecurringRules);
  const createRule = useMutation(api.schemas.recurringRules.createRecurringRule);
  const pauseRule = useMutation(api.schemas.recurringRules.pauseRecurringRule);
  const resumeRule = useMutation(api.schemas.recurringRules.resumeRecurringRule);
  const cancelRule = useMutation(api.schemas.recurringRules.cancelRecurringRule);
  const deleteRule = useMutation(api.schemas.recurringRules.deleteRecurringRule);

  const handleCreateRule = async () => {
    try {
      await createRule({
        toUserId: tutorId,
        dayOfWeek: dayOfWeek as any,
        hourUTC,
        minuteUTC,
      });
    } catch (error) {
      console.error("Failed to create recurring rule:", error);
      alert(error instanceof Error ? error.message : "Failed to create recurring rule");
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} UTC`;
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "paused":
        return "secondary";
      case "canceled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Filter rules for this tutor
  const tutorRules = recurringRules?.filter(
    (item: any) => item.rule.toUserId === tutorId || item.rule.fromUserId === tutorId
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Recurring Booking</CardTitle>
          <CardDescription>
            Set up automatic weekly bookings with {tutorName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Day of Week</label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hour (UTC)</label>
              <Select value={hourUTC.toString()} onValueChange={(v) => setHourUTC(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minute</label>
              <Select value={minuteUTC.toString()} onValueChange={(v) => setMinuteUTC(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((minute) => (
                    <SelectItem key={minute.value} value={minute.value.toString()}>
                      :{minute.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Bookings will be created every {formatDay(dayOfWeek)} at {formatTime(hourUTC, minuteUTC)}
            </p>
            <Button onClick={handleCreateRule}>Create Rule</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Recurring Rules</CardTitle>
          <CardDescription>
            Manage your automatic booking schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tutorRules || tutorRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recurring rules yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {tutorRules.map((item: any) => (
                <div
                  key={item.rule._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Every {formatDay(item.rule.dayOfWeek)} at{" "}
                        {formatTime(item.rule.hourUTC, item.rule.minuteUTC)}
                      </p>
                      <Badge variant={getStatusBadgeVariant(item.rule.status)}>
                        {item.rule.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      With {item.toUser.name || item.toUser.email}
                    </p>
                    {item.rule.lastBookingCreatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last booking created:{" "}
                        {new Date(item.rule.lastBookingCreatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {item.rule.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pauseRule({ ruleId: item.rule._id })}
                      >
                        Pause
                      </Button>
                    )}
                    {item.rule.status === "paused" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeRule({ ruleId: item.rule._id })}
                      >
                        Resume
                      </Button>
                    )}
                    {item.rule.status !== "canceled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelRule({ ruleId: item.rule._id })}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this rule?")) {
                          deleteRule({ ruleId: item.rule._id });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
