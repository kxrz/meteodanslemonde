import { createHmac, timingSafeEqual } from "crypto"

// Vérification des webhooks Resend (format Svix) :
//   contenu signé = `${svix-id}.${svix-timestamp}.${corps brut}`
//   HMAC-SHA256 avec le secret « whsec_… » (partie après le préfixe, décodée en base64)
//   en-tête svix-signature = une ou plusieurs signatures « v1,<base64> » séparées par des espaces
// Doc : https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests

const TOLERANCE_S = 5 * 60 // refuse les requêtes trop anciennes ou trop en avance (rejeu)

export type SignatureCheck = { ok: true } | { ok: false; reason: string }

export function verifySvixSignature(
  payload: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SignatureCheck {
  const { id, timestamp, signature } = headers
  if (!id || !timestamp || !signature) return { ok: false, reason: "en-têtes de signature absents" }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_S) return { ok: false, reason: "horodatage hors délai" }

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64")
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest()

  for (const part of signature.split(" ")) {
    const [version, value] = part.split(",")
    if (version !== "v1" || !value) continue
    const given = Buffer.from(value, "base64")
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true }
  }
  return { ok: false, reason: "signature invalide" }
}
