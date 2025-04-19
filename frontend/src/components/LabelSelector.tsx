import {
  ActionIcon,
  Box,
  Drawer,
  Flex,
  Group,
  Paper,
  Stack,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core'
import {useSelector} from '../state/store'
import {
  deleteLabel,
  openCreateLabelDialog,
  openEditLabelDialog,
  labelSelected,
  toggleLabelSelector,
  allLabelsSelected,
  unlabeledSelected,
  selectCachedLabels,
} from '../state/labels'
import {IconPencil} from './icons/IconPencil'
import {IconTrash} from './icons/IconTrash'
import {modals} from '@mantine/modals'
import {IconPlus} from './icons/IconPlus'
import {labelColor} from '../business/misc'

export const LabelSelector = () => {
  const {activeLabel, labelSelectorOpen} = useSelector((state) => state.labels)
  const labels = useSelector(selectCachedLabels)
  const colorScheme = useComputedColorScheme()

  return (
    <Drawer
      title='Labels'
      opened={labelSelectorOpen}
      onClose={toggleLabelSelector}
      styles={{content: {position: 'relative'}}}
    >
      <Stack gap='xs' my='md'>
        <Box
          ta='left'
          bd={activeLabel === null ? '2px solid var(--mantine-color-bright)' : 'none'}
          p='xs'
          style={{borderRadius: 'var(--mantine-radius-md)', outlineOffset: '2px'}}
          bg='var(--mantine-color-dimmed)'
          onClick={() => {
            allLabelsSelected()
            toggleLabelSelector()
          }}
          component='button'
        >
          All notes
        </Box>
        <Paper
          shadow='md'
          ta='left'
          bd={activeLabel === false ? '2px solid var(--mantine-color-bright)' : 'none'}
          p='xs'
          style={{borderRadius: 'var(--mantine-radius-md)', outlineOffset: '2px'}}
          onClick={() => {
            unlabeledSelected()
            toggleLabelSelector()
          }}
          bg='var(--mantine-color-body)'
          component='button'
        >
          Unlabeled
        </Paper>
        {labels.map((label) => (
          <Flex
            key={label.id}
            align='center'
            bd={activeLabel === label.id ? '2px solid var(--mantine-color-bright)' : 'none'}
            p='xs'
            style={{borderRadius: 'var(--mantine-radius-md)', outlineOffset: '2px'}}
            bg={labelColor(label.hue, colorScheme === 'dark')}
          >
            <UnstyledButton
              flex={1}
              onClick={() => {
                labelSelected(label.id)
                toggleLabelSelector()
              }}
            >
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
