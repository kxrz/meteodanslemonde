import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const event = body as { type?: string; data?: { contact?: { email?: string } } }

  if (event.type === "contact.unsubscribed" && event.data?.contact?.email) {
    const sql = getSql()
    const email = event.data.contact.email.toLowerCase()
    await sql`UPDATE subscribers SET confirmed_at = NULL WHERE email = ${email}`
  }

  return NextResponse.json({ ok: true })
}
