import { cn } from "@/lib/utils"
import React from "react"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--color-surface-3)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
