import {ActionIcon, AppShell, Box, Burger, Flex} from '@mantine/core'
import {SearchInput} from './SearchInput'
import {NotesGrid} from './NotesGrid'
import {addNote} from '../state/notes'
import {NotesSortSelect} from './NotesSortSelect'
import {IconPlus} from './icons/IconPlus'
import {IconCommand} from './icons/IconCommand'
import {spotlight} from '@mantine/spotlight'
import {StatusBar} from './StatusBar'
import {useDisclosure} from '@mantine/hooks'

export const Main = () => {
  const [opened, {toggle}] = useDisclosure(false)
  return (
    <AppShell
      header={{height: 60}}
      navbar={{width: 300, breakpoint: 'sm', collapsed: {mobile: !opened, desktop: !opened}}}
      footer={{height: 35}}
    >
      <AppShell.Header
        style={{
          display: 'flex',
          padding: 'var(--mantine-spacing-xs)',
          gap: 'var(--mantine-spacing-xs)',
          backgroundColor: 'rgba(0,0,0,.1)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Flex gap='xs' align='center'>
          {false && <Burger pr={0} opened={opened} onClick={toggle} />}
          <SearchInput />
        </Flex>
        <Flex gap='xs' flex='0 1 auto' align='center'>
          <NotesSortSelect />
          <ActionIcon size='lg' onClick={spotlight.open}>
            <IconCommand />
          </ActionIcon>
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar>navbar</AppShell.Navbar>
      <AppShell.Main
        style={{display: 'flex', flexDirection: 'column', height: 'calc(100vh - 95px)'}}
      >
        <NotesGrid />
        <Box pos='relative' style={{overflow: 'visible', height: 0}}>
          <ActionIcon size='xl' onClick={addNote} pos='absolute' bottom='1rem' right='1rem'>
            <IconPlus />
          </ActionIcon>
        </Box>
      </AppShell.Main>
      <AppShell.Footer
        style={{
          display: 'flex',
          padding: 'var(--mantine-spacing-xs)',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,.1)',
        }}
      >
        <StatusBar />
      </AppShell.Footer>
    </AppShell>
  )
}
