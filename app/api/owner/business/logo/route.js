import { requireUser } from "../../../../../lib/permissions.js";
import { storeBusinessLogo } from "../../../../../lib/image-storage.js";

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") throw new Error("invalid_upload");
    return Response.json(await storeBusinessLogo({ file, ownerId: user.id }), { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    const status = ["invalid_upload", "invalid_image_type", "invalid_image_size", "image_too_large"].includes(code) ? 400 : code === "forbidden" ? 403 : code === "logo_migration_required" ? 503 : 500;
    return Response.json({ error: status === 500 ? "logo_upload_failed" : code }, { status });
  }
}
