import {Button, TextInput} from '@mantine/core'
import {selectCurrentUrl, useSelector} from '../store'
import {FlexRow} from './misc'
import {IconExternalLink} from '@tabler/icons-react'

export const UrlBar = () => {
  const url = useSelector(selectCurrentUrl)
  return (
    <FlexRow>
      <TextInput readOnly value={url} flex={1} />
      <Button
        onClick={() => {
          window.open(url, '_blank')
        }}
      >
        <IconExternalLink />
      </Button>
    </FlexRow>
  )
}
