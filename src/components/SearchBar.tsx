import {Menu, TextInput} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import wordsFreqUrl from '../assets/word_frequencies.txt'
import {useEffect, useState} from 'react'
import {compare, delay, getUniqueBy, last, splitWords} from '../util/misc'
import {levenshtein} from '../util/levenshtein'

const noneWord = /\W/

let wordFreq: (readonly [number, string])[] = []
fetch(wordsFreqUrl, {cache: 'force-cache'})
  .then((res) => res.text())
  .then((txt) =>
    txt
      .split('\n')
      .map((l) => {
        const s = l.split('\t')
        return [Number(s[2]), s[1]] as const
      })
      .filter(([, w]) => !noneWord.test(w))
  )
  .then((w) => (wordFreq = w))

const getCompletions = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    wordFreq
      .map(([f, w]) => [levenshtein(q, w.slice(0, q.length)), -f, w] as const)
      .sort(compare)
      .slice(0, limit)
      .map(([, , w]) => w)
  )

const getClosest = (q: string, limit: number): Promise<string[]> =>
  delay(0).then(() =>
    wordFreq
      .map(([f, w]) => [levenshtein(q, w), -f, w] as const)
      .sort(compare)
      .slice(0, limit)
      .map(([, , w]) => w)
  )

const getClosestAndCompletions = (q: string, limit: number): Promise<string[]> =>
  Promise.all([getCompletions(q, limit), getClosest(q, limit)]).then(([completions, closest]) =>
    getUniqueBy(
      completions.flatMap((c, i) => (closest.length > i ? [c, closest[i]] : [c])),
      (w) => w
    ).slice(0, limit)
  )

export const SearchBar = () => {
  const query = useSelector((s) => s.query)
  const lastWord = last(splitWords(query)) ?? ''
  const [focus, setFocus] = useState(false)
  const [top, setTop] = useState<string[]>([])
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    getClosestAndCompletions(lastWord, 20)
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
