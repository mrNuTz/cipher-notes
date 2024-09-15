import {useComputedColorScheme} from '@mantine/core'
import {selectCurrentUrl, selectSelectedEngine, useSelector} from '../store'
import {useEffect, useRef, useState} from 'react'

export const Preview = () => {
  const engine = useSelector(selectSelectedEngine)
  const url = useSelector(selectCurrentUrl)
  const {iframe = false} = engine ?? {}
  const cs = useComputedColorScheme()
  // hide to prevent focus stealing
  const [hidden, setHidden] = useState(true)
  const ref = useRef<number | undefined>(undefined)
  useEffect(() => {
    setHidden(true)
  }, [url])
  return (
    <>
      {iframe ? (
        <iframe
          style={{colorScheme: cs, flex: 1, display: hidden ? 'none' : 'block'}}
          key={url}
          src={url}
          onLoad={() => {
            if (ref.current) clearTimeout(ref.current)
            ref.current = setTimeout(() => setHidden(false), 500)
          }}
        />
      ) : (
        <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div>no preview</div>
        </div>
      )}
    </>
  )
}
