import {ActionIcon, Box, Flex, Stack} from '@mantine/core'
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
    <Flex gap='xs' p='md' bg='rgba(0,0,0,.1)' justify='space-between'>
      <SearchInput />
      <Flex gap='xs' flex='0 1 auto'>
        <NotesSortSelect />
        <ActionIcon size='lg' onClick={spotlight.open}>
          <IconCommand />
        </ActionIcon>
      </Flex>
    </Flex>
    <NotesGrid />
    <Box pos='relative' flex={1} style={{overflow: 'visible'}}>
      <ActionIcon size='xl' onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
        <IconPlus />
      </ActionIcon>
    </Box>
    <StatusBar />
  </Stack>
)
