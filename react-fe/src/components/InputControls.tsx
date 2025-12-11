import React, { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import MicRecorderWithWaveform from './MicRecorderWithWaveform'

interface InputControlsProps {
  micReady?: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onRecord: (file: File) => Promise<string>
  disabled?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
}

const InputControls: React.FC<InputControlsProps> = ({
  micReady = false,
  inputValue,
  onInputChange,
  onSend,
  onRecord,
  disabled,
  audioContext,
  preloadedStream,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [waveformReady, setWaveformReady] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* --------------------------- helpers --------------------------- */
  const handleRecorded = async (file: File) => {
    setTranscribing(true)
    try {
      const text = await onRecord(file)
      onInputChange(text)
    } finally {
      setTranscribing(false)
    }
  }
  /* ---------------------------- view ----------------------------- */
  return (
    <div className="border-t bg-gray-50 py-4 flex flex-col items-center">
      {/* text-area + send ------------------------------------------ */}
      <div className="w-full max-w-2xl flex items-center gap-3 px-2">
        <div className="relative flex-1 flex items-center">
          {' '}
          {/* Added flex and items-center for vertical centering */}
          {isRecording ? (
            <div className="relative w-full h-[60px]">
              <canvas
                ref={canvasRef}
                width={600}
                height={60}
                className="w-full h-full rounded-full border border-gray-300 bg-white shadow-inner"
              />
              {!waveformReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500" />
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full min-h-[44px] max-h-40 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-60"
              rows={1}
              disabled={transcribing}
              placeholder="" /* language-agnostic */
            />
          )}
          {/* spinner overlay while transcribing -------------------- */}
          {transcribing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-full pointer-events-none">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500" />
            </div>
          )}
        </div>

        {/* send arrow --------------------------------------------- */}
        {!isRecording && (
          <button
            type="button"
            onClick={onSend}
            disabled={
              transcribing || disabled || inputValue.trim().length === 0
            }
            className="flex items-center justify-center h-11 w-11 bg-[#bc4d30] text-white rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* mic button ------------------------------------------------ */}
      <div className="mt-4 mb-6 md:mb-0">
        <MicRecorderWithWaveform
          micReady={micReady}
          onRecorded={handleRecorded}
          onRecordingStateChange={setIsRecording}
          onWaveformReady={setWaveformReady}
          canvasRef={canvasRef}
          preloadedAudioContext={audioContext}
          preloadedStream={preloadedStream}
        />
      </div>
    </div>
  )
}

export default InputControls
