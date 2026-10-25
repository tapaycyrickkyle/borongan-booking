"use client";

import { useState } from "react";

export default function BusinessLogoForm({ logoUrl, businessName }) {
  const [preview, setPreview] = useState(logoUrl);
  const [hasLogo, setHasLogo] = useState(Boolean(logoUrl));
  const [message, setMessage] = useState("");
  const initials = businessName.trim().split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase() || "BS";

  function choose(event) {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/owner/business/logo", { method: "POST", body: new FormData(event.currentTarget) });
    const body = await response.json();
    if (!response.ok) return setMessage(body.error === "image_too_large" ? "Logo must be 10 MB or smaller." : body.error === "logo_migration_required" ? "Apply database migration 0004 before uploading a logo." : "Could not save the logo.");
    setMessage("Logo saved.");
    setHasLogo(true);
    setPreview(`/api/images/${body.key}`);
    event.currentTarget.reset();
  }

  return <form onSubmit={submit} className="border border-stone-200 bg-white p-6"><div className="flex flex-wrap items-center gap-5"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white text-lg font-semibold text-stone-900">{preview ? <img src={preview} alt={`${businessName} logo preview`} className="h-full w-full object-contain" /> : initials}</div><div><label className="text-sm font-medium">Business logo<input required type="file" name="file" accept="image/jpeg,image/png,image/webp" onChange={choose} className="mt-2 block max-w-full text-sm font-normal" /></label><p className="mt-2 text-xs text-stone-500">PNG, JPG, or WebP up to 10 MB.</p></div></div><button className="mt-6 min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white" type="submit">{hasLogo ? "Replace logo" : "Upload logo"}</button>{message && <p role="status" className="mt-4 text-sm text-stone-700">{message}</p>}</form>;
}
