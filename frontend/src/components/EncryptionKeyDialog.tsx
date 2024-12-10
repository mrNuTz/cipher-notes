import {Button, Flex, Group, Modal, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  closeEncryptionKeyDialog,
  keyTokenPairChanged,
  saveEncryptionKey,
  toggleEncryptionKeyDialogVisibility,
} from '../state/user'
import {isValidKeyTokenPair} from '../business/notesEncryption'

export const EncryptionKeyDialog = () => {
  const {open, keyTokenPair, visible} = useSelector((s) => s.user.encryptionKeyDialog)
  const valid = isValidKeyTokenPair(keyTokenPair)
  return (
    <Modal title='Encryption key' opened={open} onClose={closeEncryptionKeyDialog}>
      <Flex gap='xs' align='end'>
        <TextInput
          flex={1}
          label='Encryption key'
          value={keyTokenPair}
          onChange={(e) => keyTokenPairChanged(e.target.value)}
          error={!valid ? 'Invalid key token pair' : undefined}
          type={visible ? 'text' : 'password'}
        />
        <Button onClick={toggleEncryptionKeyDialogVisibility}>{visible ? 'Hide' : 'Show'}</Button>
      </Flex>
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
