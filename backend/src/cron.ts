import {cleanupDb} from './business/cleanup'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const startCronJobs = () => {
  setTimeout(() => {
    cleanupDb().catch(console.error)
  }, 1000)

  setInterval(() => {
    cleanupDb().catch(console.error)
  }, WEEK_MS)
}
