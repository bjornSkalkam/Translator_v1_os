import { useAuthTheme } from '../context/AuthThemeContext'

export const useTheme = () => {
  const { theme } = useAuthTheme()

  const setTheme = (mode: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(mode)
  }

  return { currentTheme: theme, setTheme }
}
