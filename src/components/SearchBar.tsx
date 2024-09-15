import {Menu, TextInput} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import wordsUrl from '../assets/words.txt'
import {useState} from 'react'
import {bySelector, debouncePromise, delay, getUniqueBy, last, splitWords} from '../util/misc'
import {levenshtein} from '../util/levenshtein'

let words: string[] = []
fetch(wordsUrl)
  .then((res) => res.text())
  .then((txt) => (words = txt.split('\n')))

const getCompletions = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    words
      .map((w) => [levenshtein(q, w.slice(0, q.length)), w] as const)
      .sort(bySelector((i) => i[0]))
      .slice(0, limit)
      .map(([, w]) => w)
  )

const getClosest = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    words
      .map((w) => [levenshtein(q, w), w] as const)
      .sort(bySelector((i) => i[0]))
      .slice(0, limit)
      .map(([, w]) => w)
  )

const getClosestAndCompletions = (q: string, limit: number): Promise<string[]> =>
  Promise.all([getCompletions(q, limit), getClosest(q, limit)]).then(([completions, closest]) =>
    getUniqueBy(
      completions.flatMap((c, i) => (closest.length > i ? [c, closest[i]] : [c])),
      (w) => w
    ).slice(0, limit)
  )

const debounced = debouncePromise(getClosestAndCompletions, 500, 'aborted')

export const SearchBar = () => {
  const query = useSelector((s) => s.query)
  const lastWord = last(splitWords(query)) ?? ''
  const [focus, setFocus] = useState(false)
  const [top, setTop] = useState<string[]>([])
  const [selected, setSelected] = useState(0)

  debounced(lastWord, 20)
    .then(setTop)
    .catch(() => {})

  return (
    <Menu opened={focus && !!lastWord} trapFocus={false} position='bottom-start'>
      <Menu.Target>
        <TextInput
          flex={1}
          value={query}
          onChange={(e) => queryChanged(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, top.length - 1))
            if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0))
            if (e.key === 'Enter') {
              queryChanged(query.replace(/[^\t\n ]+$/, top[selected]))
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
            onClick={() => queryChanged(query.replace(/[^\t\n ]+$/, w))}
          >
            {w}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
