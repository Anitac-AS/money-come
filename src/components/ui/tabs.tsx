import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>{children}</div>
  );
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-500",
        className
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  isActive?: boolean;
}

export function TabsTrigger({
  className,
  value,
  isActive,
  ...props
}: TabsTriggerProps) {
  return (
    <button
      type="button"
      data-value={value}
      className={cn(
        "inline-flex min-w-[64px] items-center justify-center rounded-full px-3 py-1.5 transition-colors",
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  activeValue: string;
}

export function TabsContent({
  className,
  value,
  activeValue,
  ...props
}: TabsContentProps) {
  if (value !== activeValue) return null;
  return <div className={className} {...props} />;
}

