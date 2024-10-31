import {Button, Tabs} from '@mantine/core'
import {memo} from 'react'
import {FlexRow} from './misc'
import {SearchInput} from './SearchInput'
import {IconPlus} from '@tabler/icons-react'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'

export const NotesTab = memo(() => (
  <Tabs.Panel value='notes' style={{flex: 1, padding: '1rem'}}>
    <FlexRow style={{gap: '.5rem', justifyContent: 'center'}}>
      <SearchInput />
      <Button onClick={addNote}>
        <IconPlus />
      </Button>
    </FlexRow>
    <NotesGrid />
  </Tabs.Panel>
))
