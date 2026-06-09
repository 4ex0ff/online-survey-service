import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    configurable: true,
  })
}

if (typeof globalThis.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) => {
      const randomValue = Math.floor(Math.random() * 256)
      return (Number(char) ^ (randomValue & (15 >> (Number(char) / 4)))).toString(16)
    }),
    configurable: true,
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
