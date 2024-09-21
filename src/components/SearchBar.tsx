import {Menu, TextInput} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import {useEffect, useState} from 'react'
import {compare, debouncePromise, delay, getUniqueBy, last, splitWords} from '../util/misc'
import {levenshtein} from '../util/levenshtein'
import {fetchWordFrequencies} from '../business/wordFrequencies'

let wordFreq: (readonly [number, string])[] = []

fetchWordFrequencies({en: true, de: true}).then((res) => {
  wordFreq = res
})

const getCompletions = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    wordFreq
      .map(([f, w]) => [levenshtein(q, w.slice(0, q.length)), -f, w] as const)
      .filter(([d]) => d <= 1)
      .sort(compare)
      .slice(0, limit)
      .map(([, , w]) => w)
  )

const getClosest = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    wordFreq
      .map(([f, w]) => [levenshtein(q, w), -f, w] as const)
      .filter(([d]) => d <= 3)
      .sort(compare)
      .slice(0, limit)
      .map(([, , w]) => w)
  )

const getClosestAndCompletions = (q: string, limit: number): Promise<string[]> =>
  Promise.all([getCompletions(q, limit), getClosest(q, limit)]).then(([completions, closest]) => {
    const max = Math.max(completions.length, closest.length)
    const res: string[] = []
    for (let i = 0; i < max; ++i) {
      if (i < completions.length) res.push(completions[i])
      if (i < closest.length) res.push(closest[i])
    }
    return getUniqueBy(res, (w) => w).slice(0, limit)
  })

const debouncedGetClosestAndCompletions = debouncePromise(getClosestAndCompletions, 150, 'abort')

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
