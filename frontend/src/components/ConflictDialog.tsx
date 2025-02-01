import {Button, Flex, Modal, Stack, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {formatDateTime} from '../util/misc'
import {pickLocalNote, pickServerNote} from '../state/conflicts'
import {TodoControl} from './TodoControl'
import {zodParseString} from '../util/zod'
import {todosSchema} from '../business/models'

export const ConflictDialog = () => {
  const conflicts = useSelector((s) => s.conflicts.conflicts)
  const serverPut = conflicts[0]
  const localNote = useLiveQuery(() => db.notes.get(serverPut?.id ?? ''), [serverPut?.id])
  if (!serverPut || !localNote) return null
  return (
    <Modal size='100%' opened={conflicts.length > 0} onClose={() => {}} title='Conflict Resolution'>
      <Flex gap='xs'>
        <Stack flex='1 1 0' gap='xs'>
          <Text size='xl'>Local Note</Text>
          <Text c='dimmed'>
            {localNote.deleted_at
              ? formatDateTime(localNote.deleted_at)
              : formatDateTime(localNote.updated_at)}
          </Text>
          {localNote.deleted_at ? (
            <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
              DELETED
            </Text>
          ) : localNote.type === 'todo' ? (
            <TodoControl todos={localNote.todos} />
          ) : (
            <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
              {localNote.txt}
            </Text>
          )}
          <Button onClick={pickLocalNote}>Use Local</Button>
        </Stack>
        <Stack flex='1 1 0' gap='xs'>
          <Text size='xl'>Server Note</Text>
          <Text c='dimmed'>
            {serverPut.deleted_at
              ? formatDateTime(serverPut.deleted_at)
              : formatDateTime(serverPut.updated_at)}
          </Text>
          {serverPut.deleted_at ? (
            <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
              DELETED
            </Text>
          ) : serverPut.type === 'todo' ? (
            <TodoControl
              todos={serverPut.txt ? zodParseString(todosSchema, serverPut.txt) ?? [] : []}
            />
          ) : (
            <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
              {serverPut.txt}
            </Text>
          )}
          <Button onClick={pickServerNote}>Use Server</Button>
        </Stack>
      </Flex>
    </Modal>
  )
}
