import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
export type Database = PostgresJsDatabase<any>;

export type DbConnectResult =
  | { ok: true; db: Database; close: () => Promise<void> }
  | { ok: false; reason: string };

export async function tryConnectDatabase(url: string | undefined): Promise<DbConnectResult> {
  if (!url) {
    return { ok: false, reason: "DATABASE_URL not set" };
  }
  try {
    const client = postgres(url, { max: 5, idle_timeout: 5, connect_timeout: 3 });
    // Probe with a no-op query.
    await client`select 1`;
    const db = drizzle(client);
    return {
      ok: true,
      db,
      close: async () => {
        await client.end({ timeout: 2 });
      },
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, reason };
  }
}
