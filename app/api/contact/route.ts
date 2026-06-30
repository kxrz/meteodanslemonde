import { NextRequest, NextResponse } from "next/server"

const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW = 60_000

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (!checkRate(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const contentLength = req.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > 8_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { name, email, message } = body as Record<string, unknown>

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof message !== "string" || !message.trim()
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  if (name.length > 200 || email.length > 200 || message.length > 5_000) {
    return NextResponse.json({ error: "Fields too long" }, { status: 400 })
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
      from: "contact@envrai.cestchaud.fr",
      to: "florent@leswww.com",
      reply_to: email,
      subject: `[CESTCHAUD] Message de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    console.error("[contact] Resend error", res.status, detail)
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
