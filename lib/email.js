import { getRequiredSecret } from "./env.js";

export async function sendEmail({ to, subject, html }) {
  const apiKey = await getRequiredSecret("RESEND_API_KEY");
  const from = await getRequiredSecret("EMAIL_FROM");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`email_delivery_failed:${response.status}`);
  return response.json();
}
