import {useComputedColorScheme} from '@mantine/core'
import {selectSelectedEngine, useSelector} from '../store'

export const Preview = () => {
  const engine = useSelector(selectSelectedEngine)
  const {url = '', iframe = false} = engine ?? {}
  const cs = useComputedColorScheme()
  return (
    <>
      {iframe ? (
        <iframe style={{colorScheme: cs, flex: 1}} key={url} src={url} />
      ) : (
        <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div>no preview</div>
        </div>
      )}
    </>
  )
}
