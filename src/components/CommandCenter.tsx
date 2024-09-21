import {Spotlight} from '@mantine/spotlight'

export const CommandCenter = () => {
  return (
    <Spotlight
      shortcut={['Ctrl + K', 'Cmd + K']}
      actions={[
        {
          id: 'addEngine',
          label: 'Add search engine',
        },
      ]}
    />
  )
}
