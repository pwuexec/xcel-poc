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
import { 
    Sparkles, 
    MessageSquare, 
    Send, 
    GraduationCap, 
    CheckCircle2, 
    Calendar,
    Heart,
    Users,
    BookOpen,
    Star,
    Clock,
    Shield,
    Zap,
    Award
} from "lucide-react";
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
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-white dark:from-primary/10 dark:to-neutral-950">
                <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                            Online tutoring built by educators, for students
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            Quality UK-based tutors at affordable rates. Start with a free introductory meeting.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button size="lg" asChild className="text-base px-8 py-6 h-auto font-semibold">
                                <Link href="/bookings">Find a tutor</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-base px-8 py-6 h-auto font-semibold border-2">
                                <DynamicSignInLink preloadedCurrentUser={preloadedCurrentUser} />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Free Introductory Meeting Section */}
            <section className="bg-primary/5 dark:bg-primary/10 py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center space-y-6 mb-12">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100">
                                Free introductory meeting
                            </h2>
                            <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                                We believe in the right match. That's why your first meeting is completely free — 
                                no fees, no pressure, just a chat with your tutor to plan your learning journey.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white dark:bg-neutral-900 rounded-lg p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                    No payment required
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Your first session is completely free. Experience quality tutoring with zero financial commitment.
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-neutral-900 rounded-lg p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Heart className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                    No pressure
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    A friendly conversation to get to know your tutor and see if we're the right fit for your learning style.
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-neutral-900 rounded-lg p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                    Plan your journey
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Work together to create a personalised roadmap for your academic success and goals.
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <Button size="lg" asChild className="text-base px-10 py-6 h-auto font-semibold">
                                <Link href="/bookings">
                                    Book your free meeting
                                </Link>
                            </Button>
                            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-4">
                                No credit card required
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-16 md:py-20 bg-white dark:bg-neutral-950">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                                Why choose Xceltutors?
                            </h2>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                                Built by educators who understand what students need to succeed
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    Expert tutors
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    UK-based educators passionate about helping you achieve your academic goals
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    Affordable rates
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Low tutor fees mean quality tutoring accessible to everyone
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    Flexible schedule
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Book sessions that fit your lifestyle and study routine
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Award className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    Personalised learning
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Tailored approach designed around your unique learning needs
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About and Contact Section */}
            <section className="py-16 md:py-20 bg-neutral-50 dark:bg-neutral-900">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
                        {/* About */}
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                                Built by educators, for students
                            </h2>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                Xceltutors was created by two young UK educators with a simple mission: make high-quality tutoring accessible to every student. 
                                Our platform keeps fees low for tutors, which means affordable, excellent education for you.
                            </p>
                            <div className="pt-2">
                                <Button variant="outline" asChild className="font-semibold border-2">
                                    <Link href="/about">
                                        Learn more about us
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <Card className="shadow-lg border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                            <CardHeader>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl text-neutral-900 dark:text-neutral-100">Get in touch</CardTitle>
                                    <CardDescription className="text-base text-neutral-600 dark:text-neutral-400">
                                        We'd love to hear from you
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input 
                                        placeholder="Your name" 
                                        className="h-11" 
                                    />
                                    <Input 
                                        type="email" 
                                        placeholder="Email" 
                                        className="h-11" 
                                    />
                                </div>
                                <InputGroup>
                                    <InputGroupTextarea
                                        placeholder="Tell us what's on your mind..."
                                        className="min-h-[120px] pr-12"
                                    />
                                    <InputGroupAddon align="block-end">
                                        <InputGroupButton
                                            variant="default"
                                            className="rounded-full"
                                            size="icon-sm"
                                        >
                                            <Send className="h-4 w-4" />
                                            <span className="sr-only">Send</span>
                                        </InputGroupButton>
                                    </InputGroupAddon>
                                </InputGroup>
                                <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                    We typically respond within 24 hours
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
