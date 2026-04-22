import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/app/router'
import { AppDataProvider } from '@/hooks/useAppData'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <AppRouter />
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>
)
