import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const FILE = join(process.cwd(), "data/subscriptions.json")

function load(): Record<string, { subscription: PushSubscriptionJSON; cityId: string }> {
  try { return JSON.parse(readFileSync(FILE, "utf8")) } catch { return {} }
}

export async function POST(req: NextRequest) {
  const { subscription, cityId } = await req.json()
  if (!subscription?.endpoint || !cityId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const db = load()
  const key = subscription.endpoint as string
  db[key] = { subscription, cityId }
  writeFileSync(FILE, JSON.stringify(db, null, 2))
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "invalid" }, { status: 400 })
  const db = load()
  delete db[endpoint]
  writeFileSync(FILE, JSON.stringify(db, null, 2))
  return NextResponse.json({ ok: true })
}
