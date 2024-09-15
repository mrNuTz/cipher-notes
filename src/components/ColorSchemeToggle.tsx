import {Button, useComputedColorScheme, useMantineColorScheme} from '@mantine/core'
import {IconMoon, IconSun} from '@tabler/icons-react'

export const ColorSchemeToggle = () => {
  const {toggleColorScheme} = useMantineColorScheme()
  const cs = useComputedColorScheme()
  return (
    <Button tabIndex={999} onClick={toggleColorScheme}>
      {cs === 'light' ? <IconMoon /> : <IconSun />}
    </Button>
  )
}
