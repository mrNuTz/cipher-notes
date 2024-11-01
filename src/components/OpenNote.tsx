import {Modal, Textarea} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeNote, openNoteChanged, selectOpenNote} from '../state/notes'

export const OpenNote = () => {
  const note = useSelector(selectOpenNote)
  return (
    <Modal opened={!!note} onClose={closeNote} title='Note' styles={{content: {flex: 1}}}>
      <Textarea
        value={note?.txt}
        onChange={(e) => openNoteChanged(e.target.value)}
        autosize
        minRows={5}
        styles={{input: {fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace"}}}
      />
    </Modal>
  )
}
