import {z} from 'zod'
import {todosSchema} from './models'

export const importNotesSchema = z.array(
  z
    .object({
      id: z.string().uuid().optional(),
      txt: z.string().optional(),
      created_at: z.number().int().positive().optional(),
      updated_at: z.number().int().positive().optional(),
      todos: todosSchema.optional(),
    })
    .strip()
)

export type ImportNote = z.infer<typeof importNotesSchema>[number]
