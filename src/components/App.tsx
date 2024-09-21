import {SearchBar} from './SearchBar.tsx'
import {PWABadge} from './PWABadge.tsx'
import {FlexCol, FlexRow} from './misc.tsx'
import {ColorSchemeToggle} from './ColorSchemeToggle.tsx'
import {EngineSelect} from './EngineSelect.tsx'
import {UrlBar} from './UrlBar.tsx'
import {Preview} from './Preview.tsx'
import {CommandCenter} from './CommandCenter.tsx'

export const App = () => (
  <>
    <FlexCol style={{padding: '1rem', flex: 1, gap: '.5rem'}}>
      <FlexRow style={{gap: '.5rem'}}>
        <EngineSelect />
        <ColorSchemeToggle />
      </FlexRow>
      <SearchBar />
      <UrlBar />
      <Preview />
    </FlexCol>
    <CommandCenter />
    <PWABadge />
  </>
)
