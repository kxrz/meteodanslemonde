import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email           TEXT NOT NULL,
      first_name      TEXT NOT NULL,
      resend_id       TEXT,
      confirmed_at    TIMESTAMPTZ,
      confirm_token   UUID NOT NULL DEFAULT gen_random_uuid(),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (email)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscriber_id   UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
      city_slug       TEXT NOT NULL,
      city_name       TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (subscriber_id, city_slug)
    )
  `
}

export type Subscriber = {
  id: string
  email: string
  first_name: string
  resend_id: string | null
  confirmed_at: Date | null
  confirm_token: string
}
