import {SearchBar} from './SearchBar.tsx'
import {EngineSelect} from './EngineSelect.tsx'
import {UrlBar} from './UrlBar.tsx'
import {Preview} from './Preview.tsx'
import {Tabs} from '@mantine/core'
import {memo} from 'react'

export const SearchTab = memo(() => (
  <Tabs.Panel
    value='search'
    style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      flex: 1,
      gap: 'var(--mantine-spacing-xs)',
    }}
  >
    <EngineSelect />
    <SearchBar />
    <UrlBar />
    <Preview />
  </Tabs.Panel>
))
