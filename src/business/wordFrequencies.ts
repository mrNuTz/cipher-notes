import wf_en_url from '../assets/word_frequencies_en.txt'
import wf_de_url from '../assets/word_frequencies_de.txt'

const urls = {
  en: wf_en_url,
  de: wf_de_url,
}
type LangKey = keyof typeof urls

export type WordFrequency = readonly [number, string]

const fetchWordFrequenciesByLang = (lang: keyof typeof urls): Promise<WordFrequency[]> =>
  fetch(urls[lang], {cache: 'force-cache'})
    .then((res) => res.text())
    .then((txt) =>
      txt
        .split('\n')
        .map((l) => {
          const s = l.split('\t')
          return [Number(s[2]), s[1]] as const
        })
        .filter(([f, w]) => isFinite(f) && w && !w.includes(' '))
    )

export type LanguageSelection = {[K in LangKey]?: boolean}
export const fetchWordFrequencies = (langs: LanguageSelection): Promise<WordFrequency[]> =>
  Promise.all(
    Object.entries(langs)
      .filter(([, v]) => v)
      .map(([lang]) => fetchWordFrequenciesByLang(lang as LangKey))
  ).then((res) => res.flat())
