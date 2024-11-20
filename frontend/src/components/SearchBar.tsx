import {Menu, Textarea} from '@mantine/core'
import {useSelector} from '../state/store'
import {useEffect, useState} from 'react'
import {debouncePromise, getWordBounds, spliceString} from '../util/misc'
import {comlink} from '../comlink'
import {queryChanged} from '../state/search'

const getClosestAndCompletions = debouncePromise(comlink.getClosestAndCompletions, 100, 'abort')

export const SearchBar = () => {
  const query = useSelector((s) => s.search.query)
  const [focus, setFocus] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [index, setIndex] = useState(-1)
  const [cursor, setCursor] = useState(0)

  const {start, end} = getWordBounds(query, cursor)
  const selectedWord = query.slice(start, end)
  useEffect(() => {
    if (selectedWord) {
      getClosestAndCompletions(selectedWord, 10)
        .then(setSuggestions)
        .catch(() => {})
    } else {
      setSuggestions([])
    }
  }, [selectedWord])

  return (
    <Menu opened={focus && !!selectedWord} trapFocus={false} position='bottom-start'>
      <Menu.Target>
        <Textarea
          value={query}
          onSelect={(e) => setCursor(e.currentTarget.selectionEnd)}
          onChange={(e) => {
            setIndex(-1)
            queryChanged(e.target.value)
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSuggestions([])
              setIndex(-1)
            }
            if (e.key === 'ArrowDown' && suggestions.length) {
              setIndex((i) => Math.min(i + 1, suggestions.length - 1))
              e.preventDefault()
            }
            if (e.key === 'ArrowUp' && suggestions.length) {
              setIndex((i) => Math.max(i - 1, 0))
              e.preventDefault()
            }
            if (e.key === 'Tab' && selectedWord && !e.shiftKey && suggestions[index]) {
              const {start, end} = getWordBounds(query, e.currentTarget.selectionEnd)
              const replaceWord = suggestions[index]
              queryChanged(
                spliceString(query, start, end, replaceWord) + (query.length === end ? ' ' : '')
              )
              e.preventDefault()
            }
          }}
          autosize
          minRows={3}
          maxRows={10}
        />
      </Menu.Target>
      {!!suggestions.length && (
        <Menu.Dropdown>
          {suggestions.map((w, i) => (
            <Menu.Item
              bg={index === i ? 'cyan' : undefined}
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
