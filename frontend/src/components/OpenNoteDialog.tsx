import {Button, Drawer, Flex} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeNote, openNoteChanged, deleteOpenNote} from '../state/notes'
import {modals} from '@mantine/modals'
import {IconArrowBackUp} from './icons/IconArrowBackUp'
import {IconArrowForwardUp} from './icons/IconArrowForwardUp'
import {useUndoRedo} from '../util/undoHook'

export const OpenNoteDialog = () => {
  const note = useSelector((s) => s.notes.openNote)
  const {undo, redo, canUndo, canRedo} = useUndoRedo(
    note?.txt ?? '',
    (txt) => openNoteChanged(txt),
    500,
    note?.id ?? null
  )
  return (
    <Drawer
      opened={!!note}
      onClose={closeNote}
      position='bottom'
      size='100%'
      styles={{
        content: {height: '100dvh', display: 'flex', flexDirection: 'column'},
        body: {flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: '1rem'},
      }}
    >
      <textarea
        value={note?.txt}
        onChange={(e) => openNoteChanged(e.target.value)}
        style={{
          fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace",
          resize: 'none',
          flex: '1 1 0',
          border: 'none',
          margin: '4px 0',
          boxShadow: '0 0 0 1px var(--mantine-color-gray-5)',
        }}
      />
      <Flex gap='xs'>
        <Button
          onClick={() =>
            modals.openConfirmModal({
              title: 'Delete note?',
              centered: true,
              labels: {confirm: 'Delete', cancel: 'Cancel'},
              confirmProps: {color: 'red'},
              onConfirm: deleteOpenNote,
            })
          }
        >
          Delete note
        </Button>
        <div style={{flex: '1 1 0'}} />
        <Button onClick={undo} disabled={!canUndo}>
          <IconArrowBackUp />
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          <IconArrowForwardUp />
        </Button>
      </Flex>
    </Drawer>
  )
}
