import Link from "next/link";
import AuthForm from "../../../../components/owner/auth-form.jsx";

export default function OwnerSignInPage() { return <main className="mx-auto max-w-md px-5 py-16"><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Owner portal</p><h1 className="mt-3 text-3xl font-semibold">Sign in</h1><p className="mt-3 text-sm text-stone-600">Manage listings and reservation requests.</p><div className="mt-8"><AuthForm mode="sign-in" /></div><p className="mt-5 text-sm text-stone-600">New owner? <Link href="/owner/sign-up" className="text-emerald-800 underline">Create an account</Link></p></main>; }
