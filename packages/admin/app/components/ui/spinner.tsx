import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import { Loader, LoaderCircle } from "lucide-react";
import type { ComponentRef } from "react";
import { forwardRef } from "react";

const Spinner = forwardRef<
  ComponentRef<typeof Loader>,
  Omit<LucideProps, "ref">
>(({ className, ...props }, ref) => (
  <LoaderCircle
    ref={ref}
    className={cn(className, "animate-spin")}
    {...props}
  />
));

Spinner.displayName = Loader.displayName;

export { Spinner };
