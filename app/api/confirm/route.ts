import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { BASE_URL } from "@/lib/resend"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/?confirmed=invalid`)
  }

  const rows = await sql`
    UPDATE subscribers
    SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE confirm_token = ${token}
    RETURNING id, confirmed_at
  ` as { id: string; confirmed_at: Date | null }[]

  if (!rows.length) {
    return NextResponse.redirect(`${BASE_URL}/?confirmed=invalid`)
  }

  return NextResponse.redirect(`${BASE_URL}/?confirmed=ok`)
}
