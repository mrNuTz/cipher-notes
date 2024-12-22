import {Button, Flex, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {selectCurrentUrl} from '../state/search'
import {IconExternalLink} from './icons/IconExternalLink'

export const UrlBar = () => {
  const url = useSelector(selectCurrentUrl)
  return (
    <Flex gap='xs'>
      <TextInput disabled value={url} flex={1} />
      <Button
        onClick={() => {
          window.open(url, '_blank')
        }}
      >
        <IconExternalLink />
      </Button>
    </Flex>
  )
}
