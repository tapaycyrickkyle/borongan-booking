import Link from "next/link";

const highlights = [
  ["01", "Browse local stays", "Compare accommodation types, dates, capacity, and nightly rates."],
  ["02", "Request your dates", "Send your details directly to the accommodation owner."],
  ["03", "Wait for approval", "Your reservation is confirmed only after the owner approves it."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Borongan Stays
          </Link>
          <a
            href="/owner/sign-in"
            className="inline-flex min-h-10 items-center justify-center border border-stone-300 px-4 text-sm font-medium hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            Owner sign in
          </a>
        </div>
      </header>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
              Borongan City · Eastern Samar
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Find a stay that fits your plans.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
              Browse local rooms, apartments, transient houses, and entire properties. Request a reservation directly—no online payment required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/search"
                className="inline-flex min-h-11 items-center justify-center bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              >
                Search accommodations
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-h-11 items-center justify-center border border-stone-300 px-5 text-sm font-semibold hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
              >
                How reservations work
              </a>
            </div>
          </div>

          <div className="border border-stone-200 bg-stone-50 p-6 sm:p-8">
            <p className="text-sm font-semibold text-stone-900">Plan your stay</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Search availability first, then send a reservation request to the owner of the place you choose.
            </p>
            <a
              href="/search"
              className="mt-6 inline-flex min-h-10 items-center justify-center border border-stone-900 bg-white px-4 text-sm font-medium hover:bg-stone-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
            >
              Start a search
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-px border border-stone-200 bg-stone-200 sm:grid-cols-3">
          {highlights.map(([number, title, description]) => (
            <article key={number} className="bg-white p-6 sm:p-7">
              <p className="font-mono text-sm text-emerald-700">{number}</p>
              <h2 className="mt-10 text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
