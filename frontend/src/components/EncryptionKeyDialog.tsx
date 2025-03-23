import {Button, Flex, Group, Modal, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  closeEncryptionKeyDialog,
  keyTokenPairChanged,
  qrModeChanged,
  saveEncryptionKey,
  toggleEncryptionKeyDialogVisibility,
} from '../state/user'
import {isValidKeyTokenPair} from '../business/notesEncryption'
import {QRCodeSVG} from 'qrcode.react'
import {Scanner} from '@yudiel/react-qr-scanner'

export const EncryptionKeyDialog = () => {
  const {open, keyTokenPair, visible, qrMode} = useSelector((s) => s.user.encryptionKeyDialog)
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
      <Group my='md'>
        <Button onClick={() => qrModeChanged(qrMode === 'show' ? 'hide' : 'show')}>
          {qrMode === 'show' ? 'Hide QR' : 'Show QR'}
        </Button>
        <Button onClick={() => qrModeChanged(qrMode === 'scan' ? 'hide' : 'scan')}>
          {qrMode === 'scan' ? 'Stop scan' : 'Scan QR'}
        </Button>
      </Group>
      {qrMode === 'show' && (
        <QRCodeSVG style={{width: '100%', height: 'auto'}} value={keyTokenPair} />
      )}
      {qrMode === 'scan' && (
        <Scanner
          onError={(error) => {
            console.error('QR scan error', error)
          }}
          onScan={(result) => {
            const {rawValue} = result[0]!
            if (isValidKeyTokenPair(rawValue)) {
              saveEncryptionKey(rawValue)
              closeEncryptionKeyDialog()
            }
          }}
        />
      )}
    </Modal>
  )
}
