import { getDb } from "../../../../lib/db.js";
import { requireUser } from "../../../../lib/permissions.js";
import { storeImage } from "../../../../lib/r2.js";

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const form = await request.formData();
    const file = form.get("file");
    const propertyId = form.get("propertyId");
    const unitId = form.get("unitId") || null;
    if (!file || typeof file.arrayBuffer !== "function" || typeof propertyId !== "string") throw new Error("invalid_upload");
    return Response.json(await storeImage({ file, ownerId: user.id, propertyId, unitId }), { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    const status = ["invalid_upload", "invalid_image_type", "invalid_image_size", "image_too_large", "image_limit_reached"].includes(code) ? 400 : code === "forbidden" ? 403 : 500;
    return Response.json({ error: status === 500 ? "upload_failed" : code }, { status });
  }
}
