import {Spotlight} from '@mantine/spotlight'
import {exportNotes, openImportDialog} from '../state/notes'
import {
  openEncryptionKeyDialog,
  openLoginDialog,
  openRegisterDialog,
  openSyncDialog,
} from '../state/user'
import {useSelector} from '../state/store'
import {useMantineColorScheme} from '@mantine/core'

export const CommandCenter = () => {
  const {toggleColorScheme} = useMantineColorScheme()
  const loggedIn = useSelector((s) => s.user.user.loggedIn)
  return (
    <Spotlight
      shortcut={['Ctrl + K', 'Cmd + K']}
      actions={[
        {
          id: 'toggleColorScheme',
          label: 'Toggle Dark Mode',
          onClick: toggleColorScheme,
        },
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
          disabled: loggedIn,
        },
        {
          id: 'login',
          label: 'Login',
          onClick: openLoginDialog,
          disabled: loggedIn,
        },
        {
          id: 'sync',
          label: 'Synchronize notes with server',
          onClick: openSyncDialog,
          disabled: !loggedIn,
        },
        {
          id: 'encryptionKey',
          label: 'Import/Export Encryption-Key',
          onClick: openEncryptionKeyDialog,
        },
      ].filter((a) => !a.disabled)}
    />
  )
}
