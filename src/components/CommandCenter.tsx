import {Spotlight} from '@mantine/spotlight'

export const CommandCenter = () => {
  return (
    <Spotlight
      actions={[
        {
          id: 'addEngine',
          label: 'Add search engine',
        },
      ]}
    />
  )
}
