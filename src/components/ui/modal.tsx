"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col gap-0 sm:max-w-lg overflow-hidden",
          className
        )}
      >
        <DialogHeader className="p-0 border-b border-slate-100 pb-3 text-left shrink-0">
          <DialogTitle className="font-display text-lg font-semibold text-slate-900 leading-tight">
            {title}
          </DialogTitle>
          {subtitle && (
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-normal">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="pt-3 flex-1 overflow-y-auto min-h-0 pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

