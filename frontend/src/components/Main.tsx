import {ActionIcon, Burger, Flex} from '@mantine/core'
import {SearchInput} from './SearchInput'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'
import {IconPlus} from './icons/IconPlus'
import {IconCommand} from './icons/IconCommand'
import {spotlight} from '@mantine/spotlight'
import {StatusBar} from './StatusBar'
import {toggleLabelSelector} from '../state/labels'

export const Main = () => (
  <>
    <Flex gap='xs' p='md' bg='rgba(0,0,0,.1)' justify='space-between'>
      <Flex gap='xs' flex='0 1 auto'>
        <Burger p={0} flex='0 0 0' onClick={toggleLabelSelector} />
        <SearchInput />
      </Flex>
      <Flex gap='xs' flex='0 1 auto'>
        <NotesSortSelect />
        <ActionIcon size='lg' onClick={spotlight.open}>
          <IconCommand />
        </ActionIcon>
      </Flex>
    </Flex>
    <div style={{flex: '1 1 auto', overflow: 'hidden', position: 'relative'}}>
      <NotesGrid />
      <ActionIcon size='xl' onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
        <IconPlus />
      </ActionIcon>
    </div>
    <StatusBar />
  </>
)
