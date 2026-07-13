"use client"

import { useRef, useState, useCallback } from "react"

interface Props {
  before: string
  after: string
  labelBefore: string
  labelAfter: string
  alt: string
}

export default function BeforeAfterSlider({ before, after, labelBefore, labelAfter, alt }: Props) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const move = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl cursor-col-resize touch-none"
      onMouseDown={() => { dragging.current = true }}
      onMouseUp={() => { dragging.current = false }}
      onMouseLeave={() => { dragging.current = false }}
      onMouseMove={(e) => { if (dragging.current) move(e.clientX) }}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onClick={(e) => move(e.clientX)}
    >
      {/* Image avant (fond) */}
      <img src={before} alt={`${alt} — avant`} className="w-full block" draggable={false} />

      {/* Image après (par-dessus, clipée) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={after} alt={`${alt} — après`} className="w-full block" draggable={false} />
      </div>

      {/* Séparateur */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M3 1L1 7L3 13M7 1L9 7L7 13" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg pointer-events-none">
        {labelBefore}
      </span>
      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg pointer-events-none">
        {labelAfter}
      </span>
    </div>
  )
}
