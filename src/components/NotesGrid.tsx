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
        marginTop: '1rem',
      }}
    >
      {notes.map((note) => (
        <Paper
          key={note.id}
          style={{padding: '1rem', whiteSpace: 'pre-wrap'}}
          shadow='sm'
          onClick={() => openNote(note.id)}
        >
          {note.txt}
        </Paper>
      ))}
    </Box>
  )
}
