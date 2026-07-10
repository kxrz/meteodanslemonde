import { NextRequest, NextResponse } from "next/server"
import { loadSubs, saveSubs } from "@/lib/blob-subscriptions"

export async function POST(req: NextRequest) {
  const { subscription, cityId } = await req.json()
  if (!subscription?.endpoint || !cityId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const db = await loadSubs()
  db[subscription.endpoint] = { subscription, cityId }
  await saveSubs(db)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "invalid" }, { status: 400 })
  const db = await loadSubs()
  delete db[endpoint]
  await saveSubs(db)
  return NextResponse.json({ ok: true })
}
