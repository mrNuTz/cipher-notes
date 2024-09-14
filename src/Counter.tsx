import {Button} from '@mantine/core'
import {inc, useSelector} from './store'

export const Counter = () => {
  const count = useSelector((s) => s.count)
  return <Button onClick={inc}>count: {count}</Button>
}
