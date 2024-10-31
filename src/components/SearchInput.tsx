import {TextInput} from '@mantine/core'
import {noteQueryChanged, useSelector} from '../store'

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
