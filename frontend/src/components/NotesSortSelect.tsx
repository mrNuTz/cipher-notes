import {ActionIcon, Select} from '@mantine/core'
import {useSelector} from '../state/store'
import {sortChanged, sortDirectionChanged} from '../state/notes'
import {noteSortOptions, NoteSortProp} from '../business/models'
import {IconSortAscending} from './icons/IconSortAscending'
import {IconSortDescending} from './icons/IconSortDescending'

export const NotesSortSelect = () => {
  const {prop, desc} = useSelector((state) => state.notes.sort)
  return (
    <>
      <Select
        flex='0 0 auto'
        w='7rem'
        data={noteSortOptions}
        value={prop}
        onChange={(value) => value && sortChanged(value as NoteSortProp)}
      />
      <ActionIcon size='lg' onClick={sortDirectionChanged}>
        {!desc ? <IconSortDescending /> : <IconSortAscending />}
      </ActionIcon>
    </>
  )
}
