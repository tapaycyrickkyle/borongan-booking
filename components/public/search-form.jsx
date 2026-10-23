export default function SearchForm({ values = {} }) {
  return (
    <form action="/search" method="get" className="grid gap-4 border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm font-medium">Check-in<input name="checkIn" type="date" defaultValue={values.checkIn} className="mt-2 block min-h-10 w-full border border-stone-300 bg-white px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" /></label>
      <label className="text-sm font-medium">Check-out<input name="checkOut" type="date" defaultValue={values.checkOut} className="mt-2 block min-h-10 w-full border border-stone-300 bg-white px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" /></label>
      <label className="text-sm font-medium">Guests<input name="guestCount" type="number" min="1" max="50" defaultValue={values.guestCount || 1} className="mt-2 block min-h-10 w-full border border-stone-300 bg-white px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" /></label>
      <label className="text-sm font-medium">Type<select name="propertyType" defaultValue={values.propertyType || ""} className="mt-2 block min-h-10 w-full border border-stone-300 bg-white px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700"><option value="">Any type</option><option value="transient_house">Transient house</option><option value="apartment">Apartment</option><option value="room">Room</option></select></label>
      <button className="min-h-10 self-end bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2" type="submit">Search availability</button>
    </form>
  );
}
