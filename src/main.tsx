import React from 'react'
import ReactDOM from 'react-dom/client'
import '@mantine/core/styles.css'
import {MantineProvider} from '@mantine/core'

import {App} from './App.tsx'
import {theme} from './theme.ts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
)
