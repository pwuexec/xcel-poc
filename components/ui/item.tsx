import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const itemVariants = cva(
    "flex items-center gap-3 rounded-[--radius] p-4",
    {
        variants: {
            variant: {
                default: "bg-background",
                muted: "bg-muted",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Item = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(itemVariants({ variant }), className)}
        {...props}
    />
))
Item.displayName = "Item"

const ItemMedia = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex-none", className)}
        {...props}
    />
))
ItemMedia.displayName = "ItemMedia"

const ItemContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
        {...props}
    />
))
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-medium leading-none", className)}
        {...props}
    />
))
ItemTitle.displayName = "ItemTitle"

export { Item, ItemMedia, ItemContent, ItemTitle, itemVariants }
