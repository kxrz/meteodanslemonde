import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { BASE_URL } from "@/lib/resend"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/?confirmed=invalid`)
  }

  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers
    SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE confirm_token = ${token}
    RETURNING id
  ` as { id: string }[]

  if (!rows.length) {
    return NextResponse.redirect(`${BASE_URL}/?confirmed=invalid`)
  }

  return NextResponse.redirect(`${BASE_URL}/notifications?confirmed=ok`)
}
