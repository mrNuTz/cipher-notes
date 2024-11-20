/// <reference lib="webworker" />

import {fetchWordFrequencies} from './business/wordFrequencies'
import {levenshtein} from './util/levenshtein'
import {compare, getUniqueBy} from './util/misc'

let wordFreq: (readonly [number, string])[] = []

fetchWordFrequencies({en: true, de: true}).then((res) => {
  wordFreq = res
})

const getCompletions = (q: string, limit: number): string[] =>
  wordFreq
    .map(([f, w]) => [levenshtein(q, w.slice(0, q.length)), -f, w] as const)
    .filter(([d]) => d <= 1)
    .sort(compare)
    .slice(0, limit)
    .map(([, , w]) => w)

const getClosest = (q: string, limit: number): string[] =>
  wordFreq
    .map(([f, w]) => [levenshtein(q, w), -f, w] as const)
    .filter(([d]) => d <= 3)
    .sort(compare)
    .slice(0, limit)
    .map(([, , w]) => w)

export const getClosestAndCompletions = (q: string, limit: number): string[] => {
  const completions = getCompletions(q, limit)
  const closest = getClosest(q, limit)
  const max = Math.max(completions.length, closest.length)
  const res: string[] = []
  for (let i = 0; i < max; ++i) {
    if (i < completions.length) res.push(completions[i]!)
    if (i < closest.length) res.push(closest[i]!)
  }
  return getUniqueBy(res, (w) => w).slice(0, limit)
}
