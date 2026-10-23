import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";
import { getMonthlyReport, toCsv } from "../../../../../lib/reports.js";

export async function GET(request) {
  try {
    await requireUser(request, ["admin"]);
    const query = new URL(request.url).searchParams;
    const rows = await getMonthlyReport(await getDb(), { year: query.get("year"), month: query.get("month"), businessId: query.get("businessId") || null, status: query.get("status") || null });
    return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=borongan-report.csv" } });
  } catch { return Response.json({ error: "forbidden" }, { status: 403 }); }
}
