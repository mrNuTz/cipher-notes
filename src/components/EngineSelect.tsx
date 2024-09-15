import {Select} from '@mantine/core'
import {engineSelected, selectEngineOptions, useSelector} from '../store'

export const EngineSelect = () => {
  const options = useSelector(selectEngineOptions)
  const value = useSelector((s) => s.selectedEngine)
  return <Select searchable data={options} value={value} onChange={(val) => engineSelected(val)} />
}
