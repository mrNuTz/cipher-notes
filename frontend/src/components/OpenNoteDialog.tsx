import {Button, Flex, Modal, Textarea} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeNote, openNoteChanged, deleteOpenNote} from '../state/notes'
import {modals} from '@mantine/modals'
import {useRef} from 'react'
import {IconArrowBackUp} from './icons/IconArrowBackUp'
import {IconArrowForwardUp} from './icons/IconArrowForwardUp'

export const OpenNoteDialog = () => {
  const note = useSelector((s) => s.notes.openNote)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  return (
    <Modal
      opened={!!note}
      onClose={closeNote}
      title='Note'
      styles={{
        content: {flex: 1},
        body: {display: 'flex', flexDirection: 'column', gap: '1rem'},
      }}
    >
      <Textarea
        value={note?.txt}
        onChange={(e) => openNoteChanged(e.target.value)}
        autosize
        minRows={5}
        styles={{input: {fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace"}}}
        ref={inputRef}
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
        <Button onClick={() => void document.execCommand('undo')}>
          <IconArrowBackUp />
        </Button>
        <Button onClick={() => void document.execCommand('redo')}>
          <IconArrowForwardUp />
        </Button>
      </Flex>
    </Modal>
  )
}
