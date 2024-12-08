import {Button, Modal, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeSyncDialog} from '../state/user'
import {syncNotes} from '../state/notes'

export const SyncDialog = () => {
  const {open, syncing} = useSelector((s) => s.user.syncDialog)
  return (
    <Modal title='Synchronize notes with the server' opened={open} onClose={closeSyncDialog}>
      <Text c='dimmed' pb='md'>
        Your notes are encrypted and stored on the server.
        <br />
        On conflicts, the latest version will be kept.
      </Text>
      <Button loading={syncing} onClick={syncNotes}>
        Synchronize
      </Button>
    </Modal>
  )
}
