const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:8787";
for (const path of ["/", "/search", "/robots.txt", "/sitemap.xml"]) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  console.log(`${response.status} ${path}`);
}
console.log("Public Worker smoke checks passed. Authenticated, Neon image, and Neon rate-limit mutation flows need configured preview secrets.");
