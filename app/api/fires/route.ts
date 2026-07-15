import { fetchFiresGeoJSON } from "@/lib/fire-data"

export const revalidate = 86400

export async function GET() {
  const data = await fetchFiresGeoJSON()
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  })
}
