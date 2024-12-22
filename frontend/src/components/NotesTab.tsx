import {Button, Flex, Tabs} from '@mantine/core'
import {memo} from 'react'
import {SearchInput} from './SearchInput'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'
import {OpenNote} from './OpenNote'
import {IconPlus} from './icons/IconPlus'

export const NotesTab = memo(() => (
  <Tabs.Panel
    value='notes'
    style={{flex: 1, display: 'flex', flexDirection: 'column'}}
    pos='relative'
  >
    <Flex gap='xs' p='md' bg='rgba(0,0,0,.1)'>
      <SearchInput />
      <div style={{flex: 1}} />
      <NotesSortSelect />
    </Flex>
    <NotesGrid />
    <Button onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
      <IconPlus />
    </Button>
    <OpenNote />
  </Tabs.Panel>
))
