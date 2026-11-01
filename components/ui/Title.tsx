import { cn } from "@/lib/cn"

type Size = "hero" | "xl" | "lg" | "md"

const SIZES: Record<Size, string> = {
  hero: "text-[clamp(2.6rem,8vw,6rem)] leading-[0.92] font-extrabold",
  xl: "text-[clamp(2rem,5vw,3.5rem)] leading-[0.98] font-extrabold",
  lg: "text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.02] font-extrabold",
  md: "text-[1.35rem] leading-tight font-bold",
}

/**
 * Titre de la marque. `animate` découpe le titre en mots qui montent (SplitText) à l'arrivée.
 * Les mots importants se passent en <Hl> à l'intérieur.
 */
export default function Title({ as: Tag = "h2", size = "lg", animate = false, className, children, id }: {
  as?: "h1" | "h2" | "h3" | "p"
  size?: Size
  animate?: boolean
  className?: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <Tag id={id} data-anim={animate ? "split" : undefined} className={cn("font-display text-ink", SIZES[size], className)}>
      {children}
    </Tag>
  )
}
