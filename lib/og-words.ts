// Découpage d'un titre en mots pour les images générées (next/og / Satori), qui ne coupe pas
// les lignes à l'intérieur d'un bloc flex : la ponctuation reste collée au mot qui la précède,
// et les mots de `highlight` sont marqués pour recevoir le surligneur.

export interface OgWord { w: string; hl: boolean }

export function splitHighlight(headline: string, highlight?: string): OgWord[] {
  const hasHl = Boolean(highlight && headline.includes(highlight))
  const parts = hasHl ? headline.split(highlight!) : [headline]
  const words: OgWord[] = []
  parts.forEach((part, i) => {
    part.split(/\s+/).filter(Boolean).forEach((w) => {
      if (/^[.,;:!?…»)]+$/.test(w) && words.length) words[words.length - 1].w += w
      else words.push({ w, hl: false })
    })
    if (hasHl && i < parts.length - 1) {
      highlight!.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, hl: true }))
    }
  })
  return words
}
