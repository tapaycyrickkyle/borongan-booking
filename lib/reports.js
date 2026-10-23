function manilaParts(value) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function checkoutPeriodKey(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  const parts = manilaParts(value);
  return `${parts.year}-${parts.month}`;
}

export function toCsv(rows) {
  const escape = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
  const lines = ["Business,Property,Status,Count"];
  for (const row of rows) lines.push([row.businessName, row.propertyTitle, row.status, row.count].map((value, index) => index === 2 || index === 3 ? String(value ?? "") : escape(value)).join(","));
  return `${lines.join("\n")}\n`;
}

export async function getMonthlyReport(db, { year, month, businessId = null, status = null }) {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (!Number.isInteger(numericYear) || numericYear < 2020 || !Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) throw new Error("invalid_report_period");
  const start = `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(numericYear, numericMonth, 1));
  const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const params = [start, end];
  const conditions = ["r.check_out >= ?", "r.check_out < ?"];
  if (businessId) { conditions.push("b.id = ?"); params.push(businessId); }
  if (status) { conditions.push("r.status = ?"); params.push(status); }
  const result = await db.prepare(`SELECT b.id AS business_id, b.name AS businessName, p.id AS property_id, p.title AS propertyTitle, r.status, COUNT(DISTINCT r.id) AS count
    FROM reservations r JOIN properties p ON p.id = r.property_id JOIN businesses b ON b.id = p.business_id
    WHERE ${conditions.join(" AND ")}
    GROUP BY b.id, b.name, p.id, p.title, r.status ORDER BY b.name, p.title, r.status`).bind(...params).all();
  return result.results ?? [];
}
