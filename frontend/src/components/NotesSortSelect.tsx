import {Button, Select} from '@mantine/core'
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
        data={noteSortOptions}
        value={prop}
        onChange={(value) => value && sortChanged(value as NoteSortProp)}
      />
      <Button flex='0 0 auto' onClick={sortDirectionChanged}>
        {!desc ? <IconSortDescending /> : <IconSortAscending />}
      </Button>
    </>
  )
}
