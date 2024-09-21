import {Menu, Textarea} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import {useEffect, useState} from 'react'
import {debouncePromise, getWordBounds, spliceString} from '../util/misc'
import {comlink} from '../comlink'

const getClosestAndCompletions = debouncePromise(comlink.getClosestAndCompletions, 100, 'abort')

export const SearchBar = () => {
  const query = useSelector((s) => s.query)
  const [focus, setFocus] = useState(false)
  const [top, setTop] = useState<string[]>([])
  const [selected, setSelected] = useState(0)
  const [cursor, setCursor] = useState(0)
  const {start, end} = getWordBounds(query, cursor)
  const selectedWord = query.slice(start, end)
  useEffect(() => {
    if (selectedWord) {
      getClosestAndCompletions(selectedWord, 20)
        .then(setTop)
        .catch(() => {})
    } else {
      setTop([])
    }
  }, [selectedWord])

  return (
    <Menu opened={focus && !!selectedWord} trapFocus={false} position='bottom-start'>
      <Menu.Target>
        <Textarea
          value={query}
          onSelect={(e) => setCursor(e.currentTarget.selectionEnd)}
          onChange={(e) => {
            setSelected(0)
            queryChanged(e.target.value)
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && top.length) {
              setSelected((s) => Math.min(s + 1, top.length - 1))
              e.preventDefault()
            }
            if (e.key === 'ArrowUp' && top.length) {
              setSelected((s) => Math.max(s - 1, 0))
              e.preventDefault()
            }
            if (e.key === 'Tab' && selectedWord && !e.shiftKey) {
              if (top[selected]) {
                const {start, end} = getWordBounds(query, e.currentTarget.selectionEnd)
                const replaceWord = top[selected]
                queryChanged(
                  spliceString(query, start, end, replaceWord) + (query.length === end ? ' ' : '')
                )
                e.preventDefault()
              }
            }
          }}
          autosize
          minRows={3}
          maxRows={10}
        />
      </Menu.Target>
      {!!top.length && (
        <Menu.Dropdown>
          {top.map((w, i) => (
            <Menu.Item
              bg={selected === i ? 'cyan' : undefined}
              key={w}
              onClick={() => {
                const {start, end} = getWordBounds(query, cursor)
                queryChanged(spliceString(query, start, end, w) + (query.length === end ? ' ' : ''))
              }}
            >
              {w}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      )}
    </Menu>
  )
}
