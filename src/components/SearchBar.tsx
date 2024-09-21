import {Menu, TextInput} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import {useEffect, useState} from 'react'
import {debouncePromise, last, splitWords} from '../util/misc'
import {comlink} from '../comlink'

const debouncedGetClosestAndCompletions = debouncePromise(
  comlink.getClosestAndCompletions,
  150,
  'abort'
)

export const SearchBar = () => {
  const query = useSelector((s) => s.query)
  const lastWord = last(splitWords(query)) ?? ''
  const [focus, setFocus] = useState(false)
  const [top, setTop] = useState<string[]>([])
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    debouncedGetClosestAndCompletions(lastWord, 20)
      .then(setTop)
      .catch(() => {})
  }, [lastWord])

  return (
    <Menu opened={focus && !!lastWord} trapFocus={false} position='bottom-start'>
      <Menu.Target>
        <TextInput
          flex={1}
          value={query}
          onChange={(e) => {
            setSelected(0)
            queryChanged(e.target.value)
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, top.length - 1))
            if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0))
            if (e.key === 'Tab' && lastWord) {
              queryChanged(query.replace(/[^\t\n ]+$/, top[selected]) + ' ')
              e.preventDefault()
            }
          }}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {top.map((w, i) => (
          <Menu.Item
            bg={selected === i ? 'cyan' : undefined}
            key={w}
            onClick={() => queryChanged(query.replace(/[^\t\n ]+$/, w) + ' ')}
          >
            {w}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
