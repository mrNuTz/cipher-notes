import {Box, Flex, Paper} from '@mantine/core'
import {useSelector} from '../state/store'
import {noteOpened} from '../state/notes'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {byProp, compare, truncateWithEllipsis} from '../util/misc'
import {IconSquare} from './icons/IconSquare'
import {IconCheckbox} from './icons/IconCheckbox'

export const NotesGrid = () => {
  const query = useSelector((state) => state.notes.query)
  const sort = useSelector((state) => state.notes.sort)
  const notes = useLiveQuery(async () => {
    const queryLower = query.toLocaleLowerCase()
    const allNotes = await db.notes.where('deleted_at').equals(0).toArray()
    return allNotes
      .filter(
        (n) =>
          !query ||
          n.title.toLocaleLowerCase().includes(queryLower) ||
          (n.type === 'note'
            ? n.txt.toLocaleLowerCase().includes(queryLower)
            : n.todos.some((todo) => todo.txt.toLocaleLowerCase().includes(queryLower)))
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
          onClick={() => noteOpened(note.id)}
          role='button'
        >
          <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{note.title}</div>
          {note.type === 'note'
            ? truncateWithEllipsis(note.txt)
            : note.todos
                .map((t, i) => [t.done, i, t] as const)
                .sort(compare)
                .slice(0, 5)
                .map(([, i, todo]) => (
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
                    {truncateWithEllipsis(todo.txt, 1, 50)}
                  </Flex>
                ))}
        </Paper>
      ))}
    </Box>
  )
}
