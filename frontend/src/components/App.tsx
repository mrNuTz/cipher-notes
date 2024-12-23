import {PWABadge} from './PWABadge.tsx'
import {CommandCenter} from './CommandCenter.tsx'
import {MessageBox} from './MessageBox.tsx'
import {ImportNotesDialog} from './ImportNotesDialog.tsx'
import {LoginDialog} from './LoginDialog.tsx'
import {RegisterDialog} from './RegisterDialog.tsx'
import {SyncDialog} from './SyncDialog.tsx'
import {EncryptionKeyDialog} from './EncryptionKeyDialog.tsx'
import {Main} from './Main.tsx'

export const App = () => (
  <>
    <Main />
    <CommandCenter />
    <ImportNotesDialog />
    <RegisterDialog />
    <LoginDialog />
    <SyncDialog />
    <EncryptionKeyDialog />
    <PWABadge />
    <MessageBox />
  </>
)
