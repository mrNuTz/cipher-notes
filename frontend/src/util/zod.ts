import {z} from 'zod'
import {safeJsonParse} from './misc'

export const zodParseString = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  str: string
): z.infer<Schema> | undefined => {
  const res = schema.safeParse(safeJsonParse(str))
  return res.success ? res.data : undefined
}
