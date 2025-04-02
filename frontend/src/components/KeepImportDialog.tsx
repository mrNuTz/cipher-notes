import {Button, FileInput, Group, Modal, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeKeepImportDialog, keepImportFileChanged, keepImportNotes} from '../state/import'

export const KeepImportDialog = () => {
  const {open, file, error} = useSelector((s) => s.import.keepImportDialog)
  return (
    <Modal opened={open} onClose={closeKeepImportDialog} title='Import notes from Keep'>
      <Text mb='sm'>Go to Google Takeout and select only Keep to export and zip as format.</Text>
      <FileInput
        value={file}
        onChange={keepImportFileChanged}
        label='Select file'
        accept='.zip'
        error={error}
      />
      <Group justify='end' mt='lg'>
        <Button onClick={keepImportNotes} disabled={!file}>
          Import
        </Button>
      </Group>
    </Modal>
  )
}
