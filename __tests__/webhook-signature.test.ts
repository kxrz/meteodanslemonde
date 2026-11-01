import { describe, it, expect } from "vitest"
import { createHmac } from "crypto"
import { verifySvixSignature } from "@/lib/webhook-signature"

const rawKey = Buffer.from("cle-de-test-du-webhook-resend-32o")
const secret = `whsec_${rawKey.toString("base64")}`
const now = 1_793_500_000
const body = JSON.stringify({ type: "contact.unsubscribed", data: { contact: { email: "a@b.fr" } } })

function sign(id: string, ts: number, payload: string, key = rawKey) {
  return `v1,${createHmac("sha256", key).update(`${id}.${ts}.${payload}`).digest("base64")}`
}

describe("signature des webhooks Resend (Svix)", () => {
  it("accepte une signature valide", () => {
    const r = verifySvixSignature(body, { id: "msg_1", timestamp: String(now), signature: sign("msg_1", now, body) }, secret, now)
    expect(r.ok).toBe(true)
  })
  it("accepte si l'une des signatures (rotation de secret) est valide", () => {
    const sig = `v1,AAAA ${sign("msg_1", now, body)}`
    expect(verifySvixSignature(body, { id: "msg_1", timestamp: String(now), signature: sig }, secret, now).ok).toBe(true)
  })
  it("refuse un corps modifié", () => {
    const r = verifySvixSignature(body.replace("a@b.fr", "victime@x.fr"), { id: "msg_1", timestamp: String(now), signature: sign("msg_1", now, body) }, secret, now)
    expect(r).toEqual({ ok: false, reason: "signature invalide" })
  })
  it("refuse un autre secret", () => {
    const r = verifySvixSignature(body, { id: "msg_1", timestamp: String(now), signature: sign("msg_1", now, body, Buffer.from("autre")) }, secret, now)
    expect(r.ok).toBe(false)
  })
  it("refuse une requête rejouée trop tard", () => {
    const old = now - 3600
    const r = verifySvixSignature(body, { id: "msg_1", timestamp: String(old), signature: sign("msg_1", old, body) }, secret, now)
    expect(r).toEqual({ ok: false, reason: "horodatage hors délai" })
  })
  it("refuse sans en-têtes", () => {
    expect(verifySvixSignature(body, { id: null, timestamp: null, signature: null }, secret, now).ok).toBe(false)
  })
})
