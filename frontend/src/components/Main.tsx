import {Box, Button, Flex, Stack} from '@mantine/core'
import {SearchInput} from './SearchInput'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'
import {IconPlus} from './icons/IconPlus'
import {IconCommand} from './icons/IconCommand'
import {spotlight} from '@mantine/spotlight'
import {StatusBar} from './StatusBar'

export const Main = () => (
  <Stack flex={1} h='100%' gap={0}>
    <Flex gap='xs' p='md' bg='rgba(0,0,0,.1)'>
      <SearchInput />
      <Box flex={1} />
      <NotesSortSelect />
      <Button flex='0 0 auto' onClick={spotlight.open} p='xs'>
        <IconCommand />
      </Button>
    </Flex>
    <NotesGrid />
    <Box pos='relative' flex={1} style={{overflow: 'visible'}}>
      <Button onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
        <IconPlus />
      </Button>
    </Box>
    <StatusBar />
  </Stack>
)
