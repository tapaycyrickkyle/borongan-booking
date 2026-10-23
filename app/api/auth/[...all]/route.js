import { toNextJsHandler } from "better-auth/next-js";
import { createAuth } from "../../../../lib/auth.js";

async function getHandler() {
  return toNextJsHandler(await createAuth());
}

export async function GET(request) {
  return (await getHandler()).GET(request);
}

export async function POST(request) {
  return (await getHandler()).POST(request);
}
