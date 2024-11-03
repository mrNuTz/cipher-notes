import {Button, Tabs} from '@mantine/core'
import {memo} from 'react'
import {FlexRow} from './misc'
import {SearchInput} from './SearchInput'
import {IconPlus} from '@tabler/icons-react'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'

export const NotesTab = memo(() => (
  <Tabs.Panel
    value='notes'
    style={{flex: 1, display: 'flex', flexDirection: 'column'}}
    pos='relative'
  >
    <FlexRow
      style={{
        gap: '.5rem',
        justifyContent: 'end',
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,.1)',
      }}
    >
      <SearchInput />
      <div style={{flex: 1}} />
      <NotesSortSelect />
    </FlexRow>
    <NotesGrid />
    <Button onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
      <IconPlus />
    </Button>
  </Tabs.Panel>
))
