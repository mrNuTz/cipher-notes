import {Checkbox, Stack, UnstyledButton, TextInput} from '@mantine/core'
import {useLiveQuery} from 'dexie-react-hooks'
import {useState} from 'react'
import {useSelector} from '../state/store'
import {db} from '../db'
import {IconSearch} from './icons/IconSearch'
import {IconX} from './icons/IconX'
import {toggleNoteLabel} from '../state/labels'

export type LabelDropdownContentProps = {
  noteId: string
}
export const LabelDropdownContent = ({noteId}: LabelDropdownContentProps) => {
  const [search, setSearch] = useState('')
  const labelsCache = useSelector((state) => state.labels.labelsCache)
  const labels = Object.values(labelsCache)
  const checkedLabels: string[] =
    useLiveQuery(() => db.notes.get(noteId).then((note) => note?.labels ?? []), [noteId]) ?? []
  return (
    <>
      <TextInput
        label='Label'
        rightSection={
          <UnstyledButton
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            onClick={() => setSearch('')}
          >
            {search.length === 0 ? <IconSearch /> : <IconX />}
          </UnstyledButton>
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Stack mah={200} style={{overflowY: 'auto'}} mt='md' gap='xs'>
        {labels
          .filter((label) => label.name.toLowerCase().includes(search.toLowerCase()))
          .map((label) => (
            <Checkbox
              key={label.id}
              label={label.name}
              checked={checkedLabels.includes(label.id)}
              onChange={() => toggleNoteLabel(noteId, label.id)}
              size='md'
            />
          ))}
      </Stack>
    </>
  )
}
