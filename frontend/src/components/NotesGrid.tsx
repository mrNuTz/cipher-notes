import {Box, Paper} from '@mantine/core'
import {useSelector} from '../state/store'
import {openNote, selectFilteredNotes} from '../state/notes'

export const NotesGrid = () => {
  const notes = useSelector(selectFilteredNotes)
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {notes.map((note) => (
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
