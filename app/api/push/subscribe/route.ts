import { NextRequest, NextResponse } from "next/server"
import { loadSubs, saveSubs } from "@/lib/blob-subscriptions"

export async function POST(req: NextRequest) {
  const { subscription, cityId } = await req.json()
  if (!subscription?.endpoint || !cityId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  try {
    const db = await loadSubs()
    db[subscription.endpoint] = { subscription, cityId }
    await saveSubs(db)
    return NextResponse.json({ ok: true, count: Object.keys(db).length })
  } catch (err) {
    console.error("[push/subscribe]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "invalid" }, { status: 400 })
  try {
    const db = await loadSubs()
    delete db[endpoint]
    await saveSubs(db)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
