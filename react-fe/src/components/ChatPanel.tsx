// src/components/ChatPanel.tsx
import React, { useRef, useEffect } from 'react'
import { Volume2, LogOut } from 'lucide-react'
import InputControls from './InputControls'
import logo from '../assets/white_logo.svg'

export interface ChatMessage {
  text: string
  sender: 'self' | 'other' | 'typing'
  tempId?: string
}

interface ChatPanelProps {
  header: string
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onRecord: (file: File) => Promise<string>
  onSpeak: (text: string) => void
  sendDisabled?: boolean
  micReady?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  showFinishSession: boolean | null
  showLogo: boolean | null
  onFinishSession: () => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  header,
  messages,
  inputValue,
  onInputChange,
  onSend,
  onRecord,
  onSpeak,
  sendDisabled,
  micReady,
  audioContext,
  preloadedStream,
  showFinishSession,
  showLogo,
  onFinishSession,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col bg-white rounded shadow h-full">
      {/* Header */}
      <div
        className="px-4 py-6 font-semibold border-b text-lg flex items-center justify-between bg-[#bc4d30] "
        style={{ height: 80 }}
      >
        <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-left">
          {showLogo && (
            <img src={logo} alt="Kalundborg Kommune logo" width={160} />
          )}
        </div>
        <span className="text-white">{header}</span>
        <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-right">
          {showFinishSession && (
            <button
              onClick={onFinishSession}
              className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Finish session"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          )}{' '}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => {
          /* typing bubble */
          if (msg.sender === 'typing') {
            return (
              <div
                key={msg.tempId ?? `typing-${idx}`}
                className="flex justify-start"
              >
                <div className="bg-gray-200 rounded-lg px-3 py-2 shadow max-w-xs">
                  <div className="flex space-x-1 animate-pulse">
                    <span className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full delay-100" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full delay-200" />
                  </div>
                </div>
              </div>
            )
          }

          /* regular message */
          return (
            <div
              key={msg.tempId ?? idx}
              className={`flex ${
                msg.sender === 'self' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex items-end space-x-1">
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs shadow ${
                    msg.sender === 'self'
                      ? 'bg-[#bc4d30] text-white'
                      : 'bg-gray-200 text-black'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Speak button (only if there is text) */}
                {msg.text && (
                  <button
                    onClick={() => onSpeak(msg.text)}
                    className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                    aria-label="Read aloud"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input / mic controls */}
      <InputControls
        micReady={micReady}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSend={onSend}
        onRecord={onRecord}
        disabled={sendDisabled}
        audioContext={audioContext}
        preloadedStream={preloadedStream}
      />
    </div>
  )
}

export default ChatPanel
