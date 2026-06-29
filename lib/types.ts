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

export interface ClimateEntry {
  normal: (number | null)[]   // [12] monthly avg apparent_temp_max 1991-2020
  trend: (number | null)[]    // [12] monthly (avg 2015-2024) - (avg 1991-2000)
  proj2030: (number | null)[] // [12] CMIP6 delta: avg(2028-2032) - avg(2000-2020)
  proj2040: (number | null)[] // [12] CMIP6 delta: avg(2038-2042) - avg(2000-2020)
  proj2050: (number | null)[] // [12] CMIP6 delta: avg(2048-2050) - avg(2000-2020)
}

export type ClimateMap = Record<string, ClimateEntry>
