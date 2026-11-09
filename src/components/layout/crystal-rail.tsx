"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "./nav-config";

const COLLAPSED = "4.25rem";
const EXPANDED = "16.25rem";

export function CrystalRail({
  items,
  pathname,
  onNavigate,
  logo,
  footer,
}: {
  items: MenuItem[];
  pathname: string;
  onNavigate: (href: string) => void;
  logo: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const labelId = useId();
  const railRef = useRef<HTMLElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [hoverCapable, setHoverCapable] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);

  const open = hoverCapable ? expanded : touchOpen;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverCapable(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        setTouchOpen(false);
        railRef.current?.querySelector<HTMLElement>("button")?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const scheduleOpen = () => {
    if (!hoverCapable) return;
    clearTimers();
    openTimer.current = window.setTimeout(() => setExpanded(true), 90);
  };

  const scheduleClose = () => {
    if (!hoverCapable) return;
    clearTimers();
    closeTimer.current = window.setTimeout(() => setExpanded(false), 160);
  };

  return (
    <>
      {!hoverCapable && (
        <button
          type="button"
          className="crystal-fab"
          aria-expanded={touchOpen}
          aria-controls={labelId}
          onClick={() => setTouchOpen((value) => !value)}
        >
          {touchOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{touchOpen ? "Cerrar menú" : "Abrir menú"}</span>
        </button>
      )}

      {!hoverCapable && touchOpen && (
        <button
          type="button"
          className="crystal-rail-scrim"
          aria-label="Cerrar menú"
          onClick={() => setTouchOpen(false)}
        />
      )}

      <nav
        ref={railRef}
        id={labelId}
        aria-label="Navegación principal"
        data-expanded={open}
        data-touch={hoverCapable ? undefined : "true"}
        className={cn("crystal-rail", !hoverCapable && !touchOpen && "crystal-rail-hidden")}
        style={{ width: open ? EXPANDED : COLLAPSED }}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocusCapture={scheduleOpen}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
      >
        <div className={cn("crystal-rail-brand", open && "crystal-rail-brand-open")}>{logo}</div>
        <ul className="crystal-rail-list">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  type="button"
                  disabled={item.comingSoon}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className="crystal-rail-item"
                  data-active={active || undefined}
                  onClick={() => {
                    if (item.comingSoon) return;
                    onNavigate(item.href);
                    if (!hoverCapable) setTouchOpen(false);
                  }}
                >
                  <span className="crystal-rail-label">
                    {item.label}
                    {item.comingSoon && <span className="crystal-rail-soon">Pronto</span>}
                  </span>
                  <Icon className="size-[1.15rem] shrink-0" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        {footer && <div className="crystal-rail-footer">{footer}</div>}
      </nav>
    </>
  );
}
