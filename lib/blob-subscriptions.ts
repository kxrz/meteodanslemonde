import { put, list, getDownloadUrl } from "@vercel/blob"

const PATHNAME = "push-subscriptions.json"

export type SubStore = Record<string, { subscription: PushSubscriptionJSON; cityId: string }>

export async function loadSubs(): Promise<SubStore> {
  try {
    const { blobs } = await list({ prefix: PATHNAME })
    const blob = blobs.find((b) => b.pathname === PATHNAME)
    if (!blob) return {}
    const signedUrl = await getDownloadUrl(blob.url)
    const res = await fetch(signedUrl, { cache: "no-store" })
    return await res.json()
  } catch { return {} }
}

export async function saveSubs(db: SubStore) {
  await put(PATHNAME, JSON.stringify(db), { access: "private", addRandomSuffix: false })
}
