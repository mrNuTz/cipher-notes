import {Modal, Textarea} from '@mantine/core'
import {closeNote, openNoteChanged, selectOpenNote, useSelector} from '../store'

export const OpenNote = () => {
  const note = useSelector(selectOpenNote)
  if (!note) return null
  return (
    <Modal opened={!!note} onClose={closeNote}>
      <Textarea value={note.txt} onChange={(e) => openNoteChanged(e.target.value)} />
    </Modal>
  )
}
