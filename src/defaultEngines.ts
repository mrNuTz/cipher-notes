export type Engine = {
  url: string
  name: string
  iframe?: boolean
}
export const defaultEngines: readonly Engine[] = Object.freeze([
  {name: 'Dict', url: 'https://www.dict.cc/?s=%s', iframe: true},
  {name: 'Brave', url: 'https://search.brave.com/search?q=%s'},
  {name: 'GMX', url: 'https://search.gmx.com/web/result?q=%s&origin=web&comp=web_start_sf&p=gmx-com'},
  {name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?title=Special:Search&search=%s', iframe: true},
  {name: 'MDN', url: 'https://developer.mozilla.org/search?q=%s'},
  {name: 'Duden', url: 'https://www.duden.de/suchen/dudenonline/%s'},
  {name: 'DIGITAL.CSIC', url: 'https://digital.csic.es/simple-search?query=%s'},
  {name: 'SoundCloud', url: 'https://soundcloud.com/search?q=%s'},
  {name: 'Python', url: 'https://docs.python.org/3/search.html?q=%s&check_keywords=yes&area=default', iframe: true},
  {name: 'Git', url: 'https://git-scm.com/search/results?search=%s'},
  {name: 'PyPI', url: 'https://pypi.org/search/?q=%s'},
  {name: 'CTAN', url: 'https://ctan.org/search?phrase=%s', iframe: true},
  {name: 'tex.stackexchange', url: 'https://tex.stackexchange.com/search?q=%s'},
  {name: 'Google Scholar', url: 'https://scholar.google.at/scholar?q=%s'},
  {name: 'Searchalot', url: 'https://www.searchalot.com/?q=%s'},
  {name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s'},
  {name: 'DuckDuckLight', url: 'https://lite.duckduckgo.com/lite/?q=%s'},
  {name: 'matplotlib', url: 'https://matplotlib.org/stable/search.html?q=%s', iframe: true},
  {name: 'pandas', url: 'https://pandas.pydata.org/docs/search.html?q=%s', iframe: true},
  {name: 'who.is', url: 'https://who.is/whois-ip/ip-address/%s', iframe: true},
  {name: 'Yarn', url: 'https://yarnpkg.com/?q=%s', iframe: true},
  {name: 'GitHub', url: 'https://github.com/search?q=%s&ref=opensearch'},
  {name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s'},
  {name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s'},
  {name: 'amazon.de', url: 'https://www.amazon.de/s?k=%s'},
  {name: 'Google', url: 'https://www.google.com/search?q=%s'},
  {name: 'Bing', url: 'https://www.bing.com/search?q=%s', iframe: true},
])
