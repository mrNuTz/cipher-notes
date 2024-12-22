import {TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {noteQueryChanged} from '../state/notes'
import {IconSearch} from './icons/IconSearch'

export const SearchInput = () => {
  const query = useSelector((s) => s.notes.query)
  return (
    <TextInput
      w='17.3rem'
      value={query}
      onChange={(e) => noteQueryChanged(e.target.value)}
      rightSection={<IconSearch />}
    />
  )
}
