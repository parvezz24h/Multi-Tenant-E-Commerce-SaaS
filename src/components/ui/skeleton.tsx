import { cn } from "cn"

/**
 * Loading placeholder with a shimmer sweep. The sweep is disabled for users
 * who prefer reduced motion.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
        "dark:before:via-white/10 motion-reduce:before:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
