import {Button, Drawer, Flex} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  openNoteClosed,
  openNoteTxtChanged,
  deleteOpenNote,
  openNoteHistoryHandler,
  deleteTodo,
  insertTodo,
  todoChanged,
  todoChecked,
  openNoteTypeToggled,
  openNoteTitleChanged,
  moveTodo,
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
    openNoteHistoryHandler,
    500,
    openNote?.id ?? null
  )
  const open = !!openNote
  useEffect(() => {
    if (open) {
      window.history.pushState({dialogOpen: true}, '', location.href)
      window.addEventListener('popstate', openNoteClosed)
    }
    return () => {
      window.removeEventListener('popstate', openNoteClosed)
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
      <input
        id='open-note-title'
        style={{
          border: 'none',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          outline: 'none',
          background: 'transparent',
        }}
        placeholder='Title'
        type='text'
        value={openNote?.title ?? ''}
        onChange={(e) => openNoteTitleChanged(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' ||
            (e.key === 'ArrowDown' && e.currentTarget.selectionEnd === openNote?.title.length)
          ) {
            e.preventDefault()
            e.stopPropagation()
            if (openNote?.type === 'todo' && openNote.todos.every((t) => t.done)) {
              insertTodo(0)
            }
            const parent = e.currentTarget.parentElement
            Promise.resolve().then(() => parent?.querySelector('textarea')?.focus())
          }
        }}
      />
      {openNote?.type === 'note' ? (
        <XTextarea
          placeholder='Note text'
          value={openNote?.txt ?? ''}
          onChange={openNoteTxtChanged}
          onUndo={undo}
          onRedo={redo}
          onUp={focusTitleInput}
        />
      ) : openNote?.type === 'todo' ? (
        <TodoControl
          todos={openNote.todos}
          onTodoChecked={todoChecked}
          onTodoChanged={todoChanged}
          onInsertTodo={insertTodo}
          onTodoDeleted={deleteTodo}
          onMoveTodo={moveTodo}
          onUndo={undo}
          onRedo={redo}
          onUp={focusTitleInput}
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

const focusTitleInput = () => {
  const input = document.getElementById('open-note-title') as HTMLInputElement | null
  if (input) {
    input.focus()
  }
}
