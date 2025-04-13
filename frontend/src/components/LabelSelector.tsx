import {
  ActionIcon,
  Drawer,
  Flex,
  Group,
  Stack,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  deleteLabel,
  openCreateLabelDialog,
  openEditLabelDialog,
  toggleActiveLabel,
  toggleLabelSelector,
} from '../state/labels'
import {byProp} from '../util/misc'
import {darkModeSaturation, lightModeLightness, lightModeSaturation} from '../config'
import {darkModeLightness} from '../config'
import {IconPencil} from './icons/IconPencil'
import {IconTrash} from './icons/IconTrash'
import {modals} from '@mantine/modals'
import {IconPlus} from './icons/IconPlus'

export const LabelSelector = () => {
  const {activeLabel, labelSelectorOpen, labelsCache} = useSelector((state) => state.labels)
  const labels = Object.values(labelsCache).sort(byProp('created_at'))
  const {colorScheme} = useMantineColorScheme()
  const saturation = colorScheme === 'dark' ? darkModeSaturation : lightModeSaturation
  const lightness = colorScheme === 'dark' ? darkModeLightness : lightModeLightness

  return (
    <Drawer
      title='Labels'
      opened={labelSelectorOpen}
      onClose={toggleLabelSelector}
      styles={{content: {position: 'relative'}}}
    >
      <Stack gap='xs' my='md'>
        {labels.map((label) => (
          <Flex
            key={label.id}
            align='center'
            bd={activeLabel === label.id ? '2px solid var(--mantine-color-bright)' : 'none'}
            p='xs'
            style={{borderRadius: 'var(--mantine-radius-md)', outlineOffset: '2px'}}
            bg={
              label.hue === null
                ? 'var(--mantine-color-body)'
                : `hsl(${label.hue},${saturation}%,${lightness}%)`
            }
          >
            <UnstyledButton flex={1} onClick={() => toggleActiveLabel(label.id)}>
              {label.name}
            </UnstyledButton>
            <Group>
              <UnstyledButton
                onClick={(e) => {
                  e.stopPropagation()
                  openEditLabelDialog(label.id)
                }}
              >
                <IconPencil />
              </UnstyledButton>
              <UnstyledButton
                onClick={(e) => {
                  e.stopPropagation()
                  modals.openConfirmModal({
                    title: 'Delete Label',
                    children: 'Are you sure you want to delete this label?',
                    labels: {confirm: 'Delete', cancel: 'Cancel'},
                    onConfirm: () => deleteLabel(label.id),
                  })
                }}
              >
                <IconTrash />
              </UnstyledButton>
            </Group>
          </Flex>
        ))}
      </Stack>
      <Flex justify='end'>
        <ActionIcon size='xl' onClick={openCreateLabelDialog}>
          <IconPlus />
        </ActionIcon>
      </Flex>
    </Drawer>
  )
}
