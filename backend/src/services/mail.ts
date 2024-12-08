import {env} from '../env'
import sg from '@sendgrid/mail'

sg.setApiKey(env.SENDGRID_API_KEY)

export const sendMail = async (to: string, subject: string, text: string, html?: string) => {
  return await sg.send({to, subject, text, html, from: 'raphaeln@outlook.com'})
}

export const sendLoginCode = async (to: string, code: string) => {
  return await sendMail(
    to,
    'cipher-notes login code',
    `Your login code is: ${code}`,
    `<p>Your login code is: <b>${code}</b></p>`
  )
}
