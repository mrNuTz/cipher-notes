import {TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {noteQueryChanged} from '../state/notes'

export const SearchInput = () => {
  const query = useSelector((s) => s.notes.query)
  return (
    <TextInput
      w={500}
      placeholder='search'
      value={query}
      onChange={(e) => noteQueryChanged(e.target.value)}
    />
  )
}
