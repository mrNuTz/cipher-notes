import {Spotlight} from '@mantine/spotlight'
import {addNote, exportNotes, openImportDialog} from '../state/notes'
import {
  openEncryptionKeyDialog,
  openLoginDialog,
  openRegisterDialog,
  openSyncDialogAndSync,
} from '../state/user'
import {selectAnyDialogOpen, useSelector} from '../state/store'
import {useMantineColorScheme} from '@mantine/core'

export const CommandCenter = () => {
  const {toggleColorScheme} = useMantineColorScheme()
  const session = useSelector((s) => s.user.user.session)
  const anyDialogOpen = useSelector(selectAnyDialogOpen)
  return (
    <Spotlight
      shortcut={['Ctrl + K', 'Cmd + K']}
      disabled={anyDialogOpen}
      actions={[
        {
          id: 'newNote',
          label: 'New note',
          onClick: addNote,
        },
        {
          id: 'toggleColorScheme',
          label: 'Toggle Dark Mode',
          onClick: toggleColorScheme,
        },
        {
          id: 'sync',
          label: 'Synchronize notes with server',
          onClick: openSyncDialogAndSync,
          disabled: !session,
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
          disabled: !!session,
        },
        {
          id: 'login',
          label: 'Login',
          onClick: openLoginDialog,
          disabled: !!session,
        },
        {
          id: 'encryptionKey',
          label: 'Encryption-Key (Generate/Import/Export)',
          onClick: openEncryptionKeyDialog,
        },
      ].filter((a) => !a.disabled)}
    />
  )
}
