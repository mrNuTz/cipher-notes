import {Box, Paper} from '@mantine/core'
import {useSelector} from '../state/store'
import {openNote} from '../state/notes'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {byProp} from '../util/misc'

export const NotesGrid = () => {
  const query = useSelector((s) => s.notes.query)
  const sort = useSelector((s) => s.notes.sort)
  const notes = useLiveQuery(async () => {
    const allNotes = await db.notes.where('deleted_at').equals(0).toArray()
    return allNotes
      .filter((n) => !query || n.txt.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      .sort(byProp(sort.prop, sort.desc))
  }, [query, sort])
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {notes?.map((note) => (
        <Paper
          key={note.id}
          style={{
            padding: '1rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'pointer',
          }}
          shadow='sm'
          onClick={() => openNote(note.id)}
          role='button'
        >
          {truncate(note.txt)}
        </Paper>
      ))}
    </Box>
  )
}

const truncate = (txt: string) => {
  const lines = txt.split('\n')
  let ellipsis: boolean = false
  if (lines.length > 5) {
    txt = lines.slice(0, 5).join('\n')
    ellipsis = true
  }
  if (txt.length > 200) {
    txt = txt.slice(0, 200)
    ellipsis = true
  }
  if (ellipsis) {
    txt += '...'
  }
  return txt
}
