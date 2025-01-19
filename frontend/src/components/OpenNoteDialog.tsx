import {Button, Drawer, Flex} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeNote, openNoteChanged, deleteOpenNote} from '../state/notes'
import {modals} from '@mantine/modals'
import {IconArrowBackUp} from './icons/IconArrowBackUp'
import {IconArrowForwardUp} from './icons/IconArrowForwardUp'
import {useUndoRedo} from '../util/undoHook'
import {IconTrash} from './icons/IconTrash'
import {IconX} from './icons/IconX'

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
      position='bottom'
      size='100%'
      withCloseButton={false}
      onClose={closeNote}
      styles={{
        content: {height: '100dvh', display: 'flex', flexDirection: 'column'},
        body: {flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: '1rem'},
      }}
    >
      <textarea
        data-autofocus
        value={note?.txt}
        onChange={(e) => openNoteChanged(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault()
            const target = e.currentTarget
            const cursor = target.selectionStart
            const value = target.value
            openNoteChanged(value.slice(0, cursor) + '\t' + value.slice(cursor))
            Promise.resolve().then(() => {
              target.selectionStart = cursor + 1
              target.selectionEnd = cursor + 1
            })
          }

          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
        }}
        style={{
          fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace",
          resize: 'none',
          flex: '1 1 0',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          margin: '4px 0',
          tabSize: 4,
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
          <IconTrash />
        </Button>
        <div style={{flex: '1 1 0'}} />
        <Button onClick={undo} disabled={!canUndo}>
          <IconArrowBackUp />
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          <IconArrowForwardUp />
        </Button>
        <Button onClick={closeNote}>
          <IconX />
        </Button>
      </Flex>
    </Drawer>
  )
}
