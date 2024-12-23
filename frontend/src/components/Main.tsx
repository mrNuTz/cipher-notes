import {Box, Button, Flex, Stack} from '@mantine/core'
import {SearchInput} from './SearchInput'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'
import {OpenNote} from './OpenNote'
import {IconPlus} from './icons/IconPlus'
import {IconCommand} from './icons/IconCommand'
import {spotlight} from '@mantine/spotlight'

export const Main = () => (
  <Stack flex={1} pos='relative'>
    <Flex gap='xs' p='md' bg='rgba(0,0,0,.1)'>
      <SearchInput />
      <Box flex={1} />
      <NotesSortSelect />
      <Button flex='0 0 auto' onClick={spotlight.open} p='xs'>
        <IconCommand />
      </Button>
    </Flex>
    <NotesGrid />
    <Button onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
      <IconPlus />
    </Button>
    <OpenNote />
  </Stack>
)
