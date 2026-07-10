export default function PushOptIn({ cityName }: { cityId: string; cityName: string }) {
  return (
    <button
      disabled
      className="w-full flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold bg-white/10 text-white/40 cursor-not-allowed"
    >
      <span className="text-base">🔕</span>
      Alertes pour {cityName} — bientôt disponible
    </button>
  )
}
