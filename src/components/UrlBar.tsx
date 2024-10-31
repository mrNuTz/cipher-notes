import {Button, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {FlexRow} from './misc'
import {IconExternalLink} from '@tabler/icons-react'
import {selectCurrentUrl} from '../state/search'

export const UrlBar = () => {
  const url = useSelector(selectCurrentUrl)
  return (
    <FlexRow style={{gap: '.5rem'}}>
      <TextInput disabled value={url} flex={1} />
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
