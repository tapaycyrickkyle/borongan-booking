const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateKey(value) {
  if (typeof value !== "string") {
    throw new Error("invalid_date");
  }

  const match = value.match(ISO_DATE);
  if (!match) {
    throw new Error("invalid_date");
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error("invalid_date");
  }

  return date;
}

export function parseStayDates(checkIn, checkOut) {
  const start = parseDateKey(checkIn);
  const end = parseDateKey(checkOut);

  if (end <= start) {
    throw new Error("check_out_after_check_in");
  }

  const nightDates = [];
  for (let cursor = start.getTime(); cursor < end.getTime(); cursor += 86_400_000) {
    nightDates.push(new Date(cursor).toISOString().slice(0, 10));
  }

  return {
    checkIn,
    checkOut,
    nights: nightDates.length,
    nightDates,
  };
}

export function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd;
}
