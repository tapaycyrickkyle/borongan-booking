import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 lg:px-8">
          <Link href="/" className="text-base font-medium tracking-tight">Booking Borongan</Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
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
