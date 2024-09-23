import {ComboboxItem, Select} from '@mantine/core'
import {engineSelected, selectEngineOptions, useSelector} from '../store'
import {compare} from '../util/misc'
import {levenshtein} from '../util/levenshtein'

export const EngineSelect = () => {
  const options = useSelector(selectEngineOptions)
  const value = useSelector((s) => s.selectedEngine)
  return (
    <Select
      autoFocus
      searchable
      filter={({limit, options, search}) =>
        (options as ComboboxItem[])
          .map((o) => [levenshtein(o.label.slice(0, search.length), search), o] as const)
          .sort(compare)
          .filter(([d]) => d <= 1)
          .map(([, o]) => o)
          .slice(0, limit)
      }
      withScrollArea={false}
      flex={1}
      styles={{dropdown: {maxHeight: 500, overflow: 'auto'}}}
      clearable
      data={options}
      value={value}
      onChange={(val) => engineSelected(val)}
    />
  )
}
