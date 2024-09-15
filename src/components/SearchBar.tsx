import {Menu, TextInput} from '@mantine/core'
import {queryChanged, useSelector} from '../store'
import wordsUrl from '../assets/words.txt'
import {useState} from 'react'
import {bySelector, last, splitWords} from '../util/misc'
import {levenshtein} from '../util/levenshtein'

let words: string[] = []
fetch(wordsUrl)
  .then((res) => res.text())
  .then((txt) => (words = txt.split('\n')))

const getTopTen = (q: string) =>
  words
    .map((w) => [levenshtein(q, w), w])
    .sort(bySelector((i) => i[0]))
    .slice(0, 10)
    .map(([, w]) => w)

export const SearchBar = () => {
  const query = useSelector((s) => s.query)
  const lastWord = last(splitWords(query)) ?? ''
  const [focus, setFocus] = useState(false)
  return (
    <Menu opened={focus} trapFocus={false}>
      <Menu.Target>
        <TextInput
          flex={1}
          value={query}
          onChange={(e) => queryChanged(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {getTopTen(lastWord).map((w) => (
          <Menu.Item key={w}>{w}</Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
