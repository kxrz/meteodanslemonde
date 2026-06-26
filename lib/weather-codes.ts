export const WEATHER_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Ciel dégagé",        emoji: "☀️" },
  1:  { label: "Peu nuageux",         emoji: "🌤️" },
  2:  { label: "Partiellement nuageux", emoji: "⛅" },
  3:  { label: "Couvert",             emoji: "☁️" },
  45: { label: "Brouillard",          emoji: "🌫️" },
  48: { label: "Givre",               emoji: "🌫️" },
  51: { label: "Bruine légère",       emoji: "🌦️" },
  53: { label: "Bruine modérée",      emoji: "🌧️" },
  55: { label: "Bruine dense",        emoji: "🌧️" },
  61: { label: "Pluie légère",        emoji: "🌦️" },
  63: { label: "Pluie modérée",       emoji: "🌧️" },
  65: { label: "Pluie forte",         emoji: "🌧️" },
  71: { label: "Neige légère",        emoji: "🌨️" },
  73: { label: "Neige modérée",       emoji: "❄️" },
  75: { label: "Neige forte",         emoji: "❄️" },
  80: { label: "Averses légères",     emoji: "🌦️" },
  81: { label: "Averses modérées",    emoji: "🌧️" },
  82: { label: "Averses fortes",      emoji: "⛈️" },
  95: { label: "Orage",               emoji: "⛈️" },
  96: { label: "Orage + grêle",       emoji: "⛈️" },
  99: { label: "Orage + grêle forte", emoji: "⛈️" },
}

export function getWeather(code: number) {
  return WEATHER_CODES[code] ?? { label: "Inconnu", emoji: "❓" }
}
