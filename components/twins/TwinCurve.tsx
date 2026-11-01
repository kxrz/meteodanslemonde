import { fmt } from "@/lib/format"
import { MONTHS } from "@/lib/season"

const W = 680, H = 280, L = 40, R = 14, T = 20, B = 30
const SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

/**
 * Mois par mois : votre ville aujourd'hui (normale), votre ville en 2050, et le jumeau aujourd'hui.
 * Mêmes conventions que SeasonCurve : bleu = normale, rouge = 2050, encre pointillée = l'autre ville.
 */
export default function TwinCurve({ city, twin, normal, target, twinNormal, month }: {
  city: string
  twin: string
  normal: number[]
  target: number[]
  twinNormal: number[]
  month: number
}) {
  const all = [...normal, ...target, ...twinNormal]
  const yMin = Math.floor(Math.min(...all) / 5) * 5
  const yMax = Math.ceil(Math.max(...all) / 5) * 5
  const x = (i: number) => L + (i * (W - L - R)) / 11
  const y = (v: number) => T + ((yMax - v) * (H - T - B)) / (yMax - yMin)
  const d = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const area = (a: number[], b: number[]) => `${d(a)} ${b.map((_, i) => `L${x(11 - i).toFixed(1)} ${y(b[11 - i]).toFixed(1)}`).join(" ")} Z`

  return (
    <figure className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-5 sm:p-7">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-labelledby="twc-title twc-desc">
          <title id="twc-title">{`Ressenti maximal moyen, mois par mois : ${city} en 2050 et ${twin} aujourd'hui`}</title>
          <desc id="twc-desc">
            {`En ${MONTHS[month]} : ${city} aujourd'hui ${fmt(normal[month])} °C, ${city} en 2050 ${fmt(target[month])} °C, ${twin} aujourd'hui ${fmt(twinNormal[month])} °C.`}
          </desc>
          {Array.from({ length: (yMax - yMin) / 5 + 1 }, (_, i) => yMin + i * 5).map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--color-mute)" fontFamily="var(--font-mono)">{v}°</text>
            </g>
          ))}
          {SHORT.map((m, i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={i === month ? 700 : 400} fill={i === month ? "var(--color-ink)" : "var(--color-mute)"} fontFamily="var(--font-mono)">{m}</text>
          ))}
          <line x1={x(month)} x2={x(month)} y1={T} y2={H - B} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="3 4" />

          {/* ce qui sépare votre ville en 2050 de son jumeau */}
          <path d={area(target, twinNormal)} fill="var(--color-signal)" opacity={0.35} />
          <path d={d(normal)} fill="none" stroke="var(--color-froid)" strokeWidth="2.5" />
          <path d={d(twinNormal)} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeDasharray="7 5" />
          <path d={d(target)} fill="none" stroke="var(--color-chaud)" strokeWidth="3" />
          <circle cx={x(month)} cy={y(target[month])} r="6" fill="var(--color-chaud)" stroke="#fff" strokeWidth="2" />
          <circle cx={x(month)} cy={y(twinNormal[month])} r="5" fill="var(--color-ink)" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-soft">
        <span className="inline-flex items-center gap-2"><span className="h-[3px] w-6 rounded-full bg-froid" aria-hidden="true" />{city} aujourd&apos;hui (normale 1991-2020)</span>
        <span className="inline-flex items-center gap-2"><span className="h-[3px] w-6 rounded-full bg-chaud" aria-hidden="true" />{city} en 2050</span>
        <span className="inline-flex items-center gap-2"><span className="w-6 border-t-[3px] border-dashed border-ink" aria-hidden="true" />{twin} aujourd&apos;hui</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-6 rounded-sm bg-signal/60" aria-hidden="true" />l&apos;écart restant</span>
      </figcaption>
    </figure>
  )
}
