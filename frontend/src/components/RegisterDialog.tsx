import {Button, Modal, Stack, TextInput} from '@mantine/core'
import {useSelector} from '../state/store'
import {closeRegisterDialog, registerEmail, registerEmailChanged} from '../state/user'

export const RegisterDialog = () => {
  const {open, email, loading} = useSelector((state) => state.user.registerDialog)
  return (
    <Modal opened={open} onClose={closeRegisterDialog} title='Register Email'>
      <Stack gap='md'>
        <TextInput
          label='Email'
          value={email}
          onChange={(e) => registerEmailChanged(e.target.value)}
        />
        <Button loading={loading} disabled={!email} onClick={registerEmail}>
          Register
        </Button>
      </Stack>
    </Modal>
  )
}
