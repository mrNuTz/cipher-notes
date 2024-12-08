import {Spotlight} from '@mantine/spotlight'
import {exportNotes, openImportDialog} from '../state/notes'
import {
  openEncryptionKeyDialog,
  openLoginDialog,
  openRegisterDialog,
  openSyncDialog,
} from '../state/user'
import {useSelector} from '../state/store'

export const CommandCenter = () => {
  const accessToken = useSelector((s) => s.user.user.accessToken)
  return (
    <Spotlight
      shortcut={['Ctrl + K', 'Cmd + K']}
      actions={[
        {
          id: 'exportNotes',
          label: 'Export notes',
          onClick: exportNotes,
        },
        {
          id: 'importNotes',
          label: 'Import notes',
          onClick: openImportDialog,
        },
        {
          id: 'register',
          label: 'Register',
          onClick: openRegisterDialog,
          disabled: !!accessToken,
        },
        {
          id: 'login',
          label: 'Login',
          onClick: openLoginDialog,
        },
        {
          id: 'sync',
          label: 'Synchronize notes with server',
          onClick: openSyncDialog,
          disabled: !accessToken,
        },
        {
          id: 'encryptionKey',
          label: 'Encryption key',
          onClick: openEncryptionKeyDialog,
        },
      ].filter((a) => !a.disabled)}
    />
  )
}
