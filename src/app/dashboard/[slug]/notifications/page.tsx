"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const loadNotificationsData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await listNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      console.error("Error loading notifications:", err);
      if (!silent) toast.error("Failed to load notifications");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsData();
    const interval = setInterval(() => loadNotificationsData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      toast.success("Notification marked as read");
      await loadNotificationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
      await loadNotificationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update notifications");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      await loadNotificationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-1">
            SYSTEM TELEMETRY & ALERTS
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time restaurant operational events, inventory alerts, and shift updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all border-none cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-blue-400" />
            <span>Mark all as read ({unreadCount})</span>
          </Button>
        )}
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL NOTIFICATIONS"
          value={isLoading ? "..." : `${notifications.length}`}
          subtext="persisted in database"
        />
        <StatCard
          label="UNREAD ALERTS"
          value={isLoading ? "..." : `${unreadCount}`}
          subtext="requiring attention"
        />
        <StatCard
          label="SYSTEM STATUS"
          value="Operational"
          subtext="live telemetry synchronized"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filter === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-auto">
                {unreadCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setFilter("read")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              filter === "read"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading notifications from PostgreSQL...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="design-surface p-12 text-center text-slate-400 text-xs">
          No notifications found for selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const formattedDate = new Date(n.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={n.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  !n.isRead
                    ? "bg-blue-50/40 border-blue-200/80 shadow-2xs"
                    : "bg-white border-slate-200/80"
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border",
                      n.type === "warning"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : n.type === "success"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                    )}
                  >
                    {n.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : n.type === "success" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!n.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkRead(n.id)}
                      className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl cursor-pointer"
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(n.id)}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
