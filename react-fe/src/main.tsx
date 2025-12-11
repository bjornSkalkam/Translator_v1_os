import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthThemeProvider } from './context/AuthThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthThemeProvider>
      <App />
    </AuthThemeProvider>
  </StrictMode>,
)
