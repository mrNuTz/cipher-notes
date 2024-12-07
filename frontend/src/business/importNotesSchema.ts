import {z} from 'zod'

export const importNotesSchema = z.array(
  z
    .object({
      id: z.string().uuid().optional(),
      txt: z.string(),
      created_at: z.number().int().positive().optional(),
      updated_at: z.number().int().positive().optional(),
    })
    .strip()
)

export type ImportNote = z.infer<typeof importNotesSchema>[number]
