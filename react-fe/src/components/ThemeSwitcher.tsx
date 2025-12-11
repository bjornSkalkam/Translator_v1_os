import { useTheme } from '../hooks/useTheme'

export const ThemeSwitcher = () => {
  const { setTheme, currentTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <div>Current: {currentTheme}</div>
    </div>
  )
}
