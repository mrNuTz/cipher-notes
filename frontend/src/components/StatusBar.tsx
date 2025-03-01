import {Flex, Text} from '@mantine/core'
import {useSelector} from '../state/store'
import {useLiveQuery} from 'dexie-react-hooks'
import {db} from '../db'

export const StatusBar = () => {
  const {email, loggedIn} = useSelector((state) => state.user.user)
  const registered = !!email
  const numDirtyNotes = useLiveQuery(() => db.notes.where('state').equals('dirty').count())
  if (!registered) return null
  return (
    <Flex p='xs' justify='space-between' bg='rgba(0,0,0,.1)'>
      <Text size='xs'>
        {email} logged {loggedIn ? 'in' : 'out'}
      </Text>
      {!!numDirtyNotes && <Text size='xs'>{numDirtyNotes} unsynced notes</Text>}
    </Flex>
  )
}
