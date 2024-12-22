import {Button} from '@mantine/core'
import {spotlight} from '@mantine/spotlight'
import {IconCommand} from './icons/IconCommand'

export const CommandButton = () => (
  <Button
    onClick={spotlight.open}
    pos='absolute'
    top='0.25rem'
    right='0.25rem'
    size='compact-sm'
    tabIndex={-1}
  >
    <IconCommand />
  </Button>
)
