import {Button, Group, Modal, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeEncryptionKeyDialog, encryptionKeyChanged, saveEncryptionKey} from '../state/user'

export const EncryptionKeyDialog = () => {
  const {open, cryptoKey} = useSelector((s) => s.user.encryptionKeyDialog)
  return (
    <Modal title='Encryption key' opened={open} onClose={closeEncryptionKeyDialog}>
      <TextInput
        label='Encryption key'
        value={cryptoKey}
        onChange={(e) => encryptionKeyChanged(e.target.value)}
      />
      <Group mt='md'>
        <Button onClick={saveEncryptionKey}>Save new key</Button>
        <Button onClick={() => navigator.clipboard.writeText(cryptoKey)}>Copy to Clipboard</Button>
      </Group>
    </Modal>
  )
}
