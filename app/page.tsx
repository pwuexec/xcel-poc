import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupTextarea,
    InputGroupAddon,
    InputGroupButton
} from "@/components/ui/input-group";
import { Sparkles, MessageSquare, Send } from "lucide-react";
import Footer from "./_components/Footer";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import DynamicSignInLink from "./_components/DynamicSignInButton";

export default async function Home() {
    const preloadedCurrentUser = await preloadQuery(
        api.schemas.users.getMe,
        {},
        { token: await convexAuthNextjsToken() })

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-28">
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-3">
                        <Badge variant="outline" className="mb-4 border-primary text-primary">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Beta Access
                        </Badge>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
                        Excel in Your Studies with Xceltutors
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        UK-based online tutoring platform built by educators, for students.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                        <Button size="lg" asChild className="text-lg px-8">
                            <Link href="/bookings">Join the Beta</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="text-lg px-8">
                            <DynamicSignInLink preloadedCurrentUser={preloadedCurrentUser} />
                        </Button>
                    </div>
                </div>
            </section>

            <Separator className="my-12" />

            {/* About and Contact Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
                    {/* About */}
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                            Built by Educators, For Students
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Created by two young UK educators. Low tutor fees mean affordable, quality tutoring for everyone.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/about">Learn More About Us</Link>
                        </Button>
                    </div>

                    {/* Contact Card */}
                    <Card className="shadow-lg bg-primary border-primary">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary-foreground" />
                                <CardTitle className="text-xl text-primary-foreground">Feel Free to Reach Us</CardTitle>
                            </div>
                            <CardDescription className="text-primary-foreground/80">
                                We're more than welcome to speak with you!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Your name" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
                                <Input type="email" placeholder="Email" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
                            </div>
                            <InputGroup>
                                <InputGroupTextarea
                                    placeholder="Tell us what's on your mind..."
                                    className="min-h-[120px] pr-12 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                                />
                                <InputGroupAddon align="block-end">
                                    <InputGroupButton
                                        variant="secondary"
                                        className="rounded-full"
                                        size="icon-sm"
                                    >
                                        <Send className="h-4 w-4" />
                                        <span className="sr-only">Send</span>
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Footer />
        </div>
    );
}
