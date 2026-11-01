import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifySvixSignature } from "@/lib/webhook-signature"

// Webhook Resend : désinscription faite depuis Resend (lien de l'email, plainte…).
// Signature : facultative tant que RESEND_WEBHOOK_SECRET n'est pas défini (Resend → Webhooks → Signing secret).
// Dès que la variable existe, toute requête non signée ou mal signée est refusée.
// Sans elle, n'importe qui connaissant l'URL peut simuler une désinscription : à activer quand possible.
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  // La signature porte sur le corps brut : on le lit en texte avant de le parser
  const raw = await req.text()
  if (secret) {
    const check = verifySvixSignature(raw, {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    }, secret)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 })
  }

  let event: { type?: string; data?: { contact?: { email?: string }; email?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  if (event.type === "contact.unsubscribed" && event.data?.contact?.email) {
    const sql = getSql()
    const email = event.data.contact.email.toLowerCase()
    await sql`UPDATE subscribers SET confirmed_at = NULL WHERE email = ${email}`
  }

  return NextResponse.json({ ok: true })
}
