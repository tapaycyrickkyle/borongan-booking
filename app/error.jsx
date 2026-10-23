"use client";

export default function ErrorPage({ reset }) {
  return <main className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-3xl font-semibold">Something went wrong</h1><p className="mt-3 text-stone-600">Please try again.</p><button onClick={reset} className="mt-6 border border-stone-900 px-4 py-2 text-sm font-semibold">Try again</button></main>;
}
