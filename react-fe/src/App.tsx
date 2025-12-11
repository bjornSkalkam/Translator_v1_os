import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import SessionView from './components/SessionView'
import LanguageModal, { Language } from './components/LanguageModal'
import AllSessions from './components/AllSessions'
import { API_URL, API_KEY } from './config'
import { useMicPreloader } from './hooks/useMicPreloader'
import SessionRecap from './components/SessionRecap'
import { useFetchWithAuth } from './lib/fetchWithAuth'
import Settings from './components/Settings'

export interface SessionData {
  session_id: string
  status: string
  language_a: Language
  language_b: Language
  model_a: any
  model_b: any
}

const AppContent: React.FC = () => {
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const navigate = useNavigate()
  const { fetchWithAuth } = useFetchWithAuth()

  // Pre-initialize mic on mount (so that mic is "warm" when used in the UI)
  const { micReady, audioContextRef, streamRef } = useMicPreloader()

  useEffect(() => {
    // Show language selection modal on mount
    setShowModal(true)
  }, [])

  const onSessionCreated = (session: SessionData) => {
    setActiveSession(session)
    setShowModal(false)
  }

  const finishSession = async () => {
    if (!activeSession) return

    await fetchWithAuth(`${API_URL}/sessions/finish-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ session_id: activeSession.session_id }),
    })

    const res = await fetchWithAuth(
      `${API_URL}/sessions/recap?session_id=${activeSession.session_id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      },
    )
    const data = await res.json()

    setActiveSession(null)
    navigate('/recap', { state: { summary: data.summary } })
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <SessionView
          sessionData={activeSession}
          micReady={micReady}
          audioContext={audioContextRef.current}
          preloadedStream={streamRef.current}
          onFinishSession={finishSession}
        />
      </div>

      {!activeSession && showModal && (
        <LanguageModal onSessionCreated={onSessionCreated} />
      )}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/sessions" element={<AllSessions />} />
        <Route path="/recap" element={<SessionRecap />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
