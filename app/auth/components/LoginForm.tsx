"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import GithubIcon from "@/components/icons/GithubIcon";
import GoogleIcon from "@/components/icons/GoogleIcon";

const authProviders = [
    {
        name: "Google",
        icon: GoogleIcon
    },
    {
        name: "GitHub",
        icon: GithubIcon
    },
]

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signUp" | "signIn">("signIn");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);
            formData.append("flow", step);

            if (step === "signUp") {
                formData.append("name", name);
            }

            await signIn("password", formData);
            router.push("/bookings");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">
                        {step === "signIn" ? "Login to your account" : "Create your account"}
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        {step === "signIn"
                            ? "Enter your email below to login to your account"
                            : "Enter your information to create an account"}
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {step === "signUp" && (
                    <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </Field>
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
                    />
                </Field>

                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        {step === "signIn" && (
                            <Link
                                href="/auth/forgot-password"
                                className="ml-auto text-sm underline-offset-4 hover:underline"
                            >
                                Forgot your password?
                            </Link>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Field>

                <Field>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? "Loading..."
                            : step === "signIn"
                                ? "Login"
                                : "Sign up"}
                    </Button>
                </Field>

                <FieldSeparator>Or continue with</FieldSeparator>

                <Field>
                    {authProviders.map((provider) => {
                        const Icon = provider.icon;
                        return (
                            <Button
                                key={provider.name}
                                variant="outline"
                                type="button"
                                onClick={() => void signIn(provider.name.toLowerCase())}
                            >
                                <Icon className="h-5 w-5" />
                                Login with {provider.name}
                            </Button>
                        );
                    })}
                    <FieldDescription className="text-center">
                        {step === "signIn" ? (
                            <>
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("signUp");
                                        setError("");
                                    }}
                                    className="underline underline-offset-4"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("signIn");
                                        setError("");
                                    }}
                                    className="underline underline-offset-4"
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
