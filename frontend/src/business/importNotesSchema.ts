import {z} from 'zod'

const noteSchema = z
  .object({
    id: z.string().min(27).max(27).optional(),
    txt: z.string(),
    created: z.number().finite().optional(),
    modified: z.number().finite().optional(),
  })
  .strip()

export const importNotesSchema = z.array(noteSchema)
