import {env} from '../env'
import sg from '@sendgrid/mail'

sg.setApiKey(env.SENDGRID_API_KEY)

export const sendMail = async (to: string, subject: string, text: string) => {
  return await sg.send({to, subject, text, from: 'raphaeln@outlook.com'})
}

export const sendLoginCode = async (to: string, code: string) => {
  return await sendMail(to, 'local-launcher login code', `Your login code is: ${code}`)
}
