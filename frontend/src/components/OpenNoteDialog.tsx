import {Button, Modal, Textarea} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeNote, openNoteChanged, deleteOpenNote} from '../state/notes'
import {modals} from '@mantine/modals'

export const OpenNoteDialog = () => {
  const note = useSelector((s) => s.notes.openNote)
  return (
    <Modal
      opened={!!note}
      onClose={closeNote}
      title='Note'
      styles={{
        content: {flex: 1},
        body: {display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'start'},
      }}
    >
      <Textarea
        w='100%'
        value={note?.txt}
        onChange={(e) => openNoteChanged(e.target.value)}
        autosize
        minRows={5}
        styles={{input: {fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace"}}}
      />
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
    </Modal>
  )
}
