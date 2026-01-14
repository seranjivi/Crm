import * as React from "react"
import { cva } from "class-variance-authority"

const Skeleton = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cva("animate-pulse bg-gray-200 rounded-md", className)}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }
