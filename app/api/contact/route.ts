import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "No API key" }, { status: 500 })
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "contact@cestchaud.fr",
      to: "florent@leswww.com",
      reply_to: email,
      subject: `[cestchaud.fr] Message de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
