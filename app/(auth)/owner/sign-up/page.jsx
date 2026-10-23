import Link from "next/link";
import AuthForm from "../../../../components/owner/auth-form.jsx";

export default function OwnerSignUpPage() { return <main className="mx-auto max-w-md px-5 py-16"><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Owner portal</p><h1 className="mt-3 text-3xl font-semibold">Create an owner account</h1><p className="mt-3 text-sm text-stone-600">Email verification is required before managing a property.</p><div className="mt-8"><AuthForm mode="sign-up" /></div><p className="mt-5 text-sm text-stone-600">Already registered? <Link href="/owner/sign-in" className="text-emerald-800 underline">Sign in</Link></p></main>; }
