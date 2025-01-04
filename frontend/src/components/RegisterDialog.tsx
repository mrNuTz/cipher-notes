import {Button, Checkbox, Modal, Stack, Text, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeRegisterDialog, registerEmail, registerEmailChanged} from '../state/user'
import {useState} from 'react'

export const RegisterDialog = () => {
  const {open, email, loading} = useSelector((state) => state.user.registerDialog)
  const [agree, setAgree] = useState(false)
  return (
    <Modal opened={open} onClose={closeRegisterDialog} title='Register Email'>
      <Stack gap='md'>
        <TextInput
          label='Email'
          value={email}
          onChange={(e) => registerEmailChanged(e.target.value)}
        />
        <Text
          style={{
            maxHeight: '7rem',
            overflowY: 'scroll',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-xs)',
          }}
          p='xs'
        >
          Terms and Conditions:
          <br />
          <br />
          You will need access to the registered email address to login (currently every 7 days).
          <br />
          <br />
          Data stored:
          <br />
          The data will be stored in a render.com Database in Frankfurt, Germany. The data includes
          your Email address and your notes including metadata (created, updated and deleted
          timestamps). The text of the notes is encrypted (using the browser native AES-GCM
          encryption), before being sent to the server.
          <br />
          The server temporarily stores your IP address in RAM for rate limiting, the IP is not
          associated with your email or other personal information.
          <br />
          <br />
          If you want to delete your account, contact me at{' '}
          <a href='mailto:raphaeln@outlook.com'>raphaeln@outlook.com</a>.
        </Text>
        <Checkbox
          label='I agree to the Terms and Conditions'
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <Button loading={loading} disabled={!email || !agree} onClick={registerEmail}>
          Register
        </Button>
      </Stack>
    </Modal>
  )
}
