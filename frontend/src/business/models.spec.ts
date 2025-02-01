import {describe, it, expect} from 'vitest'
import {anyOpenNoteSchema} from './models'

describe('anyOpenNoteSchema', () => {
  it('should validate any note type', () => {
    const textNote = {
      type: 'note' as const,
      id: '123',
      txt: 'hello',
    }
    const todoNote = {
      type: 'todo' as const,
      id: '123',
      todos: [{done: false, txt: 'todo 1'}],
    }
    const legacyNote = {
      id: '123',
      txt: 'hello',
    }
    expect(anyOpenNoteSchema.parse(textNote)).toEqual(textNote)
    expect(anyOpenNoteSchema.parse(todoNote)).toEqual(todoNote)
    expect(anyOpenNoteSchema.parse(legacyNote)).toEqual(legacyNote)
  })
})
