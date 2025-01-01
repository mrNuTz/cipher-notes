import {Button, Flex, Modal, Stack, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'
import {formatDateTime} from '../util/misc'
import {pickLocalNote, pickServerNote} from '../state/conflicts'

export const ConflictDialog = () => {
  const conflicts = useSelector((s) => s.conflicts.conflicts)
  const serverPut = conflicts[0]
  const localNote = useLiveQuery(() => db.notes.get(serverPut?.id ?? ''), [serverPut?.id])
  console.log(serverPut, localNote)
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
          <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
            {localNote.deleted_at ? 'DELETED' : localNote.txt}
          </Text>
          <Button onClick={pickLocalNote}>Use Local</Button>
        </Stack>
        <Stack flex='1 1 0' gap='xs'>
          <Text size='xl'>Server Note</Text>
          <Text c='dimmed'>
            {serverPut.deleted_at
              ? formatDateTime(serverPut.deleted_at)
              : formatDateTime(serverPut.updated_at)}
          </Text>
          <Text style={{whiteSpace: 'pre-wrap'}} ff='monospace'>
            {serverPut.deleted_at ? 'DELETED' : serverPut.txt}
          </Text>
          <Button onClick={pickServerNote}>Use Server</Button>
        </Stack>
      </Flex>
    </Modal>
  )
}
