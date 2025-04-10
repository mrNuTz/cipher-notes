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
import {KeepImportDialog} from './KeepImportDialog.tsx'
import {debounce} from '../util/misc.ts'

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    'resize',
    debounce(() => {
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${window.visualViewport?.height}px`
      )
    }, 300)
  )
} else {
  window.addEventListener(
    'resize',
    debounce(() => {
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`)
    }, 300)
  )
}

export const App = () => (
  <>
    <Main />
    <OpenNoteDialog />
    <CommandCenter />
    <ImportNotesDialog />
    <KeepImportDialog />
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
