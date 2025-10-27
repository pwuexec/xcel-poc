import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Footer from "../_components/Footer";
import LinkedinIcon from "@/components/icons/LinkedinIcon";

export const metadata: Metadata = {
    title: "About",
    description: "A tiny intro to XcelTutors and the people behind it.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
            {/* Hero Section */}
            <section className="container mx-auto max-w-4xl px-4 py-20 md:py-28">
                <div className="text-center space-y-6">
                    <Badge variant="outline" className="border-primary text-primary">About</Badge>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
                        XcelTutors
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        A small team building simple tools for better tutoring.
                    </p>
                </div>
            </section>

            <Separator className="my-12" />

            {/* Team Section */}
            <section className="container mx-auto max-w-4xl px-4 py-20">
                <div className="space-y-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-12">
                        Meet Our Team
                    </h2>
                    <div className="space-y-8">
                        <Item>
                            <ItemMedia>
                                <div className="size-32 overflow-hidden rounded-md border">
                                    <Image
                                        src="/images/founders/joao_florido.webp"
                                        alt="João Florido"
                                        width={128}
                                        height={128}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </ItemMedia>
                            <ItemContent>
                                <div className="flex items-center gap-2">
                                    <ItemTitle className="text-2xl">João Florido</ItemTitle>
                                    <Link
                                        href="https://www.linkedin.com/in/joao-florido-13219427a/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <LinkedinIcon className="size-5" />
                                    </Link>
                                </div>
                                <p className="text-base text-muted-foreground font-medium">CEO & Co‑Founder</p>
                                <p className="text-base text-muted-foreground">
                                    João's experience in Scottish classrooms shaped his vision for personalised learning. His dream is to create a platform where students can explore complex ideas at their own pace with the right support at the right time.
                                </p>
                            </ItemContent>
                        </Item>

                        <Item>
                            <ItemMedia>
                                <div className="size-32 grid place-items-center rounded-md border bg-muted text-muted-foreground font-medium text-3xl">
                                    EC
                                </div>
                            </ItemMedia>
                            <ItemContent>
                                <div className="flex items-center gap-2">
                                    <ItemTitle className="text-2xl">Eduardo Carvalho</ItemTitle>
                                    <Link
                                        href="https://www.linkedin.com/in/whyeduardo/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <LinkedinIcon className="size-5" />
                                    </Link>
                                </div>
                                <p className="text-base text-muted-foreground font-medium">CTO & Co‑Founder</p>
                                <p className="text-base text-muted-foreground">
                                    Eduardo's work at Farfetch taught him the power of scalable, user-centric design. At XcelTutors, he's applying those lessons to create an intuitive platform that can adapt to the needs of students and tutors alike.
                                </p>
                            </ItemContent>
                        </Item>

                        <Item>
                            <ItemMedia>
                                <div className="size-32 overflow-hidden rounded-md border">
                                    <Image
                                        src="/images/founders/noah.webp"
                                        alt="Noah Rijshouwer"
                                        width={128}
                                        height={128}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </ItemMedia>
                            <ItemContent>
                                <div className="flex items-center gap-2">
                                    <ItemTitle className="text-2xl">Noah Rijshouwer</ItemTitle>
                                    <Link
                                        href="https://www.linkedin.com/in/noah-rijshouwer-074161192/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <LinkedinIcon className="size-5" />
                                    </Link>
                                </div>
                                <p className="text-base text-muted-foreground font-medium">Business Analyst</p>
                                <p className="text-base text-muted-foreground">
                                    Noah's background in innovative business IT drives XcelTutor's expansion strategy. He is focused on building partnerships and refining their marketing approach to reach students who can benefit most from their platform
                                </p>
                            </ItemContent>
                        </Item>
                    </div>
                </div>
            </section>

            <Separator className="my-12" />

            {/* Mission Section */}
            <section className="container mx-auto max-w-4xl px-4 py-20">
                <div className="text-center space-y-6">
                    <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                        Quality education shouldn't break the bank. We're UK educators building a platform that makes expert tutoring accessible and affordable for every student.
                    </p>
                    <div className="pt-6">
                        <Button asChild variant="default" size="lg">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
