import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
          Welcome to Xcel
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Your tutoring marketplace powered by real tutors
        </p>
        <div className="mt-8">
          <Link
            href="/bookings"
            className="inline-block px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
