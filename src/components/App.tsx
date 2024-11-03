import {PWABadge} from './PWABadge.tsx'
import {CommandCenter} from './CommandCenter.tsx'
import {MainTabs} from './MainTabs.tsx'
import {OpenNote} from './OpenNote.tsx'
import {ColorSchemeToggle} from './ColorSchemeToggle.tsx'
import {MessageBox} from './MessageBox.tsx'
import {CommandButton} from './CommandButton.tsx'

export const App = () => (
  <>
    <MainTabs />
    <ColorSchemeToggle />
    <CommandButton />
    <OpenNote />
    <CommandCenter />
    <PWABadge />
    <MessageBox />
  </>
)
