import {Spotlight, SpotlightActionData} from '@mantine/spotlight'
import {addNote, exportNotes, openImportDialog, openSyncDialogAndSync} from '../state/notes'
import {
  logout,
  openEncryptionKeyDialog,
  openLoginDialog,
  openRegisterDialog,
  toggleImpressum,
  openDeleteServerNotesDialog,
} from '../state/user'
import {selectAnyDialogOpen, useSelector} from '../state/store'
import {useMantineColorScheme} from '@mantine/core'
import {useHotkeys} from '@mantine/hooks'
import {openSettingsDialog} from '../state/settings'

export const CommandCenter = () => {
  const {toggleColorScheme} = useMantineColorScheme()
  const loggedIn = useSelector((s) => s.user.user.loggedIn)
  const anyDialogOpen = useSelector(selectAnyDialogOpen)

  const commands: (SpotlightActionData & {shortcut?: string})[] = [
    {
      id: 'newNote',
      label: 'New note',
      onClick: addNote,
      shortcut: 'alt+shift+n',
    },
    {
      id: 'toggleColorScheme',
      label: 'Toggle Dark Mode',
      onClick: toggleColorScheme,
      shortcut: 'alt+shift+t',
    },
    {
      id: 'sync',
      label: 'Synchronize notes with server',
      onClick: openSyncDialogAndSync,
      disabled: !loggedIn,
      shortcut: 'alt+shift+s',
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
      shortcut: 'alt+shift+l',
    },
    {
      id: 'encryptionKey',
      label: 'Encryption-Key (Generate/Import/Export)',
      onClick: openEncryptionKeyDialog,
    },
    {
      id: 'impressum',
      label: 'Impressum',
      onClick: toggleImpressum,
    },
    {
      id: 'logout',
      label: 'Logout',
      onClick: logout,
      disabled: !loggedIn,
      shortcut: 'alt+shift+o',
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: openSettingsDialog,
    },
    {
      id: 'deleteServerNotes',
      label: 'Delete Server Notes and generate new crypto key',
      onClick: openDeleteServerNotesDialog,
      disabled: !loggedIn,
    },
  ]

  useHotkeys(
    commands
      .filter((c) => !c.disabled)
      .filter(
        (c): c is typeof c & {shortcut: string; onClick: () => void} => !!c.shortcut && !!c.onClick
      )
      .map((c) => [c.shortcut, c.onClick])
  )
  return (
    <Spotlight
      shortcut={['mod + k']}
      scrollable
      maxHeight='100%'
      disabled={anyDialogOpen}
      actions={commands.filter((a) => !a.disabled).map((a) => ({...a, rightSection: a.shortcut}))}
    />
  )
}
