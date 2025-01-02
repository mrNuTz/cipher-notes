import {Button, Modal, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeSyncDialog} from '../state/user'
import {syncNotes} from '../state/notes'

export const SyncDialog = () => {
  const {open, syncing} = useSelector((s) => s.user.syncDialog)
  const noKey = useSelector((s) => s.user.user.keyTokenPair === null)
  return (
    <Modal title='Synchronize notes with the server' opened={open} onClose={closeSyncDialog}>
      <Text c='dimmed' pb='md'>
        {noKey
          ? 'You need to generate or import an Encryption-Key first!'
          : 'Your notes are encrypted and stored on the server.'}
      </Text>
      <Button disabled={noKey} loading={syncing} onClick={syncNotes}>
        Synchronize
      </Button>
    </Modal>
  )
}
