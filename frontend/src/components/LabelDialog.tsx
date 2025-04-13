import {ActionIcon, Button, Group, Modal, TextInput, useMantineColorScheme} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  closeLabelDialog,
  createLabel,
  labelDialogHueChanged,
  labelDialogNameChanged,
  updateLabel,
} from '../state/labels'
import {hueOptions} from '../business/models'
import {
  darkModeLightness,
  darkModeSaturation,
  lightModeLightness,
  lightModeSaturation,
} from '../config'

export const LabelDialog = () => {
  const {hue, name, open, id} = useSelector((state) => state.labels.dialog)
  const {colorScheme} = useMantineColorScheme()
  const saturation = colorScheme === 'dark' ? darkModeSaturation : lightModeSaturation
  const lightness = colorScheme === 'dark' ? darkModeLightness : lightModeLightness
  return (
    <Modal opened={open} onClose={closeLabelDialog} title={id ? 'Edit Label' : 'Create Label'}>
      <TextInput
        label='Name'
        value={name}
        onChange={(e) => labelDialogNameChanged(e.target.value)}
      />
      <Group my='md' gap='xs'>
        {hueOptions.map((h) => (
          <ActionIcon
            key={String(h)}
            size='lg'
            variant={'default'}
            style={{border: h === hue ? '2px solid black' : 'none', outline: 'none'}}
            id={String(h)}
            onClick={() => labelDialogHueChanged(h)}
            c='var(--mantine-color-text)'
            bg={h === null ? 'var(--mantine-color-body)' : `hsl(${h},${saturation}%,${lightness}%)`}
          >
            {h === null ? '-' : h}
          </ActionIcon>
        ))}
      </Group>
      <Button onClick={() => (id ? updateLabel(id, {name, hue}) : createLabel(name, hue))}>
        {id ? 'Update' : 'Create'}
      </Button>
    </Modal>
  )
}
