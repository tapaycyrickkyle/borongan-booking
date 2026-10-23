import { parseStayDates } from "./dates.js";

function includesDate(rate, date) {
  return rate.startsOn <= date && date < rate.endsOn;
}

export function resolveRateSnapshot({ nightDates, baseRates, specialRates }) {
  const nights = nightDates.map((date) => {
    const special = specialRates
      .filter((rate) => includesDate(rate, date))
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))[0];
    const base = baseRates
      .filter((rate) => includesDate(rate, date))
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))[0];
    const selected = special ?? base;
    if (!selected) throw new Error(`missing_rate:${date}`);
    return {
      date,
      amountCentavos: selected.amountCentavos,
      source: special ? "special" : "base",
      ...(special?.label ? { label: special.label } : {}),
    };
  });

  return {
    currency: "PHP",
    nights,
    totalCentavos: nights.reduce((total, night) => total + night.amountCentavos, 0),
  };
}

export async function resolveReservationPrice(db, { unitId, checkIn, checkOut }) {
  const { nightDates } = parseStayDates(checkIn, checkOut);
  const [baseResult, specialResult] = await Promise.all([
    db.prepare("SELECT starts_on AS startsOn, ends_on AS endsOn, amount_centavos AS amountCentavos, created_at AS createdAt FROM nightly_rates WHERE unit_id = ? AND ends_on > ? AND starts_on < ?").bind(unitId, checkIn, checkOut).all(),
    db.prepare("SELECT starts_on AS startsOn, ends_on AS endsOn, amount_centavos AS amountCentavos, label, created_at AS createdAt FROM special_rates WHERE unit_id = ? AND ends_on > ? AND starts_on < ?").bind(unitId, checkIn, checkOut).all(),
  ]);
  return resolveRateSnapshot({
    nightDates,
    baseRates: baseResult.results ?? [],
    specialRates: specialResult.results ?? [],
  });
}
