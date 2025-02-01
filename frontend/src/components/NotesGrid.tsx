import {Box, Flex, Paper} from '@mantine/core'
import {useSelector} from '../state/store'
import {openNote} from '../state/notes'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {byProp} from '../util/misc'
import {IconSquare} from './icons/IconSquare'
import {IconCheckbox} from './icons/IconCheckbox'

export const NotesGrid = () => {
  const query = useSelector((s) => s.notes.query)
  const sort = useSelector((s) => s.notes.sort)
  const notes = useLiveQuery(async () => {
    const allNotes = await db.notes.where('deleted_at').equals(0).toArray()
    return allNotes
      .filter(
        (n) =>
          !query ||
          (n.type === 'note'
            ? n.txt.toLocaleLowerCase().includes(query.toLocaleLowerCase())
            : n.todos.some((todo) =>
                todo.txt.toLocaleLowerCase().includes(query.toLocaleLowerCase())
              ))
      )
      .sort(byProp(sort.prop, sort.desc))
  }, [query, sort])
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <style
        children={`button:focus {
          outline: 1px solid var(--mantine-primary-color-5);
        }`}
        scoped
      />
      {notes?.map((note) => (
        <Paper
          component='button'
          key={note.id}
          style={{
            padding: '1rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'pointer',
            border: 'none',
            textAlign: 'left',
            color: 'var(--mantine-color-text)',
            display: 'flex',
            flexDirection: 'column',
          }}
          shadow='sm'
          onClick={() => openNote(note.id)}
          role='button'
        >
          {note.type === 'note'
            ? truncate(note.txt)
            : note.todos.slice(0, 5).map((todo, i) => (
                <Flex
                  align='center'
                  gap='xs'
                  style={{textDecoration: todo.done ? 'line-through' : 'none'}}
                  key={i}
                >
                  {todo.done ? (
                    <IconCheckbox style={{flex: '0 0 auto'}} />
                  ) : (
                    <IconSquare style={{flex: '0 0 auto'}} />
                  )}
                  {todo.txt.substring(0, 50)}
                </Flex>
              ))}
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
