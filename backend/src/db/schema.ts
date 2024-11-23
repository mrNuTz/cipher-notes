import {uuid, pgTable, varchar, text, integer, unique} from 'drizzle-orm/pg-core'

export const usersTbl = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({length: 255}).unique().notNull(),
})

export const notesTbl = pgTable(
  'notes',
  {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    user_id: uuid()
      .references(() => usersTbl.id)
      .notNull(),
    client_id: varchar({length: 255}).notNull(),
    cipher: text().notNull(),
  },
  (t) => [unique('user_client_id').on(t.user_id, t.client_id)]
)
