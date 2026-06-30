import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error("RESEND_API_KEY manquant")
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 })
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "cestchaud.fr <contact@cestchaud.fr>",
        to: ["florent@leswww.com"],
        reply_to: email,
        subject: `Message de ${name} via cestchaud.fr`,
        html: `<p><strong>Nom :</strong> ${name}</p><p><strong>Email :</strong> ${email}</p><p><strong>Message :</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend error:", err)
      return NextResponse.json({ error: "Erreur d'envoi" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Contact API:", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
