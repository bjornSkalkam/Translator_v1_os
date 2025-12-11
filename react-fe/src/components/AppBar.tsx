/**
 * src/components/AppBar.tsx
 */
import React from 'react'

interface AppBarProps {
  // onShowSettings: () => void
  //onShowSessions: () => void
  onFinishSession: () => void
}

const AppBar: React.FC<AppBarProps> = ({
  // onShowSettings,
  // onShowSessions,
  onFinishSession,
}) => {
  return (
    <div className="flex justify-between items-center p-4 text-white">
      <div className="text-lg font-bold text-black">
        Kalundborg Kommune logo
      </div>
      <div>
        <button
          onClick={onFinishSession}
          className="px-3 py-1 bg-red-500 rounded"
        >
          Afslut og opsummer samtale
        </button>
      </div>
    </div>
  )
}

export default AppBar
