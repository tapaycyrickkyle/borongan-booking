import { readImage } from "../../../../lib/r2.js";
import { requireUser } from "../../../../lib/permissions.js";

export async function GET(request, context) {
  const { key } = await context.params;
  const objectKey = Array.isArray(key) ? key.join("/") : key;
  try {
    const publicResponse = await readImage({ key: objectKey });
    if (publicResponse.status !== 404) return publicResponse;
    const viewer = await requireUser(request, ["owner", "admin"]);
    return await readImage({ key: objectKey, viewer });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
