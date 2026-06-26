export interface CityFR {
  id: string
  name: string
  lat: number
  lon: number
  region: string
  temp: number
  apparent_temp: number
  temp_max: number
  apparent_temp_max: number
  weathercode: number
  humidity: number
  wind: number
}

export interface CityWorld {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  climateProfile: string
  climateLabel: string
  temp: number
  apparent_temp: number
  temp_max: number
  apparent_temp_max: number
  weathercode: number
  humidity: number
  wind: number
}

export type AnyCity = (CityFR & { type: "fr" }) | (CityWorld & { type: "world" })
