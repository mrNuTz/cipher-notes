import {pgTable, varchar, text, integer, unique, bigint} from 'drizzle-orm/pg-core'

export const usersTbl = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  email: varchar({length: 255}).unique().notNull(),
  login_code: varchar({length: 6}),
  login_code_created_at: bigint({mode: 'number'}),
  login_tries_left: integer().default(0).notNull(),
  access_token: varchar({length: 63}).unique(),
  access_token_created_at: bigint({mode: 'number'}),
  created_at: bigint({mode: 'number'}).$default(Date.now).notNull(),
  updated_at: bigint({mode: 'number'}).$default(Date.now).$onUpdate(Date.now).notNull(),
  last_synced_at: bigint({mode: 'number'}),
  sync_token: varchar({length: 24}),
})

export const notesTbl = pgTable(
  'notes',
  {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    user_id: integer()
      .references(() => usersTbl.id)
      .notNull(),
    clientside_id: varchar({length: 36}).notNull(),
    cipher_text: text(),
    iv: varchar({length: 16}),
    serverside_created_at: bigint({mode: 'number'}).$default(Date.now).notNull(),
    serverside_updated_at: bigint({mode: 'number'})
      .$default(Date.now)
      .$onUpdate(Date.now)
      .notNull(),
    serverside_deleted_at: bigint({mode: 'number'}),
    clientside_created_at: bigint({mode: 'number'}).notNull(),
    clientside_updated_at: bigint({mode: 'number'}).notNull(),
    clientside_deleted_at: bigint({mode: 'number'}),
  },
  (t) => [unique('user_client_id').on(t.user_id, t.clientside_id)]
)
