import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight">Borongan Stays</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/search" className="text-stone-600 hover:text-stone-950">Search stays</Link>
            <Link href="/owner/sign-in" className="border border-stone-300 px-4 py-2 font-medium hover:bg-stone-50">Owner sign in</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-stone-500 lg:px-8">Borongan City, Eastern Samar · Reservation requests only</div>
      </footer>
    </div>
  );
}
