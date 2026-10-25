"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === "sign-up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "sign-up" ? { name: data.name, email: data.email, password: data.password } : { email: data.email, password: data.password }) });
    if (!response.ok) return setMessage(mode === "sign-up" ? "Account creation failed. Check your details." : "Sign-in failed. Check your email and password.");
    router.push("/owner");
    router.refresh();
  }
  return <form onSubmit={submit} className="border border-stone-200 bg-white p-6"><div className="grid gap-4">{mode === "sign-up" && <label className="text-sm font-medium">Name<input required name="name" autoComplete="name" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>}<label className="text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label><label className="text-sm font-medium">Password<input required type="password" name="password" minLength="8" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label></div><button className="mt-6 min-h-11 bg-emerald-700 px-5 text-sm font-semibold text-white" type="submit">{mode === "sign-up" ? "Create owner account" : "Sign in"}</button>{message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}</form>;
}
