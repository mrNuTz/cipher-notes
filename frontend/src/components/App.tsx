import {PWABadge} from './PWABadge.tsx'
import {CommandCenter} from './CommandCenter.tsx'
import {MessageBox} from './MessageBox.tsx'
import {ImportNotesDialog} from './ImportNotesDialog.tsx'
import {LoginDialog} from './LoginDialog.tsx'
import {RegisterDialog} from './RegisterDialog.tsx'
import {SyncDialog} from './SyncDialog.tsx'
import {EncryptionKeyDialog} from './EncryptionKeyDialog.tsx'
import {Main} from './Main.tsx'
import {ConflictDialog} from './ConflictDialog.tsx'
import {OpenNoteDialog} from './OpenNoteDialog.tsx'
import {ImpressumDialog} from './ImpressumDialog.tsx'
import {DeleteServerNotesDialog} from './DeleteServerNotesDialog'
import {SettingsDialog} from './SettingsDialog.tsx'

export const App = () => (
  <>
    <Main />
    <OpenNoteDialog />
    <CommandCenter />
    <ImportNotesDialog />
    <RegisterDialog />
    <LoginDialog />
    <SyncDialog />
    <SettingsDialog />
    <ConflictDialog />
    <EncryptionKeyDialog />
    <DeleteServerNotesDialog />
    <ImpressumDialog />
    <PWABadge />
    <MessageBox />
  </>
)
