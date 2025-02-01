import {Button, Drawer, Flex} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  closeNote,
  openNoteChanged,
  deleteOpenNote,
  openNoteRestored,
  deleteTodo,
  insertTodo,
  todoChanged,
  todoChecked,
  openNoteTypeToggled,
} from '../state/notes'
import {modals} from '@mantine/modals'
import {IconArrowBackUp} from './icons/IconArrowBackUp'
import {IconArrowForwardUp} from './icons/IconArrowForwardUp'
import {useUndoRedo} from '../util/undoHook'
import {IconTrash} from './icons/IconTrash'
import {IconX} from './icons/IconX'
import {useEffect} from 'react'
import {NoteHistoryItem, OpenNote} from '../business/models'
import {XTextarea} from './XTextarea'
import {TodoControl} from './TodoControl'
import {IconCheckbox} from './icons/IconCheckbox'

const selectHistoryItem = (openNote: OpenNote | null): NoteHistoryItem | null => {
  if (openNote === null) return null
  return openNote.type === 'note'
    ? {type: 'note', txt: openNote.txt}
    : {type: 'todo', todos: openNote.todos}
}

export const OpenNoteDialog = () => {
  const openNote = useSelector((s) => s.notes.openNote)
  const historyItem = selectHistoryItem(openNote)
  const {undo, redo, canUndo, canRedo} = useUndoRedo<NoteHistoryItem | null>(
    historyItem,
    (historyItem) => historyItem && openNoteRestored(historyItem),
    500,
    openNote?.id ?? null
  )
  const open = !!openNote
  useEffect(() => {
    if (open) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', closeNote)
    }
    return () => {
      window.removeEventListener('popstate', closeNote)
    }
  }, [open])
  return (
    <Drawer
      opened={open}
      position='bottom'
      size='100%'
      withCloseButton={false}
      onClose={() => window.history.back()}
      styles={{
        content: {height: '100dvh', display: 'flex', flexDirection: 'column'},
        body: {
          flex: '0 0 100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        },
      }}
    >
      {openNote?.type === 'note' ? (
        <XTextarea
          value={openNote?.txt ?? ''}
          onChange={openNoteChanged}
          onUndo={undo}
          onRedo={redo}
        />
      ) : openNote?.type === 'todo' ? (
        <TodoControl
          todos={openNote.todos}
          onTodoChecked={todoChecked}
          onTodoChanged={todoChanged}
          onInsertTodo={insertTodo}
          onTodoDeleted={deleteTodo}
          onUndo={undo}
          onRedo={redo}
        />
      ) : null}
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
        <Button onClick={openNoteTypeToggled}>
          <IconCheckbox />
        </Button>
        <Button onClick={undo} disabled={!canUndo}>
          <IconArrowBackUp />
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          <IconArrowForwardUp />
        </Button>
        <Button onClick={() => window.history.back()}>
          <IconX />
        </Button>
      </Flex>
    </Drawer>
  )
}
