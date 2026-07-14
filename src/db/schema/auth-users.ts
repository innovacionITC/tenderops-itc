import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Stub for Supabase's auth.users table, owned by Supabase Auth (not by us).
// drizzle-kit pull only introspects the "public" schema, so foreign keys
// pointing at auth.users need this manually maintained reference to resolve.
// Re-add the `import { users } from "./auth-users"` line at the top of
// schema.ts after every `npm run db:pull` — pull overwrites schema.ts.
const authSchema = pgSchema("auth");

export const usersInAuth = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});
