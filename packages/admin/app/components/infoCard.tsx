import { cn } from "@/lib/utils";
import React from "react";
import { Skeleton } from "./ui/skeleton";

export interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  isLoading: boolean;
}

export default function InfoCard({
  className,
  title,
  value,
  isLoading,
  ...props
}: InfoCardProps) {
  return (
    <div
      className={cn("border border-border rounded-xl p-6", className)}
      {...props}
    >
      <h3 className="text-xs text-muted-foreground">{title}</h3>
      {isLoading ? (
        <Skeleton className="h-[2.25rem] w-16" />
      ) : (
        <p className="text-lg sm:text-3xl font-bold leading-none">{value}</p>
      )}
    </div>
  );
}
