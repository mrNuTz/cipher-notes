import {Tabs} from '@mantine/core'
import {tabChanged, useSelector} from '../state/store'
import {SearchTab} from './SearchTab'
import {NotesTab} from './NotesTab'

export const MainTabs = () => {
  const activeTab = useSelector((s) => s.activeTab)

  return (
    <Tabs
      value={activeTab}
      onChange={tabChanged}
      style={{flex: 1, display: 'flex', flexDirection: 'column'}}
    >
      <Tabs.List justify='center'>
        <Tabs.Tab value='search'>Search</Tabs.Tab>
        <Tabs.Tab value='notes'>Notes</Tabs.Tab>
      </Tabs.List>

      <SearchTab />
      <NotesTab />
    </Tabs>
  )
}
