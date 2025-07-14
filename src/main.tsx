import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BatteryTracker from './page'

const rootElement = document.getElementById('root') as HTMLElement
createRoot(rootElement).render(
  <StrictMode>
    <BatteryTracker />
  </StrictMode>,
)
