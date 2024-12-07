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
})

export const notesTbl = pgTable(
  'notes',
  {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    user_id: integer()
      .references(() => usersTbl.id)
      .notNull(),
    clientside_id: varchar({length: 36}).notNull(),
    cipher_text: text().notNull(),
    serverside_created_at: bigint({mode: 'number'}).$default(Date.now).notNull(),
    serverside_updated_at: bigint({mode: 'number'})
      .$default(Date.now)
      .$onUpdate(Date.now)
      .notNull(),
    clientside_created_at: bigint({mode: 'number'}).notNull(),
    clientside_updated_at: bigint({mode: 'number'}).notNull(),
  },
  (t) => [unique('user_client_id').on(t.user_id, t.clientside_id)]
)

export const notesDeletesTbl = pgTable(
  'notes_deletes',
  {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    user_id: integer()
      .references(() => usersTbl.id)
      .notNull(),
    clientside_id: varchar({length: 36}).notNull(),
    clientside_deleted_at: bigint({mode: 'number'}).notNull(),
    serverside_created_at: bigint({mode: 'number'}).$default(Date.now).notNull(),
  },
  (t) => [unique('deletes_user_client_id').on(t.user_id, t.clientside_id)]
)
