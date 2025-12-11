import React, { createContext, useState, useEffect, useContext } from 'react'
import { API_KEY } from '../config'

/**
 * AuthThemeContext - Handles authentication and theming for embedded deployments
 *
 * ## Iframe/Embedded Authentication
 *
 * When the translator app is embedded in a parent application (e.g., Microsoft Teams,
 * SharePoint, or a custom portal), the parent window can send authentication tokens
 * and theme preferences via postMessage.
 *
 * ### Parent Window Integration
 *
 * The parent application should send messages in this format:
 *
 * ```javascript
 * // Send authentication token (JWT from Microsoft Entra or other IdP)
 * iframe.contentWindow.postMessage({
 *   type: 'auth',
 *   token: 'eyJhbGciOiJSUzI1NiIs...'  // JWT token
 * }, '*');
 *
 * // Send theme preference
 * iframe.contentWindow.postMessage({
 *   type: 'theme',
 *   mode: 'dark'  // or 'light'
 * }, '*');
 * ```
 *
 * ### Standalone/Development Mode
 *
 * When running standalone (not in an iframe), the app falls back to using
 * the API_KEY from environment variables after a 1-second timeout.
 */

interface AuthThemeContextType {
  token: string | null
  theme: 'light' | 'dark' | null
}

const AuthThemeContext = createContext<AuthThemeContextType>({
  token: null,
  theme: null,
})

export const useAuthTheme = () => useContext(AuthThemeContext)

export const AuthThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, token, mode } = event.data || {}

      // Receive JWT token from parent window (iframe embedding)
      if (type === 'auth' && token) {
        setToken(token)
      }

      // Receive theme preference from parent window
      if (type === 'theme' && (mode === 'light' || mode === 'dark')) {
        setTheme(mode)
        document.documentElement.classList.toggle('dark', mode === 'dark')
      }
    }

    window.addEventListener('message', handleMessage)

    // Fallback: If no token received after 1 second (standalone/dev mode),
    // use the configured API_KEY with a special prefix so fetchWithAuth
    // knows to use x-api-key header instead of Bearer token
    const fallbackTimeout = setTimeout(() => {
      if (!token) {
        if (import.meta.env.DEV) {
          console.info('[Auth] No iframe token received, using API_KEY for development')
        }
        setToken(`api-key:${API_KEY}`)
      }
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(fallbackTimeout)
    }
  }, [token])

  return (
    <AuthThemeContext.Provider value={{ token, theme }}>
      {children}
    </AuthThemeContext.Provider>
  )
}
