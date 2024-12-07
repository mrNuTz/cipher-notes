import {Spotlight} from '@mantine/spotlight'
import {exportNotes, openImportDialog} from '../state/notes'
import {openLoginDialog, openRegisterDialog} from '../state/user'

export const CommandCenter = () => {
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
        },
        {
          id: 'login',
          label: 'Login',
          onClick: openLoginDialog,
        },
      ]}
    />
  )
}
