import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

const InputGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("relative flex w-full items-center", className)}
            {...props}
        />
    )
})
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    return (
        <Input
            ref={ref}
            className={cn("peer flex-1", className)}
            {...props}
        />
    )
})
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
    return (
        <Textarea
            ref={ref}
            className={cn("peer flex-1 resize-none", className)}
            {...props}
        />
    )
})
InputGroupTextarea.displayName = "InputGroupTextarea"

const inputGroupAddonVariants = cva(
    "pointer-events-none absolute flex items-center gap-1 text-muted-foreground",
    {
        variants: {
            align: {
                start: "left-3 top-1/2 -translate-y-1/2",
                end: "right-3 top-1/2 -translate-y-1/2",
                "inline-start": "left-3 top-1/2 -translate-y-1/2",
                "inline-end": "right-3 top-1/2 -translate-y-1/2",
                "block-start": "left-3 top-3",
                "block-end": "bottom-3 right-3",
            },
        },
        defaultVariants: {
            align: "start",
        },
    }
)

const InputGroupAddon = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof inputGroupAddonVariants>
>(({ className, align, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(inputGroupAddonVariants({ align }), className)}
            {...props}
        />
    )
})
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupText = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn("text-sm pointer-events-auto", className)}
            {...props}
        />
    )
})
InputGroupText.displayName = "InputGroupText"

const InputGroupButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size }),
                "pointer-events-auto",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
InputGroupButton.displayName = "InputGroupButton"

export {
    InputGroup,
    InputGroupInput,
    InputGroupTextarea,
    InputGroupAddon,
    InputGroupText,
    InputGroupButton,
}
