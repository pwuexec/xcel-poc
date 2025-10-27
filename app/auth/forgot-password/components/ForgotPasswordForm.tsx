"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const { signIn } = useAuthActions();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("flow", "reset");

            await signIn("password", formData);
            setSuccess(true);
            setEmail("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Forgot your password?</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email address and we&apos;ll send you a link to reset your password
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-lg bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                        Check your email! We&apos;ve sent you a password reset link.
                    </div>
                )}

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        autoFocus
                        required
                        disabled={isLoading}
                    />
                </Field>

                <Field>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Sending..." : "Send reset link"}
                    </Button>
                </Field>

                <FieldDescription className="text-center">
                    <Link
                        href="/auth"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Back to login
                    </Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    );
}
