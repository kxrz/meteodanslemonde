import { readFile } from "fs/promises"
import path from "path"

const BASE = "https://www.cestchaud.fr"

/** Lit une police depuis public/fonts (local et build), sinon la récupère sur le site en ligne. */
async function loadFont(file: string): Promise<ArrayBuffer> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public/fonts", file))
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  } catch {
    return fetch(`${BASE}/fonts/${file}`).then((r) => r.arrayBuffer())
  }
}

export async function loadOgFonts() {
  const [regular, semibold] = await Promise.all([loadFont("DMSans-Regular.ttf"), loadFont("DMSans-SemiBold.ttf")])
  return { regular, semibold }
}

/**
 * Polices de la marque pour les images générées (next/og) : Bricolage 800 pour les titres, DM Sans pour le texte.
 * À passer tel quel dans `fonts` d'ImageResponse ; familles : "Bricolage" et "DM Sans".
 */
export async function loadBrandFonts() {
  const [display, regular, semibold] = await Promise.all([
    loadFont("BricolageGrotesque-ExtraBold.woff"),
    loadFont("DMSans-Regular.ttf"),
    loadFont("DMSans-SemiBold.ttf"),
  ])
  return [
    { name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
    { name: "DM Sans", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "DM Sans", data: semibold, weight: 700 as const, style: "normal" as const },
  ]
}
