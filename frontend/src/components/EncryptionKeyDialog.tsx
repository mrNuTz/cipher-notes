import {Button, Group, Modal, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeEncryptionKeyDialog, keyTokenPairChanged, saveEncryptionKey} from '../state/user'
import {isValidKeyTokenPair} from '../business/notesEncryption'

export const EncryptionKeyDialog = () => {
  const {open, keyTokenPair} = useSelector((s) => s.user.encryptionKeyDialog)
  const valid = isValidKeyTokenPair(keyTokenPair)
  return (
    <Modal title='Encryption key' opened={open} onClose={closeEncryptionKeyDialog}>
      <TextInput
        label='Encryption key'
        value={keyTokenPair}
        onChange={(e) => keyTokenPairChanged(e.target.value)}
        error={!valid ? 'Invalid key token pair' : undefined}
        type='password'
      />
      <Group mt='md'>
        <Button onClick={() => saveEncryptionKey(keyTokenPair)} disabled={!valid}>
          Save new key
        </Button>
        <Button onClick={() => navigator.clipboard.writeText(keyTokenPair)}>
          Copy to Clipboard
        </Button>
      </Group>
    </Modal>
  )
}
