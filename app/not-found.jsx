import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-3xl font-semibold">Page not found</h1><p className="mt-3 text-stone-600">The listing or reservation link may no longer be available.</p><Link href="/search" className="mt-6 inline-flex border border-stone-900 px-4 py-2 text-sm font-semibold">Search stays</Link></main>;
}
