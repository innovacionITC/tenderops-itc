"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bell, Check, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

type NotificationRow = Awaited<ReturnType<typeof listNotifications>>[number];

function iconFor(type: string | null) {
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  if (type === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <Info className="h-4 w-4 text-sky-600" />;
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    let alive = true;
    const load = () => listNotifications().then((rows) => alive && setItems(rows));
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Notificaciones marcadas como leídas");
      router.refresh();
    });
  };

  const markOne = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1 text-muted-foreground hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-1rem))] overflow-hidden rounded-2xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold">Notificaciones</div>
            <button
              onClick={markAll}
              disabled={unread === 0 || isPending}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:no-underline disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Marcar todas
            </button>
          </div>
          <div className="max-h-96 divide-y overflow-y-auto">
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Sin notificaciones
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markOne(n.id)}
                className={`flex w-full gap-3 p-3 text-left transition hover:bg-muted/50 ${!n.isRead ? "bg-primary/5" : ""}`}
              >
                <div className="mt-0.5">{iconFor(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    {!n.isRead && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  )}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t p-2">
            <Link
              href="/calendario"
              onClick={() => setOpen(false)}
              className="block py-1 text-center text-xs text-primary hover:underline"
            >
              Ver calendario y tareas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
