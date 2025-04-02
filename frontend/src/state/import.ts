import {
  ImportNote,
  importNotesSchema,
  KeepNote,
  keepNoteSchema,
} from '../business/importNotesSchema'
import {Note, NoteCommon} from '../business/models'
import {db} from '../db'
import {downloadJson} from '../util/misc'
import {showMessage} from './messages'
import {getState, setState} from './store'
import JSZip from 'jszip'

export type ImportState = {
  importDialog: {
    open: boolean
    file: File | null
    error: string | null
  }
  keepImportDialog: {
    open: boolean
    file: File | null
    error: string | null
  }
}

export const importInit: ImportState = {
  importDialog: {open: false, file: null, error: null},
  keepImportDialog: {open: false, file: null, error: null},
}

// actions
export const openImportDialog = () =>
  setState((s) => {
    s.import.importDialog = {open: true, file: null, error: null}
  })
export const closeImportDialog = () =>
  setState((s) => {
    s.import.importDialog = {open: false, file: null, error: null}
  })
export const importFileChanged = (file: File | null) =>
  setState((s) => {
    s.import.importDialog.file = file
    s.import.importDialog.error = null
  })
export const openKeepImportDialog = () =>
  setState((s) => {
    s.import.keepImportDialog = {open: true, file: null, error: null}
  })
export const closeKeepImportDialog = () =>
  setState((s) => {
    s.import.keepImportDialog = {open: false, file: null, error: null}
  })
export const keepImportFileChanged = (file: File | null) =>
  setState((s) => {
    s.import.keepImportDialog.file = file
    s.import.keepImportDialog.error = null
  })

export const exportNotes = async () => {
  const notes = await db.notes.where('deleted_at').equals(0).toArray()
  const notesToExport: ImportNote[] = notes.map((n) => ({
    id: n.id,
    txt: n.txt,
    title: n.title,
    created_at: n.created_at,
    updated_at: n.updated_at,
    todos: n.todos,
  }))
  downloadJson(notesToExport, 'notes.json')
}
export const importNotes = async (): Promise<void> => {
  const state = getState()
  const file = state.import.importDialog.file
  if (!file) {
    return
  }
  try {
    const importNotes = importNotesSchema.parse(JSON.parse(await file.text()))
    const res: Note[] = []
    const now = Date.now()
    for (const importNote of importNotes) {
      let {id} = importNote
      if (id === undefined) {
        id = crypto.randomUUID()
      }
      const {txt, updated_at = now, todos, title} = importNote
      if (todos === undefined && txt === undefined) {
        continue
      }
      const type = todos ? 'todo' : 'note'
      const existingNote = await db.notes.get(id)
      if (!existingNote || existingNote.deleted_at !== 0 || updated_at > existingNote.updated_at) {
        const indeterminate = {
          id,
          created_at: existingNote?.created_at ?? now,
          updated_at: Math.max(updated_at, existingNote?.updated_at ?? 0),
          txt,
          state: 'dirty',
          type,
          title: title ?? '',
          version: !existingNote
            ? 1
            : existingNote.state === 'dirty'
            ? existingNote.version
            : existingNote.version + 1,
          deleted_at: 0,
          todos: todos?.map((t) => ({
            ...t,
            id: t.id ?? crypto.randomUUID(),
            updated_at: t.updated_at ?? Date.now(),
          })),
        } as const
        if (indeterminate.todos) {
          res.push({...indeterminate, type: 'todo', todos: indeterminate.todos, txt: undefined})
        } else if (indeterminate.txt) {
          res.push({...indeterminate, type: 'note', txt: indeterminate.txt, todos: undefined})
        }
      }
    }
    await db.notes.bulkPut(res)
    closeImportDialog()
    showMessage({title: 'Success', text: 'Notes imported'})
  } catch {
    setState((s) => {
      s.import.importDialog.error = 'Invalid file format'
    })
  }
}

export const keepImportNotes = async (): Promise<void> => {
  const state = getState()
  const file = state.import.keepImportDialog.file
  if (!file) {
    return
  }
  try {
    const zip = new JSZip()
    const zipFile = await zip.loadAsync(file)
    const res: Note[] = []
    const re = /Keep\/([^/]+)\.json$/
    for (const [path, file] of Object.entries(zipFile.files)) {
      if (!re.test(path)) {
        continue
      }
      const str = await file.async('string')
      let importNote: KeepNote
      try {
        importNote = keepNoteSchema.parse(JSON.parse(str))
      } catch (e) {
        console.error('Error parsing keep note', e)
        continue
      }
      if (importNote.isTrashed) {
        continue
      }
      const noteCommon: NoteCommon = {
        id: crypto.randomUUID(),
        created_at: importNote.createdTimestampUsec / 1000,
        updated_at: importNote.userEditedTimestampUsec / 1000,
        title: importNote.title,
        deleted_at: 0,
        state: 'dirty',
        version: 1,
      }
      if ('textContent' in importNote) {
        const note: Note = {
          ...noteCommon,
          type: 'note',
          txt: importNote.textContent,
        }
        res.push(note)
      } else if ('listContent' in importNote) {
        const note: Note = {
          ...noteCommon,
          type: 'todo',
          todos: importNote.listContent.map((item) => ({
            id: crypto.randomUUID(),
            txt: item.text,
            done: item.isChecked,
            updated_at: importNote.userEditedTimestampUsec / 1000,
          })),
        }
        res.push(note)
      }
    }
    if (res.length === 0) {
      showMessage({title: 'No notes imported', text: 'No valid notes found'})
      return
    }
    await db.notes.bulkPut(res)
    closeKeepImportDialog()
    showMessage({title: 'Success', text: 'Keep notes imported'})
  } catch (e) {
    console.error(e)
    setState((s) => {
      s.import.keepImportDialog.error = e instanceof Error ? e.message : 'Unknown error'
    })
  }
}
