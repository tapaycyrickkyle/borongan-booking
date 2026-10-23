import PropertyForm from "../../../../components/owner/property-form.jsx";

export default function NewPropertyPage() { return <section className="max-w-4xl"><h1 className="text-3xl font-semibold">Add a property</h1><p className="mt-3 text-stone-600">Start with a draft. Add at least one unit, rate, and image before submitting for review.</p><div className="mt-8"><PropertyForm /></div></section>; }
