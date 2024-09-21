import {selectCurrentUrl, selectSelectedEngine, useSelector} from '../store'
import {useEffect, useRef, useState} from 'react'
import {useDebouncedValue} from '@mantine/hooks'

export const Preview = () => {
  const engine = useSelector(selectSelectedEngine)
  const url = useSelector(selectCurrentUrl)
  const queryEmpty = useSelector((s) => s.query.length === 0)
  const {iframe = false} = engine ?? {}
  const [debouncedUrl] = useDebouncedValue(url, 500)
  // hide to prevent focus stealing
  const [hidden, setHidden] = useState(true)
  const ref = useRef<number | undefined>(undefined)
  useEffect(() => {
    setHidden(true)
  }, [url])
  return (
    <>
      {iframe && !queryEmpty ? (
        <iframe
          style={{flex: 1, display: hidden ? 'none' : 'block'}}
          key={debouncedUrl}
          src={debouncedUrl}
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
