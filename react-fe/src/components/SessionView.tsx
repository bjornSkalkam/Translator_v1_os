import React, { useEffect, useState } from 'react'
import ChatPanel, { ChatMessage } from './ChatPanel'
import { SessionData } from '../App'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'
import { useTTS } from '../hooks/useTTS'

interface Translation {
  created_at: string
  from: string
  to: string
  original: string
  translated: string
  tempId?: string
}

interface SessionViewProps {
  sessionData: SessionData | null
  micReady?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  onFinishSession: () => void
}

const SessionView: React.FC<SessionViewProps> = ({
  sessionData,
  micReady,
  audioContext,
  preloadedStream,
  onFinishSession,
}) => {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [processingA, setProcessingA] = useState(false)
  const [processingB, setProcessingB] = useState(false)
  const { fetchWithAuth } = useFetchWithAuth()
  const speak = useTTS()

  const [mobileView, setMobileView] = useState<'A' | 'B'>('A')
  const switchMobileView = () => {
    setMobileView((prev) => (prev === 'A' ? 'B' : 'A'))
  }

  useEffect(() => {
    if (!sessionData) return

    const fetchSession = async () => {
      const res = await fetchWithAuth(
        `${API_URL}/sessions/${sessionData.session_id}`,
        {
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        },
      )
      const data = await res.json()

      if (data.translations) {
        setTranslations((prev) => {
          const real = data.translations
          const optimistic = prev.filter((msg) => msg.tempId)

          // Keep optimistic messages that haven’t been fulfilled yet
          const stillPending = optimistic.filter(
            (opt) =>
              !real.some(
                (realMsg: { original: string; from: string; to: string }) =>
                  realMsg.original === opt.original &&
                  realMsg.from === opt.from &&
                  realMsg.to === opt.to,
              ) && !opt.tempId?.includes('-typing'), // remove typing if real message is in
          )

          return [...real, ...stillPending]
        })
      }

      setProcessingA(false)
      setProcessingB(false)
    }

    fetchSession()
    const interval = setInterval(fetchSession, 1000)
    return () => clearInterval(interval)
  }, [sessionData])

  if (!sessionData) {
    return <div className="p-4">No active session.</div>
  }

  const leftMessages: ChatMessage[] = translations.map((t) => {
    if (
      t.original === '' &&
      t.translated === '' &&
      t.tempId?.includes('-typing')
    ) {
      return { text: '', sender: 'typing', tempId: t.tempId }
    }
    const isSelf = t.from === sessionData.language_a.code
    return {
      text: t.to === sessionData.language_a.code ? t.translated : t.original,
      sender: isSelf ? 'self' : 'other',
    }
  })

  const rightMessages: ChatMessage[] = translations.map((t) => {
    if (
      t.original === '' &&
      t.translated === '' &&
      t.tempId?.includes('-typing')
    ) {
      return { text: '', sender: 'typing', tempId: t.tempId }
    }
    const isSelf = t.from === sessionData.language_b.code
    return {
      text: t.to === sessionData.language_b.code ? t.translated : t.original,
      sender: isSelf ? 'self' : 'other',
    }
  })

  const sendMessage = async (
    fromLang: string,
    toLang: string,
    text?: string,
    audioFile?: File,
  ) => {
    const formData = new FormData()
    formData.append('session_id', sessionData.session_id)
    formData.append('from', fromLang)
    formData.append('to', toLang)
    if (text) formData.append('text', text)
    if (audioFile) formData.append('audio', audioFile)

    await fetchWithAuth(`${API_URL}/sessions/translate`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    })
  }

  const transcribeOnly = async (lang: string, file: File): Promise<string> => {
    if (!sessionData) return ''
    const formData = new FormData()
    formData.append('from', lang)
    formData.append('audio', file)

    const res = await fetchWithAuth(`${API_URL}/sessions/transcribe`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    })
    if (!res.ok) {
      const errText = await res.text()
      alert(`[SessionView] Transcription error: ${errText}`)
      return ''
    }
    const data = await res.json()
    return data.original || ''
  }

  const handleSendA = async () => {
    const tempId = `temp-${Date.now()}`
    setProcessingA(true)

    setTranslations((prev) => [
      ...prev,
      {
        created_at: new Date().toISOString(),
        from: sessionData.language_a.code,
        to: sessionData.language_b.code,
        original: inputA,
        translated: '',
        tempId,
      },
      {
        created_at: new Date().toISOString(),
        from: sessionData.language_b.code,
        to: sessionData.language_a.code,
        original: '',
        translated: '',
        tempId: `${tempId}-typing`,
      },
    ])

    await sendMessage(
      sessionData.language_a.code,
      sessionData.language_b.code,
      inputA,
    )
    setInputA('')
  }

  const handleSendB = async () => {
    const tempId = `temp-${Date.now()}`
    setProcessingB(true)

    setTranslations((prev) => [
      ...prev,
      {
        created_at: new Date().toISOString(),
        from: sessionData.language_b.code,
        to: sessionData.language_a.code,
        original: inputB,
        translated: '',
        tempId,
      },
      {
        created_at: new Date().toISOString(),
        from: sessionData.language_a.code,
        to: sessionData.language_b.code,
        original: '',
        translated: '',
        tempId: `${tempId}-typing`,
      },
    ])

    await sendMessage(
      sessionData.language_b.code,
      sessionData.language_a.code,
      inputB,
    )
    setInputB('')
  }

  const onRecordForLanguageA = async (file: File): Promise<string> => {
    return await transcribeOnly(sessionData.language_a.code, file)
  }

  const onRecordForLanguageB = async (file: File): Promise<string> => {
    return await transcribeOnly(sessionData.language_b.code, file)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="hidden md:grid md:grid-cols-2 gap-0 flex-1 overflow-hidden">
        <ChatPanel
          header={`${sessionData.language_a.english_name} (${sessionData.language_a.native_name})`}
          messages={leftMessages}
          inputValue={inputA}
          onInputChange={setInputA}
          onSend={handleSendA}
          onRecord={async (file) => {
            const recognized = await onRecordForLanguageA(file)
            setInputA(recognized)
            return recognized
          }}
          sendDisabled={processingA}
          micReady={micReady}
          audioContext={audioContext}
          preloadedStream={preloadedStream}
          onFinishSession={onFinishSession}
          showFinishSession={false}
          showLogo={true}
          onSpeak={(txt) => speak(txt, sessionData.language_a.code)}
        />

        <ChatPanel
          header={`${sessionData.language_b.english_name} (${sessionData.language_b.native_name})`}
          messages={rightMessages}
          inputValue={inputB}
          onInputChange={setInputB}
          onSend={handleSendB}
          onRecord={async (file) => {
            const recognized = await onRecordForLanguageB(file)
            setInputB(recognized)
            return recognized
          }}
          sendDisabled={processingB}
          micReady={micReady}
          audioContext={audioContext}
          preloadedStream={preloadedStream}
          onFinishSession={onFinishSession}
          showFinishSession={true}
          showLogo={false}
          onSpeak={(txt) => speak(txt, sessionData.language_b.code)}
        />
      </div>

      <div className="block md:hidden flex-1 overflow-hidden">
        {mobileView === 'A' ? (
          <ChatPanel
            header={`${sessionData.language_a.english_name} (${sessionData.language_a.native_name})`}
            messages={leftMessages}
            inputValue={inputA}
            onInputChange={setInputA}
            onSend={handleSendA}
            onRecord={async (file) => {
              const recognized = await onRecordForLanguageA(file)
              setInputA(recognized)
              return recognized
            }}
            sendDisabled={processingA}
            micReady={micReady}
            audioContext={audioContext}
            preloadedStream={preloadedStream}
            onFinishSession={onFinishSession}
            showFinishSession={true}
            showLogo={true}
            onSpeak={(txt) => speak(txt, sessionData.language_a.code)}
          />
        ) : (
          <ChatPanel
            header={`${sessionData.language_b.english_name} (${sessionData.language_b.native_name})`}
            messages={rightMessages}
            inputValue={inputB}
            onInputChange={setInputB}
            onSend={handleSendB}
            onRecord={async (file) => {
              const recognized = await onRecordForLanguageB(file)
              setInputB(recognized)
              return recognized
            }}
            sendDisabled={processingB}
            micReady={micReady}
            audioContext={audioContext}
            preloadedStream={preloadedStream}
            onFinishSession={onFinishSession}
            showFinishSession={true}
            showLogo={true}
            onSpeak={(txt) => speak(txt, sessionData.language_b.code)}
          />
        )}
        <div className="absolute left-1/4 bottom-[10px] flex justify-center w-1/2">
          <button
            onClick={switchMobileView}
            className="px-4 py-2 border border-[#bc4d30] text-[#bc4d30] rounded hover:bg-[#bc4d30] hover:text-white transition"
          >
            {mobileView === 'A'
              ? `Switch to ${sessionData.language_b.english_name}`
              : `Switch to ${sessionData.language_a.english_name}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionView
