import {Button, Flex, Modal, Stack, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {formatDateTime} from '../util/misc'
import {pickLocalNote, pickServerNote} from '../state/conflicts'
import {TodoControl} from './TodoControl'
import {zodParseString} from '../util/zod'
import {textPutTxtSchema, todoPutTxtSchema} from '../business/models'

export const ConflictDialog = () => {
  const conflicts = useSelector((s) => s.conflicts.conflicts)
  const serverPut = conflicts[0]
  const localNote = useLiveQuery(() => db.notes.get(serverPut?.id ?? ''), [serverPut?.id])
  if (!serverPut || !localNote) return null
  const serverTxtTodo = zodParseString(todoPutTxtSchema, serverPut.txt ?? 'null')
  const serverTxtText = zodParseString(textPutTxtSchema, serverPut.txt ?? 'null')
  const serverTitle = serverTxtTodo?.title ?? serverTxtText?.title ?? ''
  const serverTxt = serverTxtText?.txt ?? ''
  const serverTodos = serverTxtTodo?.todos ?? []
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
            <>
              <Text size='lg'>{localNote.title}</Text>
              <TodoControl todos={localNote.todos} />
            </>
          ) : (
            <>
              <Text size='lg'>{localNote.title}</Text>
              <Text style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}} ff='monospace'>
                {localNote.txt}
              </Text>
            </>
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
            <>
              <Text size='lg'>{serverTitle}</Text>
              <TodoControl todos={serverTodos} />
            </>
          ) : (
            <>
              <Text size='lg'>{serverTitle}</Text>
              <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
                {serverTxt}
              </Text>
            </>
          )}
          <Button onClick={pickServerNote}>Use Server</Button>
        </Stack>
      </Flex>
    </Modal>
  )
}
