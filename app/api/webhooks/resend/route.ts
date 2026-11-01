import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifySvixSignature } from "@/lib/webhook-signature"

// Webhook Resend : désinscription faite depuis Resend (lien de l'email, plainte…).
// Chaque requête doit être signée avec RESEND_WEBHOOK_SECRET (Resend → Webhooks → Signing secret) :
// sans ce secret, on refuse tout, plutôt que de laisser n'importe qui désabonner une adresse.
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error("[webhook resend] RESEND_WEBHOOK_SECRET absent : requête refusée")
    return NextResponse.json({ error: "webhook non configuré" }, { status: 503 })
  }

  // La signature porte sur le corps brut : on le lit en texte avant de le parser
  const raw = await req.text()
  const check = verifySvixSignature(raw, {
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
  }, secret)
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 })

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
