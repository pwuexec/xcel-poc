export default function Footer() {
    return (
        <footer className="container mx-auto px-4 py-12 border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto">
                <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                    <p>&copy; {new Date().getFullYear()} Xceltutors. Made in the UK. Currently in Beta.</p>
                </div>
            </div>
        </footer>
    )
}