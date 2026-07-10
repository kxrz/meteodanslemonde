import { NextRequest, NextResponse } from "next/server"
import { put, head, del } from "@vercel/blob"

const BLOB_KEY = "push-subscriptions.json"

type SubStore = Record<string, { subscription: PushSubscriptionJSON; cityId: string }>

async function load(): Promise<SubStore> {
  try {
    const existing = await head(BLOB_KEY).catch(() => null)
    if (!existing) return {}
    const res = await fetch(existing.url)
    return await res.json()
  } catch { return {} }
}

async function save(db: SubStore) {
  await put(BLOB_KEY, JSON.stringify(db), { access: "public", addRandomSuffix: false })
}

export async function POST(req: NextRequest) {
  const { subscription, cityId } = await req.json()
  if (!subscription?.endpoint || !cityId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  const db = await load()
  db[subscription.endpoint] = { subscription, cityId }
  await save(db)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "invalid" }, { status: 400 })
  const db = await load()
  delete db[endpoint]
  await save(db)
  return NextResponse.json({ ok: true })
}
