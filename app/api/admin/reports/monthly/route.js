import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";
import { getMonthlyReport } from "../../../../../lib/reports.js";

export async function GET(request) {
  try {
    await requireUser(request, ["admin"]);
    const query = new URL(request.url).searchParams;
    const rows = await getMonthlyReport(await getDb(), { year: query.get("year"), month: query.get("month"), businessId: query.get("businessId") || null, status: query.get("status") || null });
    return Response.json({ rows });
  } catch { return Response.json({ error: "forbidden" }, { status: 403 }); }
}
